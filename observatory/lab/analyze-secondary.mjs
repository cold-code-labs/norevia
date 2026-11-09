// LAB-001 EXPLORATORY secondary analysis (added after the pre-registered primary outcome turned out degenerate: 13/15 arms accepted 0 tasks).
// Metrics: fraction of packages whose hidden suite fully passes (pkgAccepted/k), hidden-test pass fraction, cost per accepted PACKAGE.
// Same bootstrap machinery (task-level, seeded). Reference = artificial arm with the highest package-acceptance rate (ties: lower cost per package).
import fs from 'node:fs'; import path from 'node:path'; import { RESULTS } from './lib.mjs'; import { ARMS } from './arms.mjs';
const R = ['main', 'expl'].flatMap((ph) => { const f = path.join(RESULTS, `runs-${ph}.jsonl`); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(JSON.parse) : []; });
const arms = Object.keys(ARMS).filter((a) => R.some((r) => r.arm === a)); const tasks = [...new Set(R.map((r) => r.task))].sort();
const get = (t, a) => R.find((r) => r.task === t && r.arm === a); const tierOf = (t) => get(t, arms[0]).tier;
let seed = 4242; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const sum = (a) => a.reduce((s, x) => s + x, 0), mean = (a) => (a.length ? sum(a) / a.length : 0), q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const fix = (x, d = 3) => (x == null || !Number.isFinite(x) ? null : +x.toFixed(d));
const stat = (a, ts) => { const rr = ts.map((t) => get(t, a)); const pk = sum(rr.map((r) => r.pkgAccepted)), K = sum(rr.map((r) => r.k)); return { pkgRate: pk / K, costPerPkg: pk ? sum(rr.map((r) => r.cost)) / pk : Infinity, hidden: mean(rr.map((r) => r.finalFrac)), cost: mean(rr.map((r) => r.cost)) }; };
const boot = (fn, ts) => { const o = []; for (let b = 0; b < 4000; b++) o.push(fn(ts.map(() => ts[Math.floor(rnd() * ts.length)]))); return o.filter(Number.isFinite); };
const ci = (xs) => (xs.length < 3600 ? [null, null] : [fix(q(xs, 0.025)), fix(q(xs, 0.975))]);
const rows = arms.map((a) => { const s = stat(a, tasks); const rr = tasks.map((t) => get(t, a)); return { arm: a, kind: ARMS[a].kind, pkgAccepted: `${sum(rr.map((r) => r.pkgAccepted))}/${sum(rr.map((r) => r.k))}`, pkgRate: fix(s.pkgRate), pkgRateCI: ci(boot((ts) => stat(a, ts).pkgRate, tasks)), hiddenPassFrac: fix(s.hidden), costPerPkg: fix(s.costPerPkg, 4), costPerPkgCI: ci(boot((ts) => stat(a, ts).costPerPkg, tasks)).map((x) => fix(x, 4)), meanCost: fix(s.cost, 4), probeAllPass: rr.filter((r) => r.probeAllPass).length, falseSuccess: rr.filter((r) => r.falseSuccess).length, accepted: rr.filter((r) => r.accepted).length, calls: fix(mean(rr.map((r) => r.calls)), 1), latencyMedianS: fix(q(rr.map((r) => r.latS), 0.5), 1), budgetHits: rr.filter((r) => r.budgetHit).length, msgs: fix(mean(rr.map((r) => r.msgs)), 1) }; });
const art = rows.filter((r) => r.kind === 'artificial').sort((a, b) => b.pkgRate - a.pkgRate || a.costPerPkg - b.costPerPkg); const ref = art[0].arm;
const contrast = (m, r, ts = tasks) => { const dP = (s) => stat(m, s).pkgRate - stat(r, s).pkgRate, rC = (s) => stat(m, s).costPerPkg / stat(r, s).costPerPkg; const P = boot(dP, ts), C = boot(rC, ts); const dCI = ci(P), rCI = ci(C), rho = rC(ts), [aLo, aHi] = dCI, [cLo, cHi] = rCI;
  // same thresholds as the pre-registered rule, applied to packages (exploratory analogue)
  const nonInf = aLo != null && aLo >= -0.10, cheaper = cHi != null && cHi < 1 && rho <= 0.80, higher = aLo != null && aLo > 0, notMuchCostlier = cHi != null && cHi <= 1.25, worseAcc = aHi != null && aHi < 0, costlier = cLo != null && cLo > 1.25;
  const verdict = (nonInf && cheaper) || (higher && notMuchCostlier) ? 'BETTER' : worseAcc || (costlier && !higher) ? 'WORSE' : 'INCONCLUSIVE';
  return { vs: r, deltaPkgRate: fix(dP(ts)), deltaCI: dCI, costPerPkgRatio: fix(rho), ratioCI: rCI, verdict }; };
const extra = [['THRESH-hab', 'CTRL+PATROL2'], ['THRESH-fixed', 'CTRL+PATROL2'], ['CTRL+PATROL2', 'CTRL'], ['THRESH-hab', 'THRESH-fixed'], ['STIG-evap', 'STIG-noevap'], ['QUORUM-q2', 'QUORUM-q1']].filter(([a, b]) => arms.includes(a) && arms.includes(b));
const out = { note: 'EXPLORATORY — not the pre-registered primary outcome', tasks: tasks.length, referenceByPkgRate: ref, arms: rows, contrasts: {}, byTier: {} };
for (const m of arms.filter((a) => ARMS[a].kind !== 'artificial')) out.contrasts[m] = { vsRef: contrast(m, ref), vsSolo: contrast(m, 'SOLO') };
out.extraContrasts = Object.fromEntries(extra.map(([a, b]) => [`${a} vs ${b}`, contrast(a, b)]));
for (const tier of ['mid', 'multi']) { const ts = tasks.filter((t) => tierOf(t) === tier); out.byTier[tier] = { tasks: ts.length, arms: arms.map((a) => { const s = stat(a, ts); return { arm: a, pkgRate: fix(s.pkgRate), hidden: fix(s.hidden), costPerPkg: fix(s.costPerPkg, 4), meanCost: fix(s.cost, 4) }; }) }; }
out.perTask = Object.fromEntries(tasks.map((t) => [t, { tier: tierOf(t), k: get(t, 'SOLO').k, byArm: Object.fromEntries(arms.map((a) => [a, `${get(t, a).pkgAccepted}/${get(t, a).k}${get(t, a).accepted ? '*' : ''}`])) }]));
fs.writeFileSync(path.join(RESULTS, 'summary-secondary.json'), JSON.stringify(out, null, 1));
console.log('reference (artificial, best package rate):', ref); console.log('arm | pkg accepted | pkgRate (CI) | hidden frac | $/pkg (CI) | mean $ | probe-pass | false succ | accepted | calls | lat s | budget hits');
for (const r of rows) console.log(`${r.arm} | ${r.pkgAccepted} | ${r.pkgRate} (${r.pkgRateCI}) | ${r.hiddenPassFrac} | ${r.costPerPkg} (${r.costPerPkgCI}) | ${r.meanCost} | ${r.probeAllPass} | ${r.falseSuccess} | ${r.accepted} | ${r.calls} | ${r.latencyMedianS} | ${r.budgetHits}`);
for (const [m, c] of Object.entries(out.contrasts)) console.log(`${m} vs ${c.vsRef.vs}: ΔpkgRate ${c.vsRef.deltaPkgRate} [${c.vsRef.deltaCI}] $/pkg× ${c.vsRef.costPerPkgRatio} [${c.vsRef.ratioCI}] → ${c.vsRef.verdict} | vs SOLO: Δ ${c.vsSolo.deltaPkgRate} [${c.vsSolo.deltaCI}] $/pkg× ${c.vsSolo.costPerPkgRatio} [${c.vsSolo.ratioCI}] → ${c.vsSolo.verdict}`);
for (const [k, c] of Object.entries(out.extraContrasts)) console.log(`${k}: ΔpkgRate ${c.deltaPkgRate} [${c.deltaCI}] $/pkg× ${c.costPerPkgRatio} [${c.ratioCI}] → ${c.verdict}`);
for (const t of ['mid', 'multi']) { console.log('tier', t, out.byTier[t].tasks, 'tasks'); console.log(out.byTier[t].arms.map((x) => `${x.arm} ${x.pkgRate} $${x.costPerPkg}`).join(' | ')); }
