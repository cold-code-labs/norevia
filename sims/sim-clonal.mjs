// sim-clonal — expansion/contraction inspired by clonal selection: scale agents up while the error signal persists,
// contract after resolution (return to rest), with optional per-incident-type memory. Compared with fixed N.
// Usage: node sims/sim-clonal.mjs
import { Rng, hashSeed, seedKey, BASE_SEED, Acc, roundDeep, num, ciNum, mainIfDirect } from './lib.mjs';

export const ID = 'sim-clonal';
export const VERSION = '1.0.0';

export const HYPOTHESIS = {
  statement: 'Scaling multiplicatively while an error signal persists and contracting after resolution gives recovery comparable to a large fixed pool with idle cost close to that of a minimal pool; a persistence filter contains the cost of false alarms, and per-incident-type memory speeds up secondary responses.',
  predictions: [
    { id: 'P1', text: 'In the main scenario (false alarm f=0.01), clonal-g2-h1 is not dominated by any fixed N (1,2,4,8,16) in (idle cost, mean recovery time): for each fixed N, clonal is significantly better in at least one of the two metrics.' },
    { id: 'P2', text: 'In the main scenario, clonal-g2-h1 has idle cost <= 2x that of fixed-1 and mean recovery time <= that of fixed-4.' },
    { id: 'P3', text: 'In the noisy scenario (f=0.05), persistence h=3 reduces idle cost by >= 30% vs h=1, with an increase in recovery time <= 20%.' },
    { id: 'P4', text: 'Per-type memory reduces mean recovery time vs no memory (disjoint 95% CIs) with an increase in total cost <= 10%, in the main scenario.' },
    { id: 'P5', text: 'Slow contraction (c=0.8) increases idle cost vs c=0.5 without reducing recovery time by more than 5%, in the main scenario.' },
  ],
};

export const PARAMS = {
  seed: BASE_SEED,
  T: 3000, runs: 1000,
  incident_rate: 1 / 120,                       // Poisson incident arrivals per step
  incident_types: [{ median_work: 20 }, { median_work: 40 }, { median_work: 80 }, { median_work: 120 }, { median_work: 200 }],
  work_sigma_log: 0.5,                         // work ~ lognormal(ln(median), 0.5) in effective agent-steps
  alpha: 0.8,                                  // effective throughput = n^alpha (coordination overhead)
  detection_delay: 2,                          // steps until the error signal reflects a new incident
  scenarios: { main: { false_alarm: 0.01 }, noisy: { false_alarm: 0.05 } },
  n_min: 1, n_max: 32,
  policies: {
    'fixed-1': { kind: 'fixed', N: 1 }, 'fixed-2': { kind: 'fixed', N: 2 }, 'fixed-4': { kind: 'fixed', N: 4 }, 'fixed-8': { kind: 'fixed', N: 8 }, 'fixed-16': { kind: 'fixed', N: 16 },
    'clonal-g2-h1': { kind: 'clonal', g: 2, h: 1, c: 0.5, memory: false },
    'clonal-g2-h3': { kind: 'clonal', g: 2, h: 3, c: 0.5, memory: false },
    'clonal-g1.5-h1': { kind: 'clonal', g: 1.5, h: 1, c: 0.5, memory: false },
    'clonal-g2-h1-mem': { kind: 'clonal', g: 2, h: 1, c: 0.5, memory: true },
    'clonal-g2-h1-c0.8': { kind: 'clonal', g: 2, h: 1, c: 0.8, memory: false },
  },
  rules: 'clonal: if the signal has been on for >= h steps, n <- min(n_max, ceil(n*g)); if off, n <- max(n_min, floor(n*c)). Memory: on detecting an already-seen type, n <- max(n, previous_peak_n_of_the_type). FIFO work: throughput n^alpha goes to the oldest incident; any remainder passes to the next one.',
  idle_cost: 'sum of n(t) over steps with no open incident (idle agent-steps)',
};
const PN = Object.keys(PARAMS.policies);

function genIncidents(rng) {
  const { T, incident_rate, incident_types, work_sigma_log } = PARAMS; const out = [];
  for (let t = 0; t < T; t++) { const k = rng.poisson(incident_rate); for (let i = 0; i < k; i++) { const ty = rng.int(incident_types.length); out.push({ start: t, type: ty, work: rng.lognormal(Math.log(incident_types[ty].median_work), work_sigma_log) }); } }
  return out;
}
function simulate(pol, incidents, falseAlarms) {
  const { T, alpha, detection_delay, n_min, n_max } = PARAMS;
  let n = pol.kind === 'fixed' ? pol.N : n_min, onFor = 0, next = 0;
  const open = []; const mem = new Map(); const peak = new Map();
  let idle = 0, total = 0, idleSteps = 0; const rec = []; let maxN = n;
  for (let t = 0; t < T; t++) {
    while (next < incidents.length && incidents[next].start === t) { open.push({ ...incidents[next], left: incidents[next].work, detected: false }); next++; }
    // signal and control (before working in this step)
    if (pol.kind === 'clonal') {
      let signal = falseAlarms[t] === 1;
      for (const inc of open) if (t - inc.start >= detection_delay) { signal = true; if (!inc.detected) { inc.detected = true; if (pol.memory && mem.has(inc.type)) n = Math.max(n, mem.get(inc.type)); } }
      onFor = signal ? onFor + 1 : 0;
      if (signal && onFor >= pol.h) n = Math.min(n_max, Math.ceil(n * pol.g));
      else if (!signal) n = Math.max(n_min, Math.floor(n * pol.c));
    }
    maxN = Math.max(maxN, n); total += n;
    if (open.length === 0) { idle += n; idleSteps++; }
    // FIFO work
    let cap = Math.pow(n, alpha);
    for (const inc of open) peak.set(inc, Math.max(peak.get(inc) || 0, n));
    while (cap > 1e-12 && open.length) {
      const inc = open[0]; const d = Math.min(cap, inc.left); inc.left -= d; cap -= d;
      if (inc.left <= 1e-9) { rec.push(t - inc.start + 1); if (pol.memory) mem.set(inc.type, peak.get(inc)); peak.delete(inc); open.shift(); }
    }
  }
  return { idle, total, idleSteps, meanRec: rec.length ? rec.reduce((a, b) => a + b, 0) / rec.length : NaN, nRes: rec.length, unresolved: open.length, maxN, p95: rec.length ? rec.sort((a, b) => a - b)[Math.floor(0.95 * (rec.length - 1))] : NaN };
}

export function run() {
  const out = {};
  const pairs = {};
  for (const [sc, cfg] of Object.entries(PARAMS.scenarios)) {
    const A = {}; for (const p of PN) A[p] = { idle: new Acc(), total: new Acc(), rec: new Acc(), p95: new Acc(), unresolved: new Acc(), maxN: new Acc() };
    const P = { 'idle:h3-h1': new Acc(), 'rec:h3-h1': new Acc(), 'rec:mem-nomem': new Acc(), 'total:mem-nomem': new Acc(), 'idle:c0.8-c0.5': new Acc(), 'rec:c0.8-c0.5': new Acc() };
    for (const N of [1, 2, 4, 8, 16]) { P[`idle:clonal-fixed${N}`] = new Acc(); P[`rec:clonal-fixed${N}`] = new Acc(); }
    for (let r = 0; r < PARAMS.runs; r++) {
      const rng = new Rng(hashSeed(BASE_SEED, ID, 'env', r)); // same incidents in both scenarios and for every policy
      const inc = genIncidents(rng);
      const fa = new Uint8Array(PARAMS.T); const rf = new Rng(hashSeed(BASE_SEED, ID, 'fa', seedKey(sc), r)); for (let t = 0; t < PARAMS.T; t++) fa[t] = rf.uniform() < cfg.false_alarm ? 1 : 0;
      const res = {};
      for (const p of PN) { const o = simulate(PARAMS.policies[p], inc, fa); res[p] = o; const a = A[p];
        a.idle.add(o.idle); a.total.add(o.total); if (Number.isFinite(o.meanRec)) a.rec.add(o.meanRec); if (Number.isFinite(o.p95)) a.p95.add(o.p95); a.unresolved.add(o.unresolved); a.maxN.add(o.maxN); }
      const ok = (x) => Number.isFinite(x);
      P['idle:h3-h1'].add(res['clonal-g2-h3'].idle - res['clonal-g2-h1'].idle);
      if (ok(res['clonal-g2-h3'].meanRec) && ok(res['clonal-g2-h1'].meanRec)) P['rec:h3-h1'].add(res['clonal-g2-h3'].meanRec - res['clonal-g2-h1'].meanRec);
      if (ok(res['clonal-g2-h1-mem'].meanRec) && ok(res['clonal-g2-h1'].meanRec)) P['rec:mem-nomem'].add(res['clonal-g2-h1-mem'].meanRec - res['clonal-g2-h1'].meanRec);
      P['total:mem-nomem'].add(res['clonal-g2-h1-mem'].total - res['clonal-g2-h1'].total);
      P['idle:c0.8-c0.5'].add(res['clonal-g2-h1-c0.8'].idle - res['clonal-g2-h1'].idle);
      if (ok(res['clonal-g2-h1-c0.8'].meanRec) && ok(res['clonal-g2-h1'].meanRec)) P['rec:c0.8-c0.5'].add(res['clonal-g2-h1-c0.8'].meanRec - res['clonal-g2-h1'].meanRec);
      for (const N of [1, 2, 4, 8, 16]) { P[`idle:clonal-fixed${N}`].add(res['clonal-g2-h1'].idle - res[`fixed-${N}`].idle); if (ok(res['clonal-g2-h1'].meanRec) && ok(res[`fixed-${N}`].meanRec)) P[`rec:clonal-fixed${N}`].add(res['clonal-g2-h1'].meanRec - res[`fixed-${N}`].meanRec); }
    }
    const S = {}; for (const p of PN) { S[p] = {}; for (const m of Object.keys(A[p])) S[p][m] = A[p][m].ci(); S[p].idle_per_step = A[p].idle.mean / PARAMS.T; S[p].total_per_step = A[p].total.mean / PARAMS.T; }
    out[sc] = { summary: S, paired: Object.fromEntries(Object.entries(P).map(([k, a]) => [k, a.ci()])),
      pareto: PN.map((p) => ({ policy: p, idle_cost: S[p].idle.mean, mean_recovery: S[p].rec.mean, total_cost: S[p].total.mean })) };
  }
  const M = out.main, R = out.noisy;
  const p1rows = [1, 2, 4, 8, 16].map((N) => { const di = M.paired[`idle:clonal-fixed${N}`], dr = M.paired[`rec:clonal-fixed${N}`]; return { N, betterIdle: di.hi < 0, betterRec: dr.hi < 0, di, dr }; });
  const p1 = p1rows.every((x) => x.betterIdle || x.betterRec);
  const cS = M.summary['clonal-g2-h1'];
  const p2 = cS.idle.mean <= 2 * M.summary['fixed-1'].idle.mean && cS.rec.mean <= M.summary['fixed-4'].rec.mean;
  const idleRed = 1 - R.summary['clonal-g2-h3'].idle.mean / R.summary['clonal-g2-h1'].idle.mean;
  const recInc = R.summary['clonal-g2-h3'].rec.mean / R.summary['clonal-g2-h1'].rec.mean - 1;
  const p3 = idleRed >= 0.3 && recInc <= 0.2;
  const totInc = M.summary['clonal-g2-h1-mem'].total.mean / cS.total.mean - 1;
  const p4 = M.paired['rec:mem-nomem'].hi < 0 && totInc <= 0.1;
  const recRed = 1 - M.summary['clonal-g2-h1-c0.8'].rec.mean / cS.rec.mean;
  const p5 = M.paired['idle:c0.8-c0.5'].lo > 0 && recRed <= 0.05;
  const tests = [
    { id: 'P1', verdict: p1 ? 'supported' : 'not supported', detail: p1rows.map((x) => `vs fixed-${x.N}: Δidle ${ciNum(x.di, 0)}, Δrecovery ${ciNum(x.dr, 1)}`).join('; ') },
    { id: 'P2', verdict: p2 ? 'supported' : 'not supported', detail: `clonal idle ${num(cS.idle.mean, 0)} vs 2×fixed-1 ${num(2 * M.summary['fixed-1'].idle.mean, 0)}; clonal recovery ${num(cS.rec.mean, 1)} vs fixed-4 ${num(M.summary['fixed-4'].rec.mean, 1)}` },
    { id: 'P3', verdict: p3 ? 'supported' : 'not supported', detail: `noisy: idle reduction with h=3 ${num(100 * idleRed, 1)}%; recovery increase ${num(100 * recInc, 1)}%` },
    { id: 'P4', verdict: p4 ? 'supported' : 'not supported', detail: `Δrecovery with memory ${ciNum(M.paired['rec:mem-nomem'], 2)}; total cost increase ${num(100 * totInc, 1)}%` },
    { id: 'P5', verdict: p5 ? 'supported' : 'not supported', detail: `Δidle c=0.8 ${ciNum(M.paired['idle:c0.8-c0.5'], 0)}; recovery reduction ${num(100 * recRed, 1)}%` },
  ];
  const line = (sc, p) => { const s = out[sc].summary[p]; return `${sc} ${p}: idle ${ciNum(s.idle, 0)} agent-steps, recovery ${ciNum(s.rec, 1)} steps, total cost/step ${num(s.total_per_step, 2)}`; };
  const headline = ['fixed-1', 'fixed-4', 'fixed-16', 'clonal-g2-h1', 'clonal-g2-h1-mem'].map((p) => line('main', p)).concat(['clonal-g2-h1', 'clonal-g2-h3'].map((p) => line('noisy', p)));
  return roundDeep({ id: ID, version: VERSION, title: 'Clonal expansion/contraction vs fixed N', seed: BASE_SEED, hypothesis: HYPOTHESIS, params: PARAMS, results: out, tests, headline }, 4);
}

mainIfDirect(import.meta.url, run);
