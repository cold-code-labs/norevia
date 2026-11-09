// LAB-004 pool calibration (real calls): every task × K independent fresh attempts (stateless), plus one 'revise' attempt per task whose first attempt failed the visible examples.
// Gives per-task success, false-success, signature agreement, cost/latency, and the revise gain used by the simulator. node lab004/pool.mjs [--k 3]
import fs from 'node:fs'; import path from 'node:path';
import { buildTasks } from './tasks.mjs'; import { realBackend } from './backend.mjs'; import { OUT, spentCounted, CAP } from './api.mjs';
const K = Number(process.argv[process.argv.indexOf('--k') + 1] || 3); const T = buildTasks(); const b = realBackend(T, 'pool'); const file = path.join(OUT, 'runs-pool.jsonl'); fs.writeFileSync(file, '');
console.log(`pool: ${T.length} tasks × ${K} fresh attempts; counted $${spentCounted().toFixed(3)} of $${CAP}`); const rows = [];
const rec = (ti, ctx, o, k) => { const t = T[ti]; const row = { task: t.id, ti, family: t.family, informed: t.informed, hasTrap: t.hasTrap, mode: ctx.mode || 'fresh', k, vis: o.vis, hid: o.hid, sig: o.sig, visCount: o.visCount, cost: o.cost, ms: o.ms, inTok: o.inTok, outTok: o.outTok, failed: !!o.failed }; rows.push(row); fs.appendFileSync(file, JSON.stringify(row) + '\n'); return row; };
const jobs = []; for (let k = 0; k < K; k++) for (let i = 0; i < T.length; i++) jobs.push([i, k]); const first = {};
await Promise.all(jobs.map(async ([i, k]) => { const o = await b.attempt(i, {}); const row = rec(i, {}, o, k); if (k === 0) first[i] = { o, row }; }));
const rev = Object.entries(first).filter(([i, x]) => !x.o.vis && x.o.code).map(([i]) => Number(i)); console.log('fresh done; revise attempts', rev.length, 'counted', spentCounted().toFixed(3));
await Promise.all(rev.map(async (i) => { const o = await b.attempt(i, { mode: 'revise', prior: { code: first[i].o.code } }); rec(i, { mode: 'revise' }, o, 0); }));
const fr = rows.filter((r) => r.mode === 'fresh'), rv = rows.filter((r) => r.mode === 'revise'); const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
console.log(JSON.stringify({ fresh: fr.length, hid: +mean(fr.map((r) => +r.hid)).toFixed(3), vis: +mean(fr.map((r) => +r.vis)).toFixed(3), fsOfVis: +(fr.filter((r) => r.vis && !r.hid).length / fr.filter((r) => r.vis).length).toFixed(3), revise: rv.length, reviseHid: +mean(rv.map((r) => +r.hid)).toFixed(3), reviseVis: +mean(rv.map((r) => +r.vis)).toFixed(3), failedCalls: rows.filter((r) => r.failed).length, costPerCall: +mean(rows.map((r) => r.cost)).toFixed(6), msMean: +mean(rows.map((r) => r.ms)).toFixed(0), counted: +spentCounted().toFixed(3) }, null, 1));
