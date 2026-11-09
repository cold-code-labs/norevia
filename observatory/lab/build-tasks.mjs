// LAB-001 task builder. Merges validated Observatory packages (b01–b21, c01–c17) into larger repositories.
// Per-package split: probe/ = the package's original visible tests (the only signal agents see),
// final/ = the package's hidden tests (scoring only). Writes lab/tasks/<id>/{src,solution,probe,final,task.json} and lab/tasks/index.json.
// Usage: node lab/build-tasks.mjs
import fs from 'node:fs'; import path from 'node:path';
import { listFiles } from '../lib/testrun.mjs';
const OBS = '/data/OpenBot/Shared/Norevia/norevia/observatory/tasks', OUT = '/data/OpenBot/Shared/Norevia/norevia/observatory/lab/tasks';
const manifest = JSON.parse(fs.readFileSync(path.join(OBS, 'manifest.json'), 'utf8')).tasks;
const B = (...n) => n.map((x) => 'b' + String(x).padStart(2, '0'));
const C = (...n) => n.map((x) => 'c' + String(x).padStart(2, '0'));
export const DEFS = {
  // mid-size: 3–5 packages, harder bases first
  lm01: [...B(16, 17, 19, 20)], lm02: [...B(18, 21, 10, 12)], lm03: [...B(11, 13, 14, 15)], lm04: [...B(17, 19, 21, 13)], lm05: [...B(16, 20, 11, 15)],
  lm06: [...C(10, 12, 13)], lm07: [...C(11, 14, 15)], lm08: [...C(16, 17, 10, 14)], lm09: [...C(12, 13, 15, 17)], lm10: [...C(11, 16, 14, 12)],
  lm11: ['b16', 'c12', 'b19', 'c17'], lm12: ['b20', 'c13', 'b17', 'c15'], lm13: ['b18', 'c10', 'b21', 'c16'], lm14: ['b14', 'c14', 'b15', 'c11'], lm15: ['b10', 'c13', 'b12', 'c16'], lm16: ['b11', 'c15', 'b13', 'c17'],
  lm17: [...C(2, 4, 6, 8, 9)], lm18: [...B(4, 6, 8, 9, 3)], lm19: [...B(19, 20, 21, 18, 17)], lm20: [...C(10, 11, 12, 13, 14)], lm21: ['b16', 'b18', 'b20', 'c15', 'c17'], lm22: ['b12', 'b14', 'b10', 'c14', 'c16'],
  // cost-probe only (excluded from the main set)
  lp01: [...B(1, 2, 3)], lp02: [...B(4, 5, 6, 7, 8, 9), ...C(1, 3, 5)],
  // multi-repo: 8–14 packages, exceed one comfortable context
  lx01: [...B(16, 17, 19, 20), ...C(10, 12, 13, 15)],
  lx02: [...B(18, 21, 10, 11), ...C(11, 14, 16, 17), 'b13'],
  lx03: [...B(12, 14, 15, 1, 2), ...C(1, 3, 5, 7, 9)],
  lx04: [...C(10, 11, 12, 13, 14, 15, 16, 17), ...B(19, 20)],
  lx05: [...B(16, 17, 18, 19, 20, 21), ...C(10, 11, 12, 13, 14, 15)],
  lx06: [...B(10, 11, 12, 13, 14, 15), ...C(2, 4, 6, 8, 16, 17)],
  lx07: [...B(1, 2, 3, 4, 5, 6, 7), ...C(1, 2, 3, 4, 5, 6, 7)],
  lx08: [...B(16, 17, 19, 20, 10, 11, 13), ...C(10, 11, 12, 14, 16)].slice(0, 12),
  // replacements added after calibration showed a ~5× price jump above ~100k input tokens (lx04, lx05, lx06, lx08 retired, see PREREG amendment 1): 8–9 packages, whole-repo prompt below ~195k chars
  lx09: [...B(18, 21, 1, 2), ...C(11, 14, 16, 17)],
  lx10: [...B(10, 11, 12, 13, 14, 15), ...C(2, 4)],
  lx11: [...B(16, 19, 20, 5, 6, 7), ...C(10, 12, 13)],
  lx12: [...B(17, 20, 4, 9), ...C(11, 12, 13, 15, 17)],
};
const RETIRED = ['lx04', 'lx05', 'lx06', 'lx08'];
const pkgName = (id) => id.replace(/^[a-z]+\d+-/, '');
const baseDir = (b) => fs.readdirSync(OBS).find((d) => d.startsWith(b + '-'));
const rewriteImports = (code, pkg) => code.replace(/(['"])\.\.\/src\//g, `$1../src/${pkg}/`);
const out = {};
fs.mkdirSync(OUT, { recursive: true });
for (const [id, bases] of Object.entries(DEFS)) {
  const dir = path.join(OUT, id); fs.rmSync(dir, { recursive: true, force: true });
  for (const sub of ['src', 'solution', 'probe', 'final']) fs.mkdirSync(path.join(dir, sub), { recursive: true });
  const pkgs = [], expected = {}; const seen = new Set();
  for (const b of bases) {
    const bd = baseDir(b); const name = pkgName(bd); if (seen.has(name)) throw new Error(id + ' duplicate package ' + name); seen.add(name);
    const meta = JSON.parse(fs.readFileSync(path.join(OBS, bd, 'task.json'), 'utf8')); const mf = manifest[bd];
    for (const sub of ['src', 'solution']) for (const f of listFiles(path.join(OBS, bd, sub))) { const dst = path.join(dir, sub, name, f); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(path.join(OBS, bd, sub, f), dst); }
    for (const [from, to, pref] of [['visible', 'probe', 'v-'], ['test', 'final', '']]) for (const f of listFiles(path.join(OBS, bd, from))) {
      const nm = `${name}__${pref}${f}`; fs.writeFileSync(path.join(dir, to, nm), rewriteImports(fs.readFileSync(path.join(OBS, bd, from, f), 'utf8'), name));
      const e = mf.expected?.[`${from}/${f}`]; if (e) expected[`${to}/${nm}`] = e;
    }
    const srcFiles = listFiles(path.join(OBS, bd, 'src')).map((f) => `src/${name}/${f}`);
    const loc = srcFiles.reduce((s, f) => s + fs.readFileSync(path.join(dir, f), 'utf8').split('\n').length, 0);
    pkgs.push({ name, base: bd, class: meta.class, title: meta.title, statement: meta.statement.replace(/\bsrc\//g, `src/${name}/`), nBugs: meta.bugs.length, srcFiles, loc });
  }
  const k = pkgs.length;
  const statement = `This repository merges ${k} independent packages (none imports another). Reported defects exist in several of them; the visible tests cover only part of each package. Fix the whole repository so that every package meets its specification.\n\n` + pkgs.map((p) => `## Package \`src/${p.name}/\` — ${p.title}\n\n${p.statement}`).join('\n\n---\n\n');
  const tier = id.startsWith('lp') ? 'probe' : k >= 8 ? 'multi' : 'mid';
  fs.writeFileSync(path.join(dir, 'task.json'), JSON.stringify({ id, tier, k, pkgs, statement }, null, 1));
  const sz = (sub) => listFiles(path.join(dir, sub)).reduce((a, f) => a + fs.readFileSync(path.join(dir, sub, f), 'utf8').length, 0);
  const promptChars = statement.length + sz('src') + sz('probe');
  out[id] = { tier, k, packages: pkgs.map((p) => p.name), loc: pkgs.reduce((s, p) => s + p.loc, 0), statementChars: statement.length, promptChars, ...(RETIRED.includes(id) ? { retired: 'whole-repo prompt above ~195k chars (long-context price tier)' } : {}), expected };
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(out, null, 1));
for (const [id, x] of Object.entries(out)) console.log(id, x.tier, 'k=' + x.k, 'loc=' + x.loc, 'promptChars=' + x.promptChars, x.retired ? 'RETIRED' : '');
