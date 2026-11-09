// Q1 — when does splitting pay? SOLO vs TEAM on tasks of 1, 3, 8, ~15 packages. node lab003/q1.mjs --rep N [--jobs 6] [--phase q1]
import fs from 'node:fs'; import path from 'node:path';
import { compose, loadTask3 } from './build3.mjs'; import { plan } from './plan.mjs'; import { runPolicy, SOLO, TEAM } from './engine3.mjs'; import { OUT, spentCounted, CAP } from './api.mjs';
const argv = process.argv.slice(2); const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const rep = Number(opt('rep', 1)), jobs = Number(opt('jobs', 6)), phase = opt('phase', 'q1'), stopAt = Number(opt('stop-at', 14.0)); const file = path.join(OUT, `runs-${phase}.jsonl`);
const tasks = plan(77, JSON.parse(opt('sizes', '[[1,6],[3,4],[8,3],[15,2]]'))); for (const t of tasks) compose(t.id, t.pkgs, 0.6);
const done = new Set(fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => { const r = JSON.parse(l); return `${r.task}|${r.arm}|${r.rep}`; }) : []);
const jobsQ = []; for (const t of tasks.sort((a, b) => b.k - a.k)) for (const arm of ['SOLO', 'TEAM']) if (!done.has(`${t.id}|${arm}|${rep}`)) jobsQ.push({ t, arm }); console.log(`${phase} rep ${rep}: ${jobsQ.length} runs; counted $${spentCounted().toFixed(3)} of $${CAP}`);
const POL = { SOLO, TEAM };
await Promise.all(Array.from({ length: jobs }, async () => { while (jobsQ.length) { if (spentCounted() > stopAt) { console.log('stop line reached'); jobsQ.length = 0; return; } const { t, arm } = jobsQ.shift(); const task = loadTask3(t.id); let out;
  try { out = await runPolicy(task, `${phase}.${arm}.r${rep}`, (run) => POL[arm](run)); } catch (e) { console.log('STOP', e.message); jobsQ.length = 0; return; }
  const rec = { phase, arm, rep, ...out.rec, packages: t.pkgs.length }; fs.appendFileSync(file, JSON.stringify(rec) + '\n'); console.log(`${t.id} ${arm} r${rep}: ${rec.accepted ? 'ACC' : rec.falseSuccess ? 'FS' : 'fail'} final ${rec.final} pkg ${rec.pkgAccepted}/${rec.k} $${rec.cost} calls ${rec.calls} trunc ${rec.truncated}${rec.budgetHit ? ' HIT' : ''} | counted $${spentCounted().toFixed(3)}`); } }));
console.log(`end; counted $${spentCounted().toFixed(3)} of $${CAP}`);
