// sim-response-threshold — task allocation under fluctuating demand:
// response thresholds (inspired by Bonabeau, Theraulaz & Deneubourg 1996) vs fixed roles vs a central dispatcher
// with communication cost and observation delay.
// Usage: node sims/sim-response-threshold.mjs
import { Rng, hashSeed, seedKey, BASE_SEED, Acc, roundDeep, num, ciNum, mainIfDirect } from './lib.mjs';

export const ID = 'sim-response-threshold';
export const VERSION = '1.0.0';
const SEED_ID = seedKey(ID); // frozen seed key (see FROZEN_SEED_KEYS in lib.mjs)

export const HYPOTHESIS = {
  statement: 'Heterogeneous response thresholds, reading only the local stimulus (backlog), allocate agents adaptively without messages: better latency than fixed roles sized for the mean, fewer active agents than fixed roles sized for the peak, and lower total cost than a central dispatcher when messages have a cost or when the dispatcher\'s information arrives late.',
  predictions: [
    { id: 'P1', text: 'Threshold (theta~U[5,50], n=2, p_quit=0.1) has lower mean latency than fixed-mean (3+3 agents), paired difference with 95% CI excluding 0, using zero messages.' },
    { id: 'P2', text: 'Threshold uses fewer active agents on average than fixed-peak (8+8) and has mean latency <= 2x that of fixed-peak.' },
    { id: 'P3', text: 'A dispatcher with delay L=0 dominates the threshold rule in (active agents, latency) when messages are free: fewer active agents AND latency <= threshold.' },
    { id: 'P4', text: 'Mean latency and peak backlog of the dispatcher grow with the delay L (0<2<5<10); for L>=5 the dispatcher\'s peak backlog exceeds that of the threshold rule.' },
    { id: 'P5', text: 'With a cost of 0.2 per message (relative to 1 agent-step), the total cost per step of the threshold rule is lower than that of any dispatcher (L=0..10).' },
  ],
};

export const PARAMS = {
  seed: BASE_SEED,
  M: 40, types: 2, T: 1000, runs: 1000,
  base_rate: 1.0,                  // Poisson arrivals per type per step
  spikes: [{ start: 200, type: 0 }, { start: 450, type: 1 }, { start: 700, type: 0 }],
  spike_duration: 50, spike_multiplier: 4,
  mu: 0.5,                         // prob. that an active agent completes 1 task of its type per step (if there is a queue)
  recovery_level: 5,               // total backlog considered "recovered" after the spike
  recovery_cap: 250,
  msg_costs: [0, 0.05, 0.2],       // cost per message in agent-steps
  strategies: {
    'threshold-5-50': { kind: 'threshold', thMin: 5, thMax: 50, n: 2, pQuit: 0.1, desc: 'Bonabeau 1996: theta_ij~U[5,50], P(engage)=s^2/(s^2+theta^2), quit with prob. 0.1/step; s = backlog of the type' },
    'threshold-2-20': { kind: 'threshold', thMin: 2, thMax: 20, n: 2, pQuit: 0.1, desc: 'lower thresholds (more sensitive)' },
    'threshold-10-100': { kind: 'threshold', thMin: 10, thMax: 100, n: 2, pQuit: 0.1, desc: 'higher thresholds (less sensitive)' },
    'threshold-homog-20': { kind: 'threshold', thMin: 20, thMax: 20, n: 2, pQuit: 0.1, desc: 'homogeneous threshold theta=20' },
    'threshold-idle-quit': { kind: 'threshold', thMin: 5, thMax: 50, n: 2, pQuit: 0.02, pIdleQuit: 0.3, desc: 'engineering variant: quits with 0.02/step, or 0.3 if the queue of its type is empty' },
    'fixed-mean': { kind: 'fixed', perType: 3, desc: '3+3 agents always active (sized ~1.5x the base demand)' },
    'fixed-peak': { kind: 'fixed', perType: 8, desc: '8+8 agents always active (sized for the peak)' },
    'dispatcher-L0': { kind: 'dispatcher', lag: 0, H: 5, ewma: 0.2, desc: 'central: target_j=ceil((lambda_hat_j + queue_j/H)/mu); 1 status msg per active agent/step + 1 msg per command' },
    'dispatcher-L2': { kind: 'dispatcher', lag: 2, H: 5, ewma: 0.2 },
    'dispatcher-L5': { kind: 'dispatcher', lag: 5, H: 5, ewma: 0.2 },
    'dispatcher-L10': { kind: 'dispatcher', lag: 10, H: 5, ewma: 0.2 },
  },
};
const SN = Object.keys(PARAMS.strategies);

function rateAt(t, j) {
  for (const s of PARAMS.spikes) if (s.type === j && t >= s.start && t < s.start + PARAMS.spike_duration) return PARAMS.base_rate * PARAMS.spike_multiplier;
  return PARAMS.base_rate;
}

function simulate(cfg, arrivals, rng) {
  const { M, T, mu, types } = PARAMS;
  const CAP = 1 << 14;
  const q = [new Int32Array(CAP), new Int32Array(CAP)], head = [0, 0], tail = [0, 0];
  const active = new Int8Array(M).fill(-1);
  const theta = [new Float64Array(M), new Float64Array(M)];
  if (cfg.kind === 'threshold') for (let j = 0; j < types; j++) for (let i = 0; i < M; i++) theta[j][i] = cfg.thMin + (cfg.thMax - cfg.thMin) * rng.uniform();
  if (cfg.kind === 'fixed') { let i = 0; for (let j = 0; j < types; j++) for (let k = 0; k < cfg.perType; k++) active[i++] = j; }
  const qHist = [new Int32Array(T), new Int32Array(T)], aHist = [new Float64Array(T), new Float64Array(T)];
  const lamHat = [PARAMS.base_rate, PARAMS.base_rate];
  let activeSum = 0, backlogSum = 0, msgs = 0, done = 0;
  const lat = [];
  const backlogTrace = new Int32Array(T);
  for (let t = 0; t < T; t++) {
    for (let j = 0; j < types; j++) { const n = arrivals[j][t]; for (let k = 0; k < n; k++) q[j][(tail[j]++) & (CAP - 1)] = t; }
    const ql = [tail[0] - head[0], tail[1] - head[1]];
    // ---- allocation decision ----
    if (cfg.kind === 'threshold') {
      for (let i = 0; i < M; i++) {
        const a = active[i];
        if (a >= 0) {
          const pq = cfg.pIdleQuit !== undefined && ql[a] === 0 ? cfg.pIdleQuit : cfg.pQuit;
          if (rng.uniform() < pq) active[i] = -1;
        } else {
          const first = rng.uniform() < 0.5 ? 0 : 1;
          for (let k = 0; k < types; k++) {
            const j = (first + k) % types, s = ql[j];
            if (s <= 0) continue;
            const sn = s * s, th = theta[j][i];
            if (rng.uniform() < sn / (sn + th * th)) { active[i] = j; break; }
          }
        }
      }
    } else if (cfg.kind === 'dispatcher') {
      for (let j = 0; j < types; j++) { qHist[j][t] = ql[j]; aHist[j][t] = arrivals[j][t]; }
      const to = t - cfg.lag;
      const target = [0, 0];
      for (let j = 0; j < types; j++) {
        if (to >= 0) lamHat[j] = (1 - cfg.ewma) * lamHat[j] + cfg.ewma * aHist[j][to];
        const qo = to >= 0 ? qHist[j][to] : 0;
        target[j] = Math.min(M, Math.max(1, Math.ceil((lamHat[j] + qo / cfg.H) / mu)));
      }
      if (target[0] + target[1] > M) { const f = M / (target[0] + target[1]); target[0] = Math.floor(target[0] * f); target[1] = M - target[0]; }
      const cnt = [0, 0]; for (let i = 0; i < M; i++) if (active[i] >= 0) cnt[active[i]]++;
      for (let j = 0; j < types; j++) while (cnt[j] > target[j]) { for (let i = M - 1; i >= 0; i--) if (active[i] === j) { active[i] = -1; break; } cnt[j]--; msgs++; }
      for (let j = 0; j < types; j++) while (cnt[j] < target[j]) { for (let i = 0; i < M; i++) if (active[i] === -1) { active[i] = j; break; } cnt[j]++; msgs++; }
    }
    // ---- service ----
    let nAct = 0;
    for (let i = 0; i < M; i++) {
      const j = active[i]; if (j < 0) continue; nAct++;
      if (tail[j] > head[j] && rng.uniform() < mu) { const at = q[j][(head[j]++) & (CAP - 1)]; lat.push(t - at + 1); done++; }
    }
    if (cfg.kind === 'dispatcher') msgs += nAct; // status report from each active agent
    activeSum += nAct;
    const bl = (tail[0] - head[0]) + (tail[1] - head[1]);
    backlogSum += bl; backlogTrace[t] = bl;
  }
  // peak/recovery metrics
  let peakSum = 0, recSum = 0;
  for (const s of PARAMS.spikes) {
    const end = s.start + PARAMS.spike_duration;
    let peak = 0; for (let t = s.start; t < Math.min(T, end + 50); t++) peak = Math.max(peak, backlogTrace[t]);
    let rec = PARAMS.recovery_cap; for (let t = end; t < Math.min(T, end + PARAMS.recovery_cap); t++) if (backlogTrace[t] <= PARAMS.recovery_level) { rec = t - end; break; }
    peakSum += peak; recSum += rec;
  }
  lat.sort((a, b) => a - b);
  const meanLat = lat.reduce((a, b) => a + b, 0) / Math.max(1, lat.length);
  const p95 = lat.length ? lat[Math.min(lat.length - 1, Math.floor(0.95 * lat.length))] : 0;
  return { meanActive: activeSum / T, meanBacklog: backlogSum / T, meanLat, p95, peak: peakSum / PARAMS.spikes.length,
    recovery: recSum / PARAMS.spikes.length, msgsPerStep: msgs / T, unfinished: (tail[0] - head[0]) + (tail[1] - head[1]), trace: backlogTrace };
}

export function run() {
  const { runs, T, types } = PARAMS;
  const metrics = ['meanActive', 'meanBacklog', 'meanLat', 'p95', 'peak', 'recovery', 'msgsPerStep', 'unfinished'];
  const A = {}; for (const s of SN) { A[s] = {}; for (const m of metrics) A[s][m] = new Acc(); A[s].cost = PARAMS.msg_costs.map(() => new Acc()); }
  const traceSum = {}; for (const s of SN) traceSum[s] = new Float64Array(T);
  // paired differences
  const pairs = { 'lat:threshold-5-50 - fixed-mean': new Acc(), 'active:threshold-5-50 - fixed-peak': new Acc(), 'active:dispatcher-L0 - threshold-5-50': new Acc(), 'lat:dispatcher-L0 - threshold-5-50': new Acc() };
  for (const L of [0, 2, 5, 10]) pairs[`peak:dispatcher-L${L} - threshold-5-50`] = new Acc();
  for (const c of PARAMS.msg_costs) for (const L of [0, 2, 5, 10]) pairs[`cost${c}:threshold-5-50 - dispatcher-L${L}`] = new Acc();
  for (let r = 0; r < runs; r++) {
    const ar = new Rng(hashSeed(BASE_SEED, SEED_ID, 'arrivals', r));
    const arrivals = []; for (let j = 0; j < types; j++) { const a = new Int32Array(T); for (let t = 0; t < T; t++) a[t] = ar.poisson(rateAt(t, j)); arrivals.push(a); }
    const res = {};
    for (const s of SN) {
      const o = simulate(PARAMS.strategies[s], arrivals, new Rng(hashSeed(BASE_SEED, SEED_ID, seedKey(s), r)));
      res[s] = o;
      for (const m of metrics) A[s][m].add(o[m]);
      PARAMS.msg_costs.forEach((c, k) => A[s].cost[k].add(o.meanActive + c * o.msgsPerStep));
      for (let t = 0; t < T; t++) traceSum[s][t] += o.trace[t];
    }
    pairs['lat:threshold-5-50 - fixed-mean'].add(res['threshold-5-50'].meanLat - res['fixed-mean'].meanLat);
    pairs['active:threshold-5-50 - fixed-peak'].add(res['threshold-5-50'].meanActive - res['fixed-peak'].meanActive);
    pairs['active:dispatcher-L0 - threshold-5-50'].add(res['dispatcher-L0'].meanActive - res['threshold-5-50'].meanActive);
    pairs['lat:dispatcher-L0 - threshold-5-50'].add(res['dispatcher-L0'].meanLat - res['threshold-5-50'].meanLat);
    for (const L of [0, 2, 5, 10]) pairs[`peak:dispatcher-L${L} - threshold-5-50`].add(res[`dispatcher-L${L}`].peak - res['threshold-5-50'].peak);
    for (const c of PARAMS.msg_costs) for (const L of [0, 2, 5, 10]) pairs[`cost${c}:threshold-5-50 - dispatcher-L${L}`].add((res['threshold-5-50'].meanActive + c * res['threshold-5-50'].msgsPerStep) - (res[`dispatcher-L${L}`].meanActive + c * res[`dispatcher-L${L}`].msgsPerStep));
  }
  const summary = {};
  for (const s of SN) { summary[s] = {}; for (const m of metrics) summary[s][m] = A[s][m].ci(); summary[s].total_cost_per_step = PARAMS.msg_costs.map((c, k) => ({ msg_cost: c, ...A[s].cost[k].ci() })); }
  const P = {}; for (const k of Object.keys(pairs)) P[k] = pairs[k].ci();
  // mean backlog curve (sampled every 5 steps) for charts
  const step = 5, tAxis = []; for (let t = 0; t < T; t += step) tAxis.push(t);
  const traces = {}; for (const s of SN) traces[s] = tAxis.map((t) => traceSum[s][t] / runs);

  const thr = summary['threshold-5-50'];
  const neg = (k) => P[k].hi < 0, pos = (k) => P[k].lo > 0;
  const p1 = neg('lat:threshold-5-50 - fixed-mean') && thr.msgsPerStep.mean === 0;
  const p2 = neg('active:threshold-5-50 - fixed-peak') && thr.meanLat.mean <= 2 * summary['fixed-peak'].meanLat.mean;
  const p3 = neg('active:dispatcher-L0 - threshold-5-50') && P['lat:dispatcher-L0 - threshold-5-50'].lo <= 0 && P['lat:dispatcher-L0 - threshold-5-50'].mean <= 0;
  const Ls = [0, 2, 5, 10];
  const latInc = Ls.every((L, i) => i === 0 || summary[`dispatcher-L${L}`].meanLat.mean > summary[`dispatcher-L${Ls[i - 1]}`].meanLat.mean);
  const peakInc = Ls.every((L, i) => i === 0 || summary[`dispatcher-L${L}`].peak.mean > summary[`dispatcher-L${Ls[i - 1]}`].peak.mean);
  const peakVsThr = [5, 10].every((L) => pos(`peak:dispatcher-L${L} - threshold-5-50`));
  const p4 = latInc && peakInc && peakVsThr;
  const p5 = Ls.every((L) => neg(`cost0.2:threshold-5-50 - dispatcher-L${L}`));
  const tests = [
    { id: 'P1', verdict: p1 ? 'supported' : 'not supported', detail: `Δlatency threshold−fixed-mean = ${ciNum(P['lat:threshold-5-50 - fixed-mean'])} steps; threshold messages = 0` },
    { id: 'P2', verdict: p2 ? 'supported' : 'not supported', detail: `Δactive threshold−fixed-peak = ${ciNum(P['active:threshold-5-50 - fixed-peak'])}; threshold latency ${num(thr.meanLat.mean)} vs fixed-peak ${num(summary['fixed-peak'].meanLat.mean)}` },
    { id: 'P3', verdict: p3 ? 'supported' : 'not supported', detail: `Δactive disp.L0−threshold = ${ciNum(P['active:dispatcher-L0 - threshold-5-50'])}; Δlatency = ${ciNum(P['lat:dispatcher-L0 - threshold-5-50'])}` },
    { id: 'P4', verdict: p4 ? 'supported' : (latInc || peakInc || peakVsThr ? 'partially supported' : 'not supported'), detail: `latency grows with L=${latInc}; peak grows with L=${peakInc}; disp. peak (L=5,10) > threshold=${peakVsThr} (Δpeak L5 ${ciNum(P['peak:dispatcher-L5 - threshold-5-50'])}, L10 ${ciNum(P['peak:dispatcher-L10 - threshold-5-50'])})` },
    { id: 'P5', verdict: p5 ? 'supported' : 'not supported', detail: Ls.map((L) => `L${L}: Δcost ${ciNum(P[`cost0.2:threshold-5-50 - dispatcher-L${L}`])}`).join('; ') },
  ];
  const row = (s) => `${s}: active ${ciNum(summary[s].meanActive)}, latency ${ciNum(summary[s].meanLat)}, peak ${ciNum(summary[s].peak, 1)}, msgs/step ${num(summary[s].msgsPerStep.mean, 1)}`;
  const headline = [row('threshold-5-50'), row('fixed-mean'), row('fixed-peak'), row('dispatcher-L0'), row('dispatcher-L10'),
    `Total cost/step at 0.2 per message: threshold ${ciNum(thr.total_cost_per_step[2])} vs dispatcher-L0 ${ciNum(summary['dispatcher-L0'].total_cost_per_step[2])}`];
  return roundDeep({ id: ID, version: VERSION, title: 'Response thresholds vs fixed roles vs central dispatcher', seed: BASE_SEED,
    hypothesis: HYPOTHESIS, params: PARAMS, results: { summary, paired_differences: P, backlog_trace: { t: tAxis, mean_backlog: traces } }, tests, headline }, 4);
}

mainIfDirect(import.meta.url, run);
