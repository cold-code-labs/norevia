// LAB-003 test runner: like lib/testrun.mjs but (a) per-case results from top-level TAP lines and (b) optional case-name filters per file
// (node --test-name-pattern, anchored exact names) so that a probe can show a subset of a hidden test file's cases while final runs the whole file.
import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process'; import { randomBytes } from 'node:crypto';
import { listFiles } from '../lib/testrun.mjs';
export const TMP = '/data/OpenBot/Shared/Norevia/norevia/observatory/runs/tmp3';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function copyDir(a, b) { fs.mkdirSync(b, { recursive: true }); for (const e of fs.readdirSync(a, { withFileTypes: true })) { const s = path.join(a, e.name), d = path.join(b, e.name); e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d); } }
function runOne(file, cwd, ms, names) {
  return new Promise((res) => {
    const args = ['--experimental-permission', `--allow-fs-read=${cwd}`, '--test-reporter=tap', ...(names ? names.flatMap((n) => [`--test-name-pattern=^${esc(n)}$`]) : []), file];
    const c = spawn(process.execPath, args, { cwd, env: { PATH: process.env.PATH, NODE_NO_WARNINGS: '1' }, stdio: ['ignore', 'pipe', 'pipe'] }); let out = '', err = '', to = false;
    c.stdout.on('data', (d) => { if (out.length < 400000) out += d; }); c.stderr.on('data', (d) => { if (err.length < 50000) err += d; });
    const t = setTimeout(() => { to = true; c.kill('SIGKILL'); }, ms); c.on('close', (code) => { clearTimeout(t); res({ code, out, err, to }); });
  });
}
export function parseCases(out) {
  const cases = [], failures = []; const lines = out.split('\n');
  for (let i = 0; i < lines.length; i++) { const m = lines[i].match(/^(not )?ok \d+ - (.*?)(?: # (SKIP|TODO).*)?$/); if (!m || m[3]) continue; const ok = !m[1]; cases.push({ name: m[2].trim(), ok });
    if (!ok) { let msg = ''; for (let j = i + 1; j < Math.min(lines.length, i + 40); j++) { if (/^\s*\.\.\.\s*$/.test(lines[j])) break; const em = lines[j].match(/^\s*error: (.*)$/); if (em) { msg = em[1]; if (/^\|-?$/.test(msg.trim())) { msg = ''; for (let k = j + 1; k < Math.min(lines.length, j + 12); k++) { if (/^\s*(code|name|expected|actual|operator|stack|failureType):/.test(lines[k])) break; msg += lines[k].trim() + ' '; } } break; } } failures.push({ name: m[2].trim(), message: msg.trim().slice(0, 400) }); } }
  return { cases, failures };
}
// spec: { 'probe/<file>': [case names] } restricts those files to the named cases. expected: { 'probe/<file>': n } crash detection.
export async function runTask3({ taskDir, overlay = {}, useSolution = false, suites = ['probe', 'final'], spec = {}, expected = {}, only = null, timeoutMs = 20000 }) {
  fs.mkdirSync(TMP, { recursive: true }); const sb = path.join(TMP, 'sb-' + randomBytes(6).toString('hex'));
  try {
    copyDir(path.join(taskDir, 'src'), path.join(sb, 'src')); if (useSolution) copyDir(path.join(taskDir, 'solution'), path.join(sb, 'src'));
    for (const [rel, content] of Object.entries(overlay)) { const p = path.resolve(sb, rel); if (!p.startsWith(path.join(sb, 'src') + path.sep)) throw new Error('overlay outside src/: ' + rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content); }
    const result = {};
    for (const suite of suites) {
      const sdir = path.join(taskDir, suite); copyDir(sdir, path.join(sb, suite)); const agg = { files: {}, pass: 0, fail: 0, total: 0, failures: [], cases: {}, timedOut: false };
      const files = listFiles(sdir).filter((f) => f.endsWith('.test.mjs') && (!only || only(f)) && !(spec[path.join(suite, f)] && spec[path.join(suite, f)].length === 0));   // a file whose case list is empty is not run
      const runs = await Promise.all(files.map(async (f) => { const rel = path.join(suite, f); return { f, rel, r: await runOne(path.join(sb, rel), sb, timeoutMs, spec[rel] || null) }; }));
      for (const { rel, r } of runs) {
        const t = parseCases(r.out); const want = spec[rel] ? spec[rel].length : (expected[rel] ?? null);
        const pass = r.to ? 0 : t.cases.filter((c) => c.ok).length; let total = Math.max(t.cases.length, want ?? 0); if (r.to) agg.timedOut = true; if (total === 0) total = 1;
        agg.files[rel] = { pass, total }; agg.cases[rel] = t.cases; agg.pass += pass; agg.fail += total - pass; agg.total += total;
        for (const x of t.failures) agg.failures.push({ file: rel, ...x });
        if (r.to) agg.failures.push({ file: rel, name: '(timeout)', message: `test file exceeded ${timeoutMs}ms` });
        else if (t.cases.length === 0 || (want && t.cases.length < want)) agg.failures.push({ file: rel, name: '(load error)', message: (r.err + '\n' + r.out).split('\n').filter((l) => /Error|error|at file/.test(l)).slice(0, 6).join(' | ').slice(0, 500) });
      }
      agg.allPass = agg.fail === 0 && agg.total > 0; result[suite] = agg;
    }
    return result;
  } finally { fs.rmSync(sb, { recursive: true, force: true }); }
}
