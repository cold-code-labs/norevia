// LAB-001 analysis. node lab/analyze.mjs --phases main [--out summary.json] [--tasks @file.json]
// Acceptance with Wilson 95% CI; cost per accepted with task-level bootstrap CI (B=4000, seeded); paired mechanism-vs-reference contrasts;
// verdict per mechanism by the rule fixed in PREREG.md. Reference = the artificial arm with the most accepted runs (ties: lower cost per accepted), or SOLO for the secondary contrast.
import fs from 'node:fs'; import path from 'node:path';
import { RESULTS } from './lib.mjs'; import { ARMS } from './arms.mjs';
const argv = process.argv.slice(2); const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const phases = opt('phases', 'main').split(','); const outFile = opt('out', 'summary.json');
let R = phases.flatMap((ph) => { const f = path.join(RESULTS, `runs-${ph}.jsonl`); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(JSON.parse) : []; });
if (opt('tasks')) { const ids = JSON.parse(fs.readFileSync(opt('tasks').replace(/^@/, ''), 'utf8')); R = R.filter((r) => ids.includes(r.task)); }
// keep only tasks completed by every arm present (complete paired data)
const armNames = Object.keys(ARMS).filter((a) => R.some((r) => r.arm === a)); const taskIds = [...new Set(R.map((r) => r.task))].sort();
const key = (t, a) => R.filter((r) => r.task === t && r.arm === a);
const complete = taskIds.filter((t) => armNames.every((a) => key(t, a).length > 0)); R = R.filter((r) => complete.includes(r.task));
const reps = Math.max(1, ...R.map((r) => r.rep));
let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const wilson = (x, n) => { if (!n) return [0, 1]; const z = 1.96, p = x / n, d = 1 + z * z / n, c = p + z * z / (2 * n), s = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [Math.max(0, (c - s) / d), Math.min(1, (c + s) / d)]; };
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.max(0, Math.floor(p * s.length)))]; };
const median = (a) => (a.length ? q(a, 0.5) : null); const sum = (a) => a.reduce((s, x) => s + x, 0); const mean = (a) => (a.length ? sum(a) / a.length : 0);
const perTask = (a, ts) => ts.map((t) => { const r = key(t, a); return { n: r.length, acc: sum(r.map((x) => +x.accepted)), cost: sum(r.map((x) => x.cost)) }; });
const cpa = (pt) => { const A = sum(pt.map((x) => x.acc)); return A ? sum(pt.map((x) => x.cost)) / A : Infinity; };
const accRate = (pt) => sum(pt.map((x) => x.acc)) / Math.max(1, sum(pt.map((x) => x.n)));
function boot(fn, ts, B = 4000) { const out = []; for (let b = 0; b < B; b++) { const s = ts.map(() => ts[Math.floor(rnd() * ts.length)]); out.push(fn(s)); } return out; }
const ci = (xs) => { const f = xs.filter((x) => Number.isFinite(x)); return f.length < xs.length * 0.9 ? [null, null] : [q(f, 0.025), q(f, 0.975)]; };
const fix = (x, d = 4) => (x == null || !Number.isFinite(x) ? null : +x.toFixed(d));
function armSummary(a, ts = complete) {
  const rr = ts.flatMap((t) => key(t, a)); const n = rr.length, x = rr.filter((r) => r.accepted).length; const pt = perTask(a, ts);
  const c = ci(boot((s) => cpa(s.map((t) => pt[ts.indexOf(t)])), ts));
  return { arm: a, kind: ARMS[a].kind, mech: ARMS[a].mech || null, runs: n, accepted: x, acceptance: fix(x / n, 3), acceptanceCI: wilson(x, n).map((v) => fix(v, 3)), falseSuccess: rr.filter((r) => r.falseSuccess).length, costPerAccepted: fix(cpa(pt)), costPerAcceptedCI: c.map((v) => fix(v)), meanCost: fix(mean(rr.map((r) => r.cost)), 4), meanCalls: fix(mean(rr.map((r) => r.calls)), 2), medianLatencyS: median(rr.map((r) => r.latS)), meanFinalFrac: fix(mean(rr.map((r) => r.finalFrac)), 3), meanPkgAccepted: fix(mean(rr.map((r) => r.pkgAccepted / r.k)), 3), budgetHits: rr.filter((r) => r.budgetHit).length, overshootRuns: rr.filter((r) => r.overshoot > 0).length, meanMsgs: fix(mean(rr.map((r) => r.msgs)), 1), meanInTokK: fix(mean(rr.map((r) => r.inTok)) / 1000, 1) };
}
// paired contrast M vs ref over tasks
function contrast(m, ref, ts = complete) {
  const pm = perTask(m, ts), pr = perTask(ref, ts); const idx = ts.map((_, i) => i);
  const dA = (s) => accRate(s.map((i) => pm[i])) - accRate(s.map((i) => pr[i])); const rC = (s) => cpa(s.map((i) => pm[i])) / cpa(s.map((i) => pr[i]));
  const bA = []; const bC = []; for (let b = 0; b < 4000; b++) { const s = idx.map(() => idx[Math.floor(rnd() * idx.length)]); bA.push(dA(s)); bC.push(rC(s)); }
  const dAhat = dA(idx), rChat = rC(idx), [aLo, aHi] = ci(bA), [cLo, cHi] = ci(bC);
  const nonInf = aLo != null && aLo >= -0.10, cheaper = cHi != null && cHi < 1 && rChat <= 0.80, higher = aLo != null && aLo > 0, notMuchCostlier = cHi != null && cHi <= 1.25;
  const worseAcc = aHi != null && aHi < 0, costlier = cLo != null && cLo > 1.25;
  let verdict = 'INCONCLUSIVE (no detectable difference)';
  if ((nonInf && cheaper) || (higher && notMuchCostlier)) verdict = 'BETTER'; else if (worseAcc || (costlier && !higher)) verdict = 'WORSE';
  const sW = (a) => ts.flatMap((t) => key(t, a)).filter((r) => r.falseSuccess).length;
  return { mechanism: m, reference: ref, deltaAcceptance: fix(dAhat, 3), deltaAcceptanceCI: [fix(aLo, 3), fix(aHi, 3)], costRatio: fix(rChat, 3), costRatioCI: [fix(cLo, 3), fix(cHi, 3)], falseSuccess: [sW(m), sW(ref)], verdict };
}
const arms = armNames.map((a) => armSummary(a)); const byArm = Object.fromEntries(arms.map((x) => [x.arm, x]));
const artificial = arms.filter((x) => x.kind === 'artificial'); const refBest = [...artificial].sort((a, b) => b.accepted - a.accepted || (a.costPerAccepted ?? Infinity) - (b.costPerAccepted ?? Infinity))[0]?.arm;
const mechs = arms.filter((x) => x.kind === 'bio').map((x) => x.arm);
const tiers = ['mid', 'multi']; const tierTasks = Object.fromEntries(tiers.map((t) => [t, complete.filter((id) => R.find((r) => r.task === id)?.tier === t)]));
const out = { generated: new Date().toISOString(), phases, tasks: complete.length, tasksByTier: Object.fromEntries(tiers.map((t) => [t, tierTasks[t].length])), repetitions: reps, referenceBestArtificial: refBest, arms, contrasts: {}, byTier: {}, ablations: [] };
for (const m of mechs) out.contrasts[m] = { vsBestArtificial: contrast(m, refBest), vsSolo: m === 'SOLO' ? null : contrast(m, 'SOLO') };
for (const t of tiers) if (tierTasks[t].length >= 3) { const ts = tierTasks[t]; const as = armNames.map((a) => armSummary(a, ts)); const rb = [...as.filter((x) => x.kind === 'artificial')].sort((a, b) => b.accepted - a.accepted || (a.costPerAccepted ?? Infinity) - (b.costPerAccepted ?? Infinity))[0]?.arm; out.byTier[t] = { tasks: ts.length, referenceBestArtificial: rb, arms: as.map((x) => ({ arm: x.arm, accepted: `${x.accepted}/${x.runs}`, costPerAccepted: x.costPerAccepted, falseSuccess: x.falseSuccess, medianLatencyS: x.medianLatencyS })), contrasts: Object.fromEntries(mechs.map((m) => [m, contrast(m, rb, ts)])) }; }
for (const [a, b, what] of [['STIG-evap', 'STIG-noevap', 'stigmergy: evaporation vs none'], ['THRESH-hab', 'THRESH-fixed', 'threshold: habituating vs fixed'], ['QUORUM-q2', 'QUORUM-q1', 'quorum: q=2 vs q=1']]) if (byArm[a] && byArm[b]) out.ablations.push({ what, ...contrast(a, b) });
out.pareto = arms.map((x) => ({ arm: x.arm, costPerAccepted: x.costPerAccepted, acceptance: x.acceptance, medianLatencyS: x.medianLatencyS })).map((x, _, all) => ({ ...x, dominated: all.some((y) => y !== x && (y.costPerAccepted ?? Infinity) <= (x.costPerAccepted ?? Infinity) && y.acceptance >= x.acceptance && (y.medianLatencyS ?? Infinity) <= (x.medianLatencyS ?? Infinity) && (y.costPerAccepted < x.costPerAccepted || y.acceptance > x.acceptance || y.medianLatencyS < x.medianLatencyS)) }));
fs.writeFileSync(path.join(RESULTS, outFile), JSON.stringify(out, null, 1));
const f = (x) => (x == null ? '—' : x);
console.log(`tasks ${out.tasks} (${JSON.stringify(out.tasksByTier)}), reps ${reps}, reference best artificial: ${refBest}`);
console.log('arm | kind | accepted (CI) | false succ | $/accepted (CI) | calls | latency s | budget hits');
for (const x of arms) console.log(`${x.arm} | ${x.kind} | ${x.accepted}/${x.runs} (${x.acceptanceCI.join('–')}) | ${x.falseSuccess} | ${f(x.costPerAccepted)} (${x.costPerAcceptedCI.map(f).join('–')}) | ${x.meanCalls} | ${x.medianLatencyS} | ${x.budgetHits}`);
for (const m of mechs) { const c = out.contrasts[m].vsBestArtificial; console.log(`${m} vs ${refBest}: ΔA ${c.deltaAcceptance} [${c.deltaAcceptanceCI}] cost× ${c.costRatio} [${c.costRatioCI}] → ${c.verdict}`); }
