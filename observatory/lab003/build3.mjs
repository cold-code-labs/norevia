// LAB-003 Step 0 builder. node lab003/build3.mjs packages   → pkgs.json (per base package: hidden cases, which reveal a bug, bugs, LOC)
// compose(id, pkgNames, share) → tasks/<id>/ with probe = original visible tests + `share` of the hidden cases (stratified: bug-revealing and guard cases separately,
// spread deterministically, at least one revealing case kept unseen when there are ≥ 2); final = the FULL original hidden suite (acceptance = every hidden test passes).
import fs from 'node:fs'; import path from 'node:path';
import { runTask3 } from './testrun3.mjs'; import { listFiles } from '../lib/testrun.mjs';
export const OBS = '/data/OpenBot/Shared/Norevia/norevia/observatory/tasks', HERE = '/data/OpenBot/Shared/Norevia/norevia/observatory/lab003', TASKS = path.join(HERE, 'tasks'), PKGS = path.join(HERE, 'pkgs.json');
const manifest = JSON.parse(fs.readFileSync(path.join(OBS, 'manifest.json'), 'utf8')).tasks;
export const baseIds = () => fs.readdirSync(OBS).filter((d) => /^[bc]\d\d-/.test(d)).sort();
const pkgName = (id) => id.replace(/^[a-z]+\d+-/, ''); const rewrite = (code, pkg) => code.replace(/(['"])\.\.\/src\//g, `$1../src/${pkg}/`);
const copy = (a, b) => { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(a, b); };
export async function buildPackages() {
  const out = {};
  for (const id of baseIds()) {
    const dir = path.join(OBS, id), meta = JSON.parse(fs.readFileSync(path.join(dir, 'task.json'), 'utf8')), name = pkgName(id);
    const [bug, ref, bugVis] = await Promise.all([runTask3({ taskDir: dir, suites: ['test'] }), runTask3({ taskDir: dir, suites: ['test'], useSolution: true }), runTask3({ taskDir: dir, suites: ['visible'] })]);
    const files = {}; let nRev = 0, nCases = 0;
    for (const [rel, cs] of Object.entries(ref.test.cases)) { const b = Object.fromEntries((bug.test.cases[rel] || []).map((c) => [c.name, c.ok])); files[path.basename(rel)] = cs.map((c) => ({ name: c.name, rev: b[c.name] === false })); nCases += cs.length; nRev += files[path.basename(rel)].filter((c) => c.rev).length; }
    const refOk = ref.test.allPass; const loc = listFiles(path.join(dir, 'src')).reduce((s, f) => s + fs.readFileSync(path.join(dir, 'src', f), 'utf8').split('\n').length, 0);
    out[name] = { base: id, class: meta.class, title: meta.title, loc, nBugs: meta.bugs.length, nCases, nRev, referencePasses: refOk, visibleBuggy: `${bugVis.visible.pass}/${bugVis.visible.total}`, visibleExpected: Object.fromEntries(Object.entries(bugVis.visible.files).map(([k, v]) => [path.basename(k), v.total])), files };
  }
  fs.writeFileSync(PKGS, JSON.stringify(out, null, 1)); return out;
}
export const loadPkgs = () => JSON.parse(fs.readFileSync(PKGS, 'utf8'));
// Agent-visible text of a probe file: prelude (imports and top-level constants before the first test) + only the selected test units (the unseen cases are never shown).
export function viewOf(code, selected, allNames) { const lines = code.split('\n'); const starts = []; lines.forEach((l, i) => { const m = l.match(/^test\(\s*(['"`])((?:\\.|(?!\1).)*)\1/); if (m) starts.push({ i, name: m[2].replace(/\\(['"`\\])/g, '$1') }); });
  const missing = allNames.filter((n) => !starts.some((s) => s.name === n)); if (missing.length) throw new Error('viewOf: cases not found in source: ' + missing.slice(0, 3).join(' | '));
  const pre = lines.slice(0, starts[0].i).join('\n'); const units = starts.map((s, j) => ({ name: s.name, text: lines.slice(s.i, j + 1 < starts.length ? starts[j + 1].i : lines.length).join('\n') })); return [pre, ...units.filter((u) => selected.includes(u.name)).map((u) => u.text)].join('\n'); }
// stratified share selection
export function pick(cases, s) { const sel = (arr) => { const n = arr.length; const keep = arr.map((_, i) => Math.floor((i + 1) * s + 0.5) > Math.floor(i * s + 0.5)); return keep; };
  const rev = cases.filter((c) => c.rev), grd = cases.filter((c) => !c.rev); const kr = sel(rev), kg = sel(grd);
  if (rev.length >= 2 && kr.every(Boolean)) kr[kr.length - 1] = false; if (rev.length >= 1 && !kr.some(Boolean) && s > 0) kr[0] = true;
  const chosen = new Set([...rev.filter((_, i) => kr[i]), ...grd.filter((_, i) => kg[i])].map((c) => c.name)); return cases.filter((c) => chosen.has(c.name)).map((c) => c.name); }
export function compose(id, names, share, pk = loadPkgs()) {
  const dir = path.join(TASKS, id); fs.rmSync(dir, { recursive: true, force: true }); for (const d of ['src', 'solution', 'probe', 'final']) fs.mkdirSync(path.join(dir, d), { recursive: true });
  const pkgs = [], spec = {}, expected = {}, probeView = {}; let statementParts = [];
  for (const name of names) {
    const p = pk[name], bd = path.join(OBS, p.base), meta = JSON.parse(fs.readFileSync(path.join(bd, 'task.json'), 'utf8'));
    for (const sub of ['src', 'solution']) for (const f of listFiles(path.join(bd, sub))) copy(path.join(bd, sub, f), path.join(dir, sub, name, f));
    for (const f of listFiles(path.join(bd, 'visible'))) { const nm = `${name}__v-${f}`; fs.writeFileSync(path.join(dir, 'probe', nm), rewrite(fs.readFileSync(path.join(bd, 'visible', f), 'utf8'), name)); expected[`probe/${nm}`] = p.visibleExpected[f]; }
    for (const [f, cs] of Object.entries(p.files)) { const code = rewrite(fs.readFileSync(path.join(bd, 'test', f), 'utf8'), name); fs.writeFileSync(path.join(dir, 'final', `${name}__${f}`), code); expected[`final/${name}__${f}`] = cs.length;
      const sel = pick(cs, share); const nm = `${name}__p-${f}`; fs.writeFileSync(path.join(dir, 'probe', nm), code); spec[`probe/${nm}`] = sel; probeView[`probe/${nm}`] = viewOf(code, sel, cs.map((c) => c.name)); expected[`probe/${nm}`] = sel.length; }
    const srcFiles = listFiles(path.join(bd, 'src')).map((f) => `src/${name}/${f}`);
    pkgs.push({ name, base: p.base, class: p.class, title: meta.title, statement: meta.statement.replace(/\bsrc\//g, `src/${name}/`), srcFiles, loc: p.loc });
  }
  const statement = `This repository merges ${pkgs.length} independent package${pkgs.length > 1 ? 's' : ''} (none imports another). Reported defects exist in ${pkgs.length > 1 ? 'several of them' : 'it'}; the visible tests cover only part of each package. Fix the whole repository so that every package meets its specification.\n\n` + pkgs.map((p) => `## Package \`src/${p.name}/\` — ${p.title}\n\n${p.statement}`).join('\n\n---\n\n');
  const sz = (sub) => listFiles(path.join(dir, sub)).reduce((a, f) => a + fs.readFileSync(path.join(dir, sub, f), 'utf8').length, 0);
  const meta = { id, k: pkgs.length, share, packages: names, pkgs, statement, spec, expected, probeView, promptChars: statement.length + sz('src') + sz('probe') };
  fs.writeFileSync(path.join(dir, 'task.json'), JSON.stringify(meta)); return meta;
}
export const specFor = (pk, names, share) => { const spec = {}; for (const name of names) for (const [f, cs] of Object.entries(pk[name].files)) spec[`probe/${name}__p-${f}`] = pick(cs, share); return spec; };
export const loadTask3 = (id) => { const dir = path.join(TASKS, id); const meta = JSON.parse(fs.readFileSync(path.join(dir, 'task.json'), 'utf8')); const read = (sub) => Object.fromEntries(listFiles(path.join(dir, sub)).map((f) => [`${sub}/${f}`, fs.readFileSync(path.join(dir, sub, f), 'utf8')])); return { ...meta, dir, src: read('src'), probe: read('probe'), final: read('final') }; };
if (process.argv[2] === 'packages') { const out = await buildPackages(); for (const [n, p] of Object.entries(out)) console.log(n.padEnd(22), p.class, 'loc', String(p.loc).padStart(4), 'bugs', p.nBugs, 'cases', String(p.nCases).padStart(2), 'revealing', String(p.nRev).padStart(2), 'visibleBuggy', p.visibleBuggy, p.referencePasses ? '' : 'REFERENCE-FAILS'); const tot = Object.values(out); console.log(tot.length, 'packages; revealing cases', tot.reduce((s, p) => s + p.nRev, 0), 'of', tot.reduce((s, p) => s + p.nCases, 0)); }
