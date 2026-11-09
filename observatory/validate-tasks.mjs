#!/usr/bin/env node
// Validates the suite: for every task the buggy version must FAIL (visible and hidden)
// and the reference solution must PASS everything. Writes tasks/manifest.json with
// per-file test counts (used by the harness to detect crashes).
// Usage: node validate-tasks.mjs [--only <id>]
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { runTask, listFiles, OBS_DIR } from './lib/testrun.mjs';

const TASKS = path.join(OBS_DIR, 'tasks');
const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

const ids = fs.readdirSync(TASKS, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).filter((d) => !only || d === only).sort();
const manifest = { generated: new Date().toISOString(), node: process.version, tasks: {} };
let bad = 0;

function hashDir(dir) {
  const h = createHash('sha256');
  for (const f of listFiles(dir)) { h.update(f); h.update(fs.readFileSync(path.join(dir, f))); }
  return h.digest('hex').slice(0, 16);
}

for (const id of ids) {
  const dir = path.join(TASKS, id);
  const problems = [];
  let meta;
  try { meta = JSON.parse(fs.readFileSync(path.join(dir, 'task.json'), 'utf8')); } catch (e) { problems.push('invalid task.json: ' + e.message); }
  if (meta) {
    for (const k of ['id', 'class', 'split', 'title', 'statement', 'bugs', 'decomposable']) if (meta[k] === undefined) problems.push('missing ' + k);
    if (meta.id !== id) problems.push('id != directory name');
    if (!['a', 'b', 'c'].includes(meta.class)) problems.push('invalid class');
    if (!['dev', 'test'].includes(meta.split)) problems.push('invalid split');
  }
  const srcFiles = listFiles(path.join(dir, 'src'));
  const solFiles = listFiles(path.join(dir, 'solution'));
  const vis = listFiles(path.join(dir, 'visible')).filter((f) => f.endsWith('.test.mjs'));
  const hid = listFiles(path.join(dir, 'test')).filter((f) => f.endsWith('.test.mjs'));
  if (!srcFiles.length) problems.push('empty src/');
  if (!solFiles.length) problems.push('empty solution/');
  for (const f of solFiles) if (!srcFiles.includes(f)) problems.push('solution/' + f + ' does not exist in src/');
  if (!vis.length) problems.push('no visible tests');
  if (!hid.length) problems.push('no hidden tests');
  let entry = { class: meta?.class, split: meta?.split, decomposable: meta?.decomposable, srcFiles, solFiles, nBugs: meta?.bugs?.length };
  if (!problems.length) {
    const ref = await runTask({ taskDir: dir, useSolution: true });
    const bug = await runTask({ taskDir: dir });
    const expected = {};
    for (const s of ['visible', 'test']) for (const [f, r] of Object.entries(ref[s].files)) expected[f] = r.total;
    if (!ref.visible.allPass) problems.push(`reference fails visible: ${JSON.stringify(ref.visible.failures.slice(0, 3))}`);
    if (!ref.test.allPass) problems.push(`reference fails hidden: ${JSON.stringify(ref.test.failures.slice(0, 3))}`);
    if (bug.visible.allPass) problems.push('buggy passes visible tests (no signal)');
    if (bug.test.allPass) problems.push('buggy passes hidden tests');
    // (In)dependence probe: apply each solution file in isolation.
    const single = {};
    const basePassH = bug.test.pass;
    if (solFiles.length > 1) {
      for (const f of solFiles) {
        const overlay = { ['src/' + f]: fs.readFileSync(path.join(dir, 'solution', f), 'utf8') };
        const r = await runTask({ taskDir: dir, overlay, suites: ['test'], expected });
        single[f] = { hiddenPass: r.test.pass, hiddenTotal: r.test.total, delta: r.test.pass - basePassH };
      }
    }
    const srcLines = srcFiles.reduce((n, f) => n + fs.readFileSync(path.join(dir, 'src', f), 'utf8').split('\n').length, 0);
    entry = { ...entry, expected, srcLines, buggy: { visible: `${bug.visible.pass}/${bug.visible.total}`, hidden: `${bug.test.pass}/${bug.test.total}` }, reference: { visible: `${ref.visible.pass}/${ref.visible.total}`, hidden: `${ref.test.pass}/${ref.test.total}` }, singleFileFix: single, hash: { src: hashDir(path.join(dir, 'src')), solution: hashDir(path.join(dir, 'solution')), visible: hashDir(path.join(dir, 'visible')), test: hashDir(path.join(dir, 'test')) } };
    if (meta.class === 'b' && solFiles.length < 2) problems.push('class b requires ≥2 fixed files');
    if (meta.class === 'b') for (const [f, s] of Object.entries(single)) if (s.delta <= 0) problems.push(`class b: fixing only ${f} does not improve hidden tests (dependence?)`);
    if (meta.class === 'a' && (meta.bugs?.length ?? 0) !== 1) problems.push('class a requires exactly 1 bug');
  }
  entry.problems = problems;
  manifest.tasks[id] = entry;
  if (problems.length) bad++;
  console.log(`${problems.length ? 'FAIL' : 'ok  '} ${id} ${entry.buggy ? `bug v=${entry.buggy.visible} h=${entry.buggy.hidden} ref h=${entry.reference.hidden}` : ''}${Object.keys(entry.singleFileFix || {}).length ? ' single=' + JSON.stringify(Object.fromEntries(Object.entries(entry.singleFileFix).map(([k, v]) => [k, v.delta]))) : ''}${problems.length ? '\n     ' + problems.join('\n     ') : ''}`);
}
if (!only) fs.writeFileSync(path.join(TASKS, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\n${ids.length - bad}/${ids.length} tasks valid`);
process.exit(bad ? 1 : 0);
