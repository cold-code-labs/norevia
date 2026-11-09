// Q2 — retry or recruit? Stage 1 (one package owner per package, no repair) is shared; then each arm spends the same extra budget E = k calls:
// RETRY (same owner re-reviews its own previous answer with probe feedback), RECRUIT-U (fresh agents, uniform allocation), RECRUIT-T (fresh agents allocated by response thresholds on probe stimulus); NONE = stage 1 only.
import fs from 'node:fs'; import path from 'node:path';
import { compose, loadTask3 } from './build3.mjs'; import { plan } from './plan.mjs'; import { Run, limitsFor, probe, evaluate, kp, kits, ownersRound, acceptBest, runPolicy, CapError } from './engine3.mjs'; import { OUT, spentCounted, CAP } from './api.mjs';
const argv = process.argv.slice(2); const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const rep = Number(opt('rep', 1)), jobs = Number(opt('jobs', 5)), phase = opt('phase', 'q2'), stopAt = Number(opt('stop-at', 14.0)); const file = path.join(OUT, `runs-${phase}.jsonl`);
const tasks = plan(88, JSON.parse(opt('sizes', '[[8,6]]')), 'r'); for (const t of tasks) compose(t.id, t.pkgs, 0.6);
const done = new Set(fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => { const r = JSON.parse(l); return `${r.task}|${r.rep}`; }) : []);
const LADDER = [0.1, 0.3, 0.5, 0.7, 0.9];
function allocate(t, p, E, mode) {              // returns { pkg: nCalls } summing to E
  const ks = kits(t); if (mode === 'uniform') { const a = Object.fromEntries(ks.map((k) => [k, 0])); for (let i = 0; i < E; i++) a[ks[i % ks.length]]++; return a; }
  const s = Object.fromEntries(ks.map((k) => [k, Math.max(0.15, kp(p, k).failFrac)])); const a = Object.fromEntries(ks.map((k) => [k, LADDER.filter((th) => th < s[k]).length])); const sum = () => Object.values(a).reduce((x, y) => x + y, 0);
  while (sum() > E) { const k = ks.filter((x) => a[x] > 0).sort((x, y) => s[x] / (1 + a[x]) - s[y] / (1 + a[y]))[0]; a[k]--; }
  while (sum() < E) { const k = [...ks].sort((x, y) => s[y] / (1 + a[y]) - s[x] / (1 + a[x]))[0]; a[k]++; } return a; }
async function extra(run, arm, task, files, p, prev, E) {
  const t = task; const alloc = allocate(t, p, E, arm === 'RECRUIT-T' ? 'threshold' : 'uniform'); run.events.push({ arm, alloc });
  const outs = []; await Promise.all(Object.entries(alloc).flatMap(([k, n]) => Array.from({ length: n }, async (_, i) => { const o = await ownersRound(run, [k], files, p, `${arm}-${i}`, { prev: arm === 'RETRY' ? { [k]: prev[k] } : {} }); outs.push(...o); })));
  return acceptBest(run, outs, files, p);
}
const jobsQ = tasks.filter((t) => !done.has(`${t.id}|${rep}`)); console.log(`${phase} rep ${rep}: ${jobsQ.length} task-units; counted $${spentCounted().toFixed(3)} of $${CAP}`);
await Promise.all(Array.from({ length: jobs }, async () => { while (jobsQ.length) { if (spentCounted() > stopAt) { jobsQ.length = 0; return; } const q = jobsQ.shift(); const task = loadTask3(q.id); const E = task.k; const rows = [];
  try {
    const s1 = new Run(task, `${phase}.stage1.r${rep}`, limitsFor(task)); let files = {}; let p = await probe(task, files); const outs = await ownersRound(s1, kits(task), files, p, 'owner'); const prev = Object.fromEntries(outs.map((o) => [o.k, o.text])); ({ files, p } = await acceptBest(s1, outs, files, p));
    const base = await evaluate(task, files); const mk = (arm, run, ev, f) => ({ phase, task: q.id, k: task.k, rep, arm, E, accepted: ev.final.allPass, probePass: ev.probe.allPass, falseSuccess: ev.probe.allPass && !ev.final.allPass, pkgAccepted: task.pkgs.filter((pp) => { const e = Object.entries(ev.final.files).filter(([ff]) => ff.split('/')[1].startsWith(pp.name + '__')); return e.length && e.every(([, v]) => v.pass === v.total); }).length, finalFrac: +(ev.final.pass / ev.final.total).toFixed(3), probe: `${ev.probe.pass}/${ev.probe.total}`, final: `${ev.final.pass}/${ev.final.total}`, stage1Cost: +s1.spent.toFixed(5), extraCost: +(run?.spent || 0).toFixed(5), cost: +(s1.spent + (run?.spent || 0)).toFixed(5), stage1Calls: s1.calls, extraCalls: run?.calls || 0, calls: s1.calls + (run?.calls || 0), budgetHit: !!run?.budgetHit, truncated: s1.truncated + (run?.truncated || 0), alloc: run?.events?.[0]?.alloc || null });
    rows.push(mk('NONE', null, base));
    for (const arm of ['RETRY', 'RECRUIT-U', 'RECRUIT-T']) { const run = new Run(task, `${phase}.${arm}.r${rep}`, { maxCalls: E, maxUsd: 1 }); const r = await extra(run, arm, task, files, p, prev, E); rows.push(mk(arm, run, await evaluate(task, r.files))); }
  } catch (e) { console.log('STOP', String(e.message).slice(0, 100)); if (e instanceof CapError) { jobsQ.length = 0; return; } continue; }
  fs.appendFileSync(file, rows.map((r) => JSON.stringify(r)).join('\n') + '\n'); console.log(`${q.id} r${rep}: ` + rows.map((r) => `${r.arm} ${r.pkgAccepted}/${r.k}${r.accepted ? '*' : ''} $${r.cost}/${r.calls}c`).join(' | ') + ` | counted $${spentCounted().toFixed(3)}`); } }));
console.log(`end; counted $${spentCounted().toFixed(3)} of $${CAP}`);
