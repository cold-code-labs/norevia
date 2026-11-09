// LAB-001 task selection (rule fixed in PREREG.md before calibration). node lab/select-tasks.mjs
// Eligible = candidate task where the SOLO calibration run did not reach acceptance. Order = seeded shuffle (seed 7, same LCG as run.mjs).
// core = first 5 eligible multi + first 6 eligible mid; extension = remaining eligible tasks (mid first, then multi) in the same seeded order.
import fs from 'node:fs'; import path from 'node:path';
import { RESULTS, INDEX } from './lib.mjs';
const idx = INDEX(); const cal = fs.readFileSync(path.join(RESULTS, 'runs-calib.jsonl'), 'utf8').split('\n').filter(Boolean).map(JSON.parse);
const rng = (() => { let s = 7; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; })();
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const cand = Object.keys(idx).filter((t) => idx[t].tier !== 'probe' && !idx[t].retired).sort();
const calOf = Object.fromEntries(cal.filter((r) => r.arm === 'SOLO').map((r) => [r.task, r]));
const missing = cand.filter((t) => !calOf[t]); if (missing.length) { console.error('missing calibration for', missing.join(',')); process.exit(1); }
const eligible = shuffle(cand).filter((t) => !calOf[t].accepted); const ceiling = cand.filter((t) => calOf[t].accepted);
const multi = eligible.filter((t) => idx[t].tier === 'multi'), mid = eligible.filter((t) => idx[t].tier === 'mid');
const core = [...multi.slice(0, 5), ...mid.slice(0, 6)]; const ext = [...mid.slice(6), ...multi.slice(5)];
// run order: core interleaved (multi, mid, multi, mid, …) so a stop leaves a balanced set; then extension
const order = []; const M = [...multi.slice(0, 5)], m = [...mid.slice(0, 6)]; while (M.length || m.length) { if (M.length) order.push(M.shift()); if (m.length) order.push(m.shift()); }
order.push(...ext);
const out = { generated: new Date().toISOString(), rule: 'SOLO calibration not accepted → eligible', candidates: cand.length, eligible: eligible.length, ceilingExcluded: ceiling, core, extension: ext, runOrder: order, calibration: Object.fromEntries(cand.map((t) => [t, { tier: idx[t].tier, k: idx[t].k, accepted: calOf[t].accepted, falseSuccess: calOf[t].falseSuccess, final: calOf[t].final, cost: calOf[t].cost }])), coreShortfall: { multi: Math.max(0, 5 - multi.length), mid: Math.max(0, 6 - mid.length) } };
fs.writeFileSync(path.join(RESULTS, 'main-tasks.json'), JSON.stringify(out, null, 1)); fs.writeFileSync(path.join(RESULTS, 'main-order.json'), JSON.stringify(order));
console.log(`candidates ${cand.length}; eligible ${eligible.length} (multi ${multi.length}, mid ${mid.length}); ceiling-excluded ${ceiling.length}: ${ceiling.join(',')}\ncore (${core.length}): ${core.join(',')}\nextension: ${ext.join(',')}\nshortfall ${JSON.stringify(out.coreShortfall)}`);
