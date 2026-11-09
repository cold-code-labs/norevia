// LAB-005 real runs. node lab005/run5.mjs --arms all|S|D|A,B --N 300 --B 8 --reps 3 [--phase main] [--seed0 1]
import fs from 'node:fs'; import path from 'node:path';
import { buildTasks } from './tasks5.mjs'; import { realBackend } from './backend.mjs'; import { runWorld, ARMS5 } from './engine5.mjs'; import { OUT, spentCounted, CAP, CapError } from './api.mjs';
const argv = process.argv.slice(2); const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const N = Number(opt('N', 300)), B = Number(opt('B', 8)), reps = Number(opt('reps', 1)), seed0 = Number(opt('seed0', 1)), phase = opt('phase', 'main'), stopAt = Number(opt('stop-at', 33.5));
const sel = opt('arms', 'all'); const arms = sel === 'all' ? Object.keys(ARMS5) : sel === 'S' || sel === 'D' ? Object.keys(ARMS5).filter((a) => a.startsWith(sel + '-')) : sel.split(',');
const file = path.join(OUT, `runs-${phase}.jsonl`); const T = buildTasks(); const done = new Set(fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => { const r = JSON.parse(l); return `${r.arm}|${r.N}|${r.B}|${r.seed}`; }) : []);
console.log(`${phase}: N ${N} B ${B} reps ${reps} arms ${arms.length}; counted $${spentCounted().toFixed(3)} of $${CAP}`);
for (let rep = 0; rep < reps; rep++) { const seed = seed0 + rep; if (spentCounted() > stopAt) { console.log('stop line'); break; } const todo = arms.filter((a) => !done.has(`${a}|${N}|${B}|${seed}`)); const t0 = Date.now();
  await Promise.all(todo.map(async (arm) => { let res; try { res = await runWorld({ arm, N, B, tasks: T, backend: realBackend(T, `${phase}.${arm}.N${N}.s${seed}`), seed }); } catch (e) { console.log('STOP', arm, String(e.message).slice(0, 90)); if (e instanceof CapError) return; throw e; }
    fs.appendFileSync(file, JSON.stringify({ phase, ...res }) + '\n'); console.log(`s${seed} ${arm.padEnd(10)} cov ${res.coverage} fs ${res.fsRate} calls ${res.calls} $${res.cost} wait ${res.meanWaitRounds} backlogArea ${res.backlogArea} | counted $${spentCounted().toFixed(3)}`); }));
  console.log(`-- seed ${seed} done in ${((Date.now() - t0) / 1000).toFixed(0)}s; counted $${spentCounted().toFixed(3)}`); }
console.log('end');
