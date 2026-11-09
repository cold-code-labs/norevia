// node lab002/run.mjs --phase smoke|main --arms CTRL,ALWAYS,SOLO-SEQ,CTRL-NOMEM --reps 1   (env D_REQS=Q1,LP1 filters requests; D_CAP lowers the cap)
import fs from 'node:fs'; import path from 'node:path';
import { runArm } from './controller.mjs'; import { OUT, spentCounted, CAP } from './api.mjs';
const argv = process.argv.slice(2); const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const phase = opt('phase', 'smoke'), arms = opt('arms', 'CTRL').split(','), reps = Number(opt('reps', 1)), startRep = Number(opt('start-rep', 1));
const file = path.join(OUT, `runs-${phase}.jsonl`); fs.mkdirSync(path.join(OUT, 'raw', phase), { recursive: true });
console.log(`${phase}: arms ${arms} reps ${startRep}..${startRep + reps - 1}; counted $${spentCounted().toFixed(3)} of $${CAP}`);
for (let rep = startRep; rep < startRep + reps; rep++) await Promise.all(arms.map(async (arm) => {
  const done = fs.existsSync(file) && fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).some((l) => { const r = JSON.parse(l); return r.arm === arm && r.rep === rep; }); if (done) return;
  const res = await runArm(arm, rep);
  for (const th of res.threads) { const b = th.budget; const rec = { phase, arm, rep, request: th.req.id, type: th.req.type, accepted: !!th.accepted, visiblePass: !!th.visiblePass, falseSuccess: !!th.visiblePass && !th.accepted, finalFrac: th.finalFrac ?? null, failed: th.failed ?? null, firstPassVisibleFails: th.firstPassVisibleFails ?? null, usedPlaybook: !!th.usedPlaybook, cost: +(b?.spent || 0).toFixed(5), calls: b?.calls || 0, inTok: b?.tokensIn || 0, outTok: b?.tokensOut || 0, unfolded: th.unfolded, children: th.children, wallS: th.wallS, endT: +(th.endT || 0).toFixed(1), ackMs: th.ackMs, budgetHit: th.budgetHit, budgetUsd: b?.maxUsd, budgetCalls: b?.maxCalls, error: th.error }; fs.appendFileSync(file, JSON.stringify(rec) + '\n'); if (th.output) fs.writeFileSync(path.join(OUT, 'raw', phase, `${arm}.r${rep}.${th.req.id}.txt`), th.output); }
  fs.appendFileSync(path.join(OUT, `arms-${phase}.jsonl`), JSON.stringify({ phase, arm, rep, wallS: res.wallS, mainBlockedS: res.mainBlockedS, maxAckMs: res.maxAckMs, statusPollMaxMs: res.statusPollMaxMs, playbook: res.playbook, timeline: res.timeline }) + '\n');
  console.log(`${arm} r${rep}: wall ${res.wallS}s, maxAck ${res.maxAckMs}ms, ${res.threads.filter((t) => t.accepted).length}/${res.threads.length} accepted, counted $${spentCounted().toFixed(3)}`);
}));
console.log(`end; counted $${spentCounted().toFixed(3)} of $${CAP}`);
