// LAB-001 runner. node lab/run.mjs --phase <name> --tasks a,b|@file.json --arms A,B|all --reps 1 --jobs 3 --phase-cap 5 [--seed 7]
// Resumable (skips task|arm|rep already in runs-<phase>.jsonl). Task-major order (shuffled by seed): all arms of a task run before the next task, so a stop at the cap leaves complete paired data.
import fs from 'node:fs'; import path from 'node:path';
import { Run, loadTask, INDEX, limitsFor, spent, CAP, CapError, RESULTS, MODEL, EFFORT } from './lib.mjs';
import { ARMS } from './arms.mjs';
import { runTask } from '../lib/testrun.mjs';
const argv = process.argv.slice(2); const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const phase = opt('phase', 'smoke'); const OUT = path.join(RESULTS, `runs-${phase}.jsonl`), RAW = path.join(RESULTS, 'raw', phase); fs.mkdirSync(RAW, { recursive: true });
let taskIds = opt('tasks', 'all'); taskIds = taskIds === 'all' ? Object.keys(INDEX()) : taskIds.startsWith('@') ? JSON.parse(fs.readFileSync(taskIds.slice(1), 'utf8')) : taskIds.split(',');
const armNames = opt('arms', 'all') === 'all' ? Object.keys(ARMS) : opt('arms').split(',');
const reps = Number(opt('reps', 1)), jobsN = Number(opt('jobs', 3)), seed = Number(opt('seed', 7)); const phaseCap = Number(opt('phase-cap', CAP)); const start = spent();
const rng = (() => { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; })();
if (opt('shuffle', '1') === '1') for (let i = taskIds.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [taskIds[i], taskIds[j]] = [taskIds[j], taskIds[i]]; }
const done = new Set(fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8').split('\n').filter(Boolean).map((l) => { const r = JSON.parse(l); return `${r.task}|${r.arm}|${r.rep}`; }) : []);
const jobs = []; for (let rep = 1; rep <= reps; rep++) for (const t of taskIds) for (const a of armNames) if (!done.has(`${t}|${a}|${rep}`)) jobs.push({ t, a, rep });
console.log(`${phase}: ${jobs.length} runs pending; ledger $${spent().toFixed(3)} of $${CAP}; phase cap $${phaseCap}; model ${MODEL}/${EFFORT}`);
let stop = false; const margin = Number(opt('margin', 1.0));
const room = () => spent() - start < phaseCap - margin && spent() < CAP - margin;
// Task reserve: a task is started only if all its arms are expected to fit (multi ≈ US$ 3.0, mid ≈ US$ 1.4 for 15 arms; in-flight tasks are counted as fully reserved).
const TASK_EST = { multi: Number(opt('est-multi', 3.0)), mid: Number(opt('est-mid', 1.4)) }; const started = new Map(), finished = new Map();
const reserved = () => [...started.keys()].reduce((s, t) => s + Math.max(0, TASK_EST[INDEX()[t].tier] * (1 - (finished.get(t) || 0) / armNames.length)), 0);
const roomForTask = (t) => spent() + reserved() + TASK_EST[INDEX()[t].tier] <= Math.min(CAP - margin, start + phaseCap);
async function worker() {
  while (jobs.length && !stop) {
    if (!room()) { console.log('phase budget margin reached; stopping dispatch'); stop = true; break; }
    if (!started.has(jobs[0].t) && !roomForTask(jobs[0].t)) { console.log(`task ${jobs[0].t} does not fit in the remaining budget; stopping dispatch`); stop = true; break; }
    const j = jobs.shift(); started.set(j.t, true); const task = loadTask(j.t); const lim = limitsFor(task); const run = new Run(task, j.a, j.rep, lim, phase); let files = {}, error = null; const t0 = Date.now();
    try { files = await ARMS[j.a].fn(run); } catch (e) { error = String(e.message || e).slice(0, 300); files = run.files || {}; if (e instanceof CapError) stop = true; }
    if (!files || !Object.keys(files).length) files = run.files || {};
    const ev = await runTask({ taskDir: task.dir, overlay: files, suites: ['probe', 'final'], expected: task.expected });
    const pkgAcc = task.pkgs.filter((p) => { const e = Object.entries(ev.final.files).filter(([f]) => f.split('/')[1].startsWith(p.name + '__')); return e.length && e.every(([, v]) => v.pass === v.total); }).length;
    const rec = { phase, task: j.t, tier: task.tier, k: task.k, arm: j.a, kind: ARMS[j.a].kind, rep: j.rep, accepted: ev.final.allPass, probeAllPass: ev.probe.allPass, falseSuccess: ev.probe.allPass && !ev.final.allPass, probe: `${ev.probe.pass}/${ev.probe.total}`, final: `${ev.final.pass}/${ev.final.total}`, finalFrac: +(ev.final.pass / ev.final.total).toFixed(3), pkgAccepted: pkgAcc, cost: +run.cost.toFixed(5), inTok: run.inTok, outTok: run.outTok, calls: run.calls, latS: +(run.root.lat / 1000).toFixed(1), wallS: +((Date.now() - t0) / 1000).toFixed(1), msgs: run.msgs, msgChars: run.msgChars, budgetHit: run.budgetHit, maxCalls: lim.maxCalls, maxUsd: lim.maxUsd, overshoot: +Math.max(0, run.cost - lim.maxUsd).toFixed(5), callFailures: run.callFailures, events: run.events, error, ts: new Date().toISOString() };
    if (!(error && /CAP/.test(error))) fs.appendFileSync(OUT, JSON.stringify(rec) + '\n');
    fs.writeFileSync(path.join(RAW, `${j.t}__${j.a}__r${j.rep}.json`), JSON.stringify({ ...rec, files, transcript: run.transcript }, null, 1));
    finished.set(j.t, (finished.get(j.t) || 0) + 1);
    console.log(`${new Date().toISOString().slice(11, 19)} ${j.t} ${j.a} r${j.rep} → ${rec.accepted ? 'ACCEPTED' : rec.falseSuccess ? 'FALSE-SUCCESS' : 'failed'} final ${rec.final} $${rec.cost.toFixed(4)}/${lim.maxUsd} calls=${rec.calls}/${lim.maxCalls} lat=${rec.latS}s${rec.budgetHit ? ' BUDGET-HIT' : ''}${error ? ' ERR ' + error : ''} | ledger $${spent().toFixed(3)}`);
  }
}
await Promise.all(Array.from({ length: jobsN }, worker));
console.log(`end; ledger $${spent().toFixed(3)} of $${CAP}${stop ? ' — stopped early' : ''}`);
