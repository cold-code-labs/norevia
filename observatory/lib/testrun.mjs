// Test sandbox: copies the task src/, overlays proposed files, runs each test
// file with node:test under the permission model (read-only access to the
// sandbox dir, no writes, no child_process) with a timeout.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const OBS_DIR = path.resolve(HERE, '..');
export const TMP_DIR = path.join(OBS_DIR, 'runs', 'tmp');

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

export function listFiles(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p, base)); else out.push(path.relative(base, p));
  }
  return out.sort();
}

function runOne(file, cwd, timeoutMs) {
  return new Promise((resolve) => {
    const args = ['--experimental-permission', `--allow-fs-read=${cwd}`, '--test-reporter=tap', file];
    const child = spawn(process.execPath, args, { cwd, env: { PATH: process.env.PATH, NODE_NO_WARNINGS: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '', timedOut = false;
    child.stdout.on('data', (d) => { if (out.length < 400000) out += d; });
    child.stderr.on('data', (d) => { if (err.length < 50000) err += d; });
    const t = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, timeoutMs);
    child.on('close', (code) => { clearTimeout(t); resolve({ code, out, err, timedOut }); });
  });
}

// Extracts failures (name + message) from TAP output for model feedback.
function parseTap(out) {
  const num = (k) => { const m = out.match(new RegExp(`^# ${k} (\\d+)`, 'm')); return m ? Number(m[1]) : null; };
  const failures = [];
  const lines = out.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*not ok \d+ - (.*)$/);
    if (!m) continue;
    let msg = '';
    for (let j = i + 1; j < Math.min(lines.length, i + 40); j++) {
      if (/^\s*\.\.\.\s*$/.test(lines[j])) break;
      const em = lines[j].match(/^\s*error: (.*)$/);
      if (em) {
        msg = em[1];
        if (/^\|-?$/.test(msg.trim())) { msg = ''; for (let k = j + 1; k < Math.min(lines.length, j + 12); k++) { if (/^\s*(code|name|expected|actual|operator|stack|failureType):/.test(lines[k])) break; msg += lines[k].trim() + ' '; } }
        break;
      }
    }
    failures.push({ name: m[1].trim(), message: msg.trim().slice(0, 400) });
  }
  return { tests: num('tests'), pass: num('pass'), fail: num('fail'), failures };
}

/**
 * @param {object} o
 * @param {string} o.taskDir task directory
 * @param {Record<string,string>} [o.overlay] relative path (e.g. 'src/x.mjs') -> content
 * @param {boolean} [o.useSolution] overlay solution/ (validation)
 * @param {('visible'|'test')[]} [o.suites]
 * @param {Record<string,number>} [o.expected] expected number of tests per file (to detect crashes)
 */
export async function runTask({ taskDir, overlay = {}, useSolution = false, suites = ['visible', 'test'], expected = null, timeoutMs = 20000 }) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const sb = path.join(TMP_DIR, 'sb-' + randomBytes(6).toString('hex'));
  try {
    copyDir(path.join(taskDir, 'src'), path.join(sb, 'src'));
    if (useSolution) copyDir(path.join(taskDir, 'solution'), path.join(sb, 'src'));
    for (const [rel, content] of Object.entries(overlay)) {
      const p = path.resolve(sb, rel);
      if (!p.startsWith(path.join(sb, 'src') + path.sep)) throw new Error('overlay outside src/: ' + rel);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, content);
    }
    const result = {};
    for (const suite of suites) {
      const sdir = path.join(taskDir, suite);
      copyDir(sdir, path.join(sb, suite));
      const files = listFiles(sdir).filter((f) => f.endsWith('.test.mjs'));
      const agg = { files: {}, pass: 0, fail: 0, total: 0, failures: [], timedOut: false };
      for (const f of files) {
        const rel = path.join(suite, f);
        const r = await runOne(path.join(sb, rel), sb, timeoutMs);
        const t = parseTap(r.out);
        const exp = expected?.[rel] ?? null;
        let pass = t.pass ?? 0, total = Math.max(t.tests ?? 0, exp ?? 0);
        if (r.timedOut) { pass = 0; agg.timedOut = true; }
        if (total === 0) total = 1; // a file that failed to load counts as 1 failure
        const fail = total - pass;
        agg.files[rel] = { pass, total, timedOut: r.timedOut, code: r.code };
        agg.pass += pass; agg.fail += fail; agg.total += total;
        for (const x of t.failures) agg.failures.push({ file: rel, ...x });
        if (r.timedOut) agg.failures.push({ file: rel, name: '(timeout)', message: `test file exceeded ${timeoutMs}ms` });
        else if ((t.tests ?? 0) === 0 || (exp && t.tests < exp)) {
          const errTxt = (r.err + '\n' + r.out).split('\n').filter((l) => /Error|error|at file/.test(l)).slice(0, 6).join(' | ');
          agg.failures.push({ file: rel, name: '(load error)', message: errTxt.slice(0, 500) });
        }
      }
      agg.allPass = agg.fail === 0 && agg.total > 0;
      result[suite] = agg;
    }
    return result;
  } finally {
    fs.rmSync(sb, { recursive: true, force: true });
  }
}
