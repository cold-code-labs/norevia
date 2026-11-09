// LAB-004 real runs. node lab004/run.mjs --Ns 10,30,100 --reps 2 [--arms all] [--phase main] [--B 4]
// One process only (the cap counter is in memory). Resumable per (arm, N, rep). Arms of one (N, rep) run concurrently on the shared API concurrency limit.
import fs from 'node:fs'; import path from 'node:path';
import { buildTasks } from './tasks.mjs'; import { realBackend } from './backend.mjs'; import { runSwarm, ARM_DEFS } from './engine.mjs'; import { OUT, spentCounted, CAP, CapError } from './api.mjs';
const argv = process.argv.slice(2); const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const Ns = opt('Ns', '10').split(',').map(Number), reps = Number(opt('reps', 1)), phase = opt('phase', 'main'), B = Number(opt('B', 4)), arms = opt('arms', 'all') === 'all' ? Object.keys(ARM_DEFS) : opt('arms').split(','); const stopAt = Number(opt('stop-at', 14.0));
const file = path.join(OUT, `runs-${phase}.jsonl`); const T = buildTasks(); const done = new Set(fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => { const r = JSON.parse(l); return `${r.arm}|${r.N}|${r.rep}`; }) : []);
console.log(`${phase}: Ns ${Ns} reps ${reps} arms ${arms.length} B ${B}; counted $${spentCounted().toFixed(3)} of $${CAP}`);
for (const N of Ns) for (let rep = 1; rep <= reps; rep++) { if (spentCounted() > stopAt) { console.log('stop line'); process.exit(0); } const todo = arms.filter((a) => !done.has(`${a}|${N}|${rep}`)); if (!todo.length) continue; const t0 = Date.now();
  await Promise.all(todo.map(async (arm) => { let res; try { res = await runSwarm({ arm, N, B, T: T.length, backend: realBackend(T, `${phase}.${arm}.N${N}.r${rep}`), seed: rep }); } catch (e) { console.log('STOP', arm, N, String(e.message).slice(0, 100)); if (e instanceof CapError) return; throw e; }
    fs.appendFileSync(file, JSON.stringify({ phase, rep, ...res }) + '\n'); console.log(`N=${N} r${rep} ${arm.padEnd(8)} cov ${res.coverage} fs ${res.fsRate} calls ${res.calls} $${res.cost} dup ${res.dupCalls} conf ${res.conflicts} idle ${res.idleAgentRounds} t ${res.criticalPathS}s | counted $${spentCounted().toFixed(3)}`); }));
  console.log(`-- N=${N} rep ${rep} done in ${((Date.now() - t0) / 1000).toFixed(0)}s; counted $${spentCounted().toFixed(3)}`); }
console.log('end');
