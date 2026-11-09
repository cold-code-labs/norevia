#!/usr/bin/env node
// Observatory runner. Example:
//   node run.mjs --phase pilot --tasks a01-clamp-range,b01-x --archs all --reps 1 --jobs 4 --concurrency 5
//   node run.mjs --phase full --split all --archs all --reps 3 --phase-cap 120
// Resumable: skips (task, architecture, repetition) already present in runs-<phase>.jsonl.
import fs from 'node:fs';
import path from 'node:path';
import { ARCHS } from './arch/index.mjs';
import { JobCtx } from './lib/ctx.mjs';
import { loadTask, TASKS_DIR } from './lib/prompt.mjs';
import { runTask } from './lib/testrun.mjs';
import { RESULTS_DIR, ledgerTotal, setConcurrency, BudgetExceeded, GLOBAL_CAP_USD } from './lib/llm.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const phase = opt('phase', 'pilot');
const reps = Number(opt('reps', 1));
const jobsN = Number(opt('jobs', 4));
setConcurrency(Number(opt('concurrency', 5)));
const phaseCap = Number(opt('phase-cap', GLOBAL_CAP_USD));
const archNames = opt('archs', 'all') === 'all' ? Object.keys(ARCHS) : opt('archs').split(',');
const manifest = JSON.parse(fs.readFileSync(path.join(TASKS_DIR, 'manifest.json'), 'utf8'));
let taskIds = Object.keys(manifest.tasks).filter((id) => !manifest.tasks[id].problems?.length);
if (opt('tasks')) taskIds = opt('tasks').split(',');
const split = opt('split', 'all');
if (split !== 'all') taskIds = taskIds.filter((id) => manifest.tasks[id].split === split);
const classes = opt('classes'); if (classes) taskIds = taskIds.filter((id) => classes.split(',').includes(manifest.tasks[id].class));

const OUT = path.join(RESULTS_DIR, `runs-${phase}.jsonl`);
const RAW = path.join(RESULTS_DIR, 'raw', phase);
const STATUS = path.join(RESULTS_DIR, `status-${phase}.json`);
fs.mkdirSync(RAW, { recursive: true });
const done = new Set();
if (fs.existsSync(OUT)) for (const l of fs.readFileSync(OUT, 'utf8').split('\n')) { if (!l.trim()) continue; const r = JSON.parse(l); if (!r.error) done.add(`${r.task}|${r.arch}|${r.rep}`); }

// deterministic interleaved order (rep → shuffle with fixed seed)
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
const rand = rng(20261107);
const jobs = [];
for (let rep = 1; rep <= reps; rep++) {
  const batch = [];
  for (const t of taskIds) for (const a of archNames) if (!done.has(`${t}|${a}|${rep}`)) batch.push({ task: t, arch: a, rep });
  for (let i = batch.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [batch[i], batch[j]] = [batch[j], batch[i]]; }
  jobs.push(...batch);
}
const startSpend = ledgerTotal();
console.log(`[${phase}] ${jobs.length} jobs pending (${done.size} already done); tasks=${taskIds.length} archs=${archNames.join(',')} reps=${reps}; current global spend US$ ${startSpend.toFixed(4)}; phase cap US$ ${phaseCap}`);

let finished = 0, stopReason = null, phaseSpend = 0;
const writeStatus = () => fs.writeFileSync(STATUS, JSON.stringify({ phase, pending: jobs.length, finished, total: jobs.length + finished, phaseSpendUsd: phaseSpend, globalSpendUsd: ledgerTotal(), stopReason, updated: new Date().toISOString() }, null, 2));

async function runJob(j) {
  const task = loadTask(j.task);
  const ctx = new JobCtx({ task, arch: j.arch, rep: j.rep, phase });
  const t0 = Date.now();
  let out = null, error = null;
  try { out = await ARCHS[j.arch](ctx); } catch (e) { error = (e instanceof BudgetExceeded ? 'BUDGET: ' : '') + (e.stack || String(e)).slice(0, 600); if (e instanceof BudgetExceeded) stopReason = e.message; }
  const wallMs = Date.now() - t0;
  let ev = null;
  if (out) ev = await runTask({ taskDir: task.dir, overlay: out.files, suites: ['visible', 'test'], expected: task.expected });
  const s = ctx.s;
  const rec = {
    phase, task: j.task, class: task.meta.class, split: task.meta.split, arch: j.arch, rep: j.rep,
    accepted: ev ? ev.visible.allPass && ev.test.allPass : false,
    visibleAllPass: ev ? ev.visible.allPass : false, hiddenAllPass: ev ? ev.test.allPass : false,
    falseSuccess: ev ? ev.visible.allPass && !ev.test.allPass : false,
    visible: ev ? { pass: ev.visible.pass, total: ev.visible.total } : null, hidden: ev ? { pass: ev.test.pass, total: ev.test.total } : null,
    cost: s.cost, inTok: s.inTok, outTok: s.outTok, cacheRead: s.cacheRead, cacheWrite: s.cacheWrite,
    latencyMs: ctx.lat, wallMs, calls: s.calls, reworkCalls: s.reworkCalls, failedCalls: s.failedCalls, candidates: s.candidates, discarded: Math.max(0, s.candidates - 1), testRuns: s.testRuns,
    filesChanged: out ? Object.keys(out.files) : [], decomposed: out?.decomposed ?? null, events: s.events, error, ts: new Date().toISOString(),
  };
  phaseSpend += s.cost;
  if (!error || !error.startsWith('BUDGET')) fs.appendFileSync(OUT, JSON.stringify(rec) + '\n');
  fs.writeFileSync(path.join(RAW, `${j.task}__${j.arch}__r${j.rep}.json`), JSON.stringify({ ...rec, finalFiles: out?.files ?? null, transcript: s.transcript, hiddenFailures: ev?.test.failures?.slice(0, 20) ?? null }, null, 2));
  finished++;
  console.log(`${new Date().toISOString().slice(11, 19)} [${finished}] ${j.task} ${j.arch} r${j.rep} → ${rec.accepted ? 'ACCEPTED' : rec.falseSuccess ? 'FALSE-SUCCESS' : 'failed'} h=${rec.hidden?.pass}/${rec.hidden?.total} $${s.cost.toFixed(4)} calls=${s.calls} lat=${(ctx.lat / 1000).toFixed(1)}s${error ? ' ERROR ' + error.split('\n')[0] : ''} | phase $${phaseSpend.toFixed(2)} global $${ledgerTotal().toFixed(2)}`);
  writeStatus();
}

async function worker() {
  while (jobs.length && !stopReason) {
    if (startSpend + phaseSpend >= Math.min(GLOBAL_CAP_USD, startSpend + phaseCap)) { stopReason = `phase cap reached (US$ ${phaseSpend.toFixed(2)})`; break; }
    const j = jobs.shift();
    await runJob(j);
  }
}
writeStatus();
await Promise.all(Array.from({ length: jobsN }, worker));
writeStatus();
console.log(`[${phase}] end. finished=${finished} pending=${jobs.length} phase spend US$ ${phaseSpend.toFixed(4)} global US$ ${ledgerTotal().toFixed(4)} ${stopReason ? 'STOPPED: ' + stopReason : ''}`);
