// sim-stigmergy — coordination through a shared trail with evaporation vs direct all-to-all messages
// vs no coordination, in sequential target search on a grid (abstract exploration/foraging).
// Usage: node sims/sim-stigmergy.mjs
import { Rng, hashSeed, seedKey, BASE_SEED, Acc, roundDeep, num, ciNum, pct, mainIfDirect } from './lib.mjs';

export const ID = 'sim-stigmergy';
export const VERSION = '1.0.0';
const SEED_ID = seedKey(ID); // frozen seed key (see FROZEN_SEED_KEYS in lib.mjs)

export const HYPOTHESIS = {
  statement: 'A shared trail ("I have already explored here") reduces duplicated work and time to solution without messages; since agents do not know when an episode ends, old trail becomes noise, and evaporation works as forgetting: there is an optimal intermediate rate, and a trail without evaporation grows without bound.',
  predictions: [
    { id: 'P1', text: 'For K=4 and K=16, stigmergy with low evaporation (epsilon=0.01) has lower mean time to solution and lower fraction of duplicated visits than no-coordination (disjoint 95% CIs).' },
    { id: 'P2', text: 'Time to solution is U-shaped in epsilon: there is an intermediate epsilon (0<epsilon<1) with significantly lower time (disjoint 95% CIs) than epsilon=0 and than epsilon=1, for K=4 and K=16.' },
    { id: 'P3', text: 'All-to-all messages (perfect information, reset every episode) have the lowest time, at the cost of K(K-1) messages per step; the best stigmergy epsilon is within at most 15% of the time of messages, with zero messages.' },
    { id: 'P4', text: 'With epsilon=0, trail mass grows ~linearly with time (unbounded memory) and the 10th episode is slower than the 1st; with the best epsilon the mass stabilises (mass ratio ep.10/ep.5 < 1.2).' },
  ],
};

export const PARAMS = {
  seed: BASE_SEED,
  grid: 24, neighborhood: 4, Ks: [4, 16], episodes: 10, runs: 500, max_steps_episode: 20000,
  epsilons: [0, 0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1],
  deposit: 1,
  strategies: {
    'no-coordination': 'random walk without immediate return',
    'stigmergy': 'moves to the neighbour with the least trail (decayed by (1-epsilon)^dt), ties at random; deposits +1 on arrival; does NOT know when the episode ends',
    'all-to-all-messages': 'each agent broadcasts its position to all others every step (K(K-1) msgs/step) + target-found notice (K-1); picks the least-visited neighbour in the current episode',
  },
  duplicated_work: 'fraction of moves that reach a node already visited (by any agent) in the current episode',
  episode: 'target uniform on the grid; the episode ends when an agent steps on the target; a new target appears and agents continue from where they are',
};

function buildGrid(W) {
  const n = W * W, nb = new Int32Array(n * 4).fill(-1), deg = new Uint8Array(n);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const v = y * W + x; const ns = [];
    if (x > 0) ns.push(v - 1); if (x < W - 1) ns.push(v + 1); if (y > 0) ns.push(v - W); if (y < W - 1) ns.push(v + W);
    deg[v] = ns.length; ns.forEach((u, i) => { nb[v * 4 + i] = u; });
  }
  return { n, nb, deg };
}

function simulateRun(G, K, mode, eps, rng) {
  const { n, nb, deg } = G; const W = PARAMS.grid;
  const pos = new Int32Array(K).fill(Math.floor(W / 2) * W + Math.floor(W / 2)), prev = new Int32Array(K).fill(-1);
  const m = new Float64Array(n), tl = new Float64Array(n); // trail and time of last update
  const cnt = new Int32Array(n);                             // per-episode count (messages)
  const visitedEp = new Int32Array(n).fill(-1);
  const logk = eps > 0 && eps < 1 ? Math.log(1 - eps) : 0;
  const val = (v, t) => { if (eps === 0) return m[v]; if (eps >= 1) return t === tl[v] ? m[v] : 0; return m[v] * Math.exp((t - tl[v]) * logk); };
  let t = 0;
  const epTimes = [], epDup = [], epMass = [], epMsgs = [];
  const cand = new Int32Array(4);
  for (let e = 0; e < PARAMS.episodes; e++) {
    let target; do { target = rng.int(n); } while (pos.some((p) => p === target));
    for (let k = 0; k < K; k++) visitedEp[pos[k]] = e;
    if (mode === 'all-to-all-messages') { cnt.fill(0); for (let k = 0; k < K; k++) cnt[pos[k]]++; }
    let mass = 0; if (mode === 'stigmergy') for (let v = 0; v < n; v++) mass += val(v, t);
    epMass.push(mass);
    let steps = 0, moves = 0, dups = 0, found = false;
    while (!found && steps < PARAMS.max_steps_episode) {
      t++; steps++;
      for (let k = 0; k < K && !found; k++) {
        const v = pos[k], d = deg[v]; let next;
        if (mode === 'no-coordination') {
          let c = 0; for (let i = 0; i < d; i++) { const u = nb[v * 4 + i]; if (u !== prev[k]) cand[c++] = u; }
          next = c ? cand[rng.int(c)] : nb[v * 4 + rng.int(d)];
        } else {
          let best = Infinity, c = 0;
          for (let i = 0; i < d; i++) {
            const u = nb[v * 4 + i]; const x = mode === 'stigmergy' ? val(u, t) : cnt[u];
            if (x < best - 1e-12) { best = x; c = 0; cand[c++] = u; } else if (Math.abs(x - best) <= 1e-12) cand[c++] = u;
          }
          next = cand[rng.int(c)];
        }
        prev[k] = v; pos[k] = next; moves++;
        if (visitedEp[next] === e) dups++; else visitedEp[next] = e;
        if (mode === 'stigmergy') { m[next] = val(next, t) + PARAMS.deposit; tl[next] = t; }
        else if (mode === 'all-to-all-messages') cnt[next]++;
        if (next === target) found = true;
      }
    }
    epTimes.push(steps); epDup.push(dups / moves);
    epMsgs.push(mode === 'all-to-all-messages' ? steps * K * (K - 1) + (K - 1) : 0);
  }
  return { epTimes, epDup, epMass, epMsgs };
}

export function run() {
  const G = buildGrid(PARAMS.grid);
  const configs = [];
  for (const K of PARAMS.Ks) {
    configs.push({ K, mode: 'no-coordination', eps: null, label: 'no-coordination', seedLabel: seedKey('no-coordination') });
    configs.push({ K, mode: 'all-to-all-messages', eps: null, label: 'all-to-all-messages', seedLabel: seedKey('all-to-all-messages') });
    for (const eps of PARAMS.epsilons) configs.push({ K, mode: 'stigmergy', eps, label: `stigmergy-e${eps}`, seedLabel: `${seedKey('stigmergy-e')}${eps}` });
  }
  const results = [];
  for (const c of configs) {
    const time = new Acc(), dup = new Acc(), msgs = new Acc(), censored = { n: 0 };
    const byEp = Array.from({ length: PARAMS.episodes }, () => new Acc()), massEp = Array.from({ length: PARAMS.episodes }, () => new Acc());
    for (let r = 0; r < PARAMS.runs; r++) {
      const rng = new Rng(hashSeed(BASE_SEED, SEED_ID, c.K, c.seedLabel, r));
      const o = simulateRun(G, c.K, c.mode, c.eps ?? 0, rng);
      time.add(o.epTimes.reduce((a, b) => a + b, 0) / o.epTimes.length);
      dup.add(o.epDup.reduce((a, b) => a + b, 0) / o.epDup.length);
      msgs.add(o.epMsgs.reduce((a, b) => a + b, 0) / o.epMsgs.length);
      o.epTimes.forEach((x, i) => { byEp[i].add(x); if (x >= PARAMS.max_steps_episode) censored.n++; });
      o.epMass.forEach((x, i) => massEp[i].add(x));
    }
    results.push({ K: c.K, strategy: c.mode, epsilon: c.eps, label: c.label, time_to_solution: time.ci(), duplicated_fraction: dup.ci(), messages_per_episode: msgs.ci(),
      time_by_episode: byEp.map((a) => a.mean), trail_mass_at_episode_start: massEp.map((a) => a.mean), censored_episodes: censored.n });
  }
  const get = (K, label) => results.find((x) => x.K === K && x.label === label);
  const less = (a, b) => a.hi < b.lo;
  // P1
  const p1 = PARAMS.Ks.every((K) => { const s = get(K, 'stigmergy-e0.01'), n = get(K, 'no-coordination'); return less(s.time_to_solution, n.time_to_solution) && less(s.duplicated_fraction, n.duplicated_fraction); });
  // P2 + best epsilon
  const best = {}; const p2parts = [];
  for (const K of PARAMS.Ks) {
    const st = PARAMS.epsilons.map((e) => get(K, `stigmergy-e${e}`));
    const b = st.reduce((a, x) => (x.time_to_solution.mean < a.time_to_solution.mean ? x : a));
    best[K] = b;
    const ok = b.epsilon > 0 && b.epsilon < 1 && less(b.time_to_solution, st[0].time_to_solution) && less(b.time_to_solution, st[st.length - 1].time_to_solution);
    p2parts.push({ K, ok, best_eps: b.epsilon, t_best: b.time_to_solution.mean, t0: st[0].time_to_solution.mean, t1: st[st.length - 1].time_to_solution.mean });
  }
  const p2 = p2parts.every((x) => x.ok);
  // P3
  const p3parts = PARAMS.Ks.map((K) => { const msg = get(K, 'all-to-all-messages'), b = best[K]; const allStig = results.filter((x) => x.K === K && x.strategy === 'stigmergy');
    const lowest = allStig.every((x) => x.time_to_solution.mean >= msg.time_to_solution.mean) && get(K, 'no-coordination').time_to_solution.mean >= msg.time_to_solution.mean;
    return { K, lowest, ratio: b.time_to_solution.mean / msg.time_to_solution.mean, msgs: msg.messages_per_episode.mean }; });
  const p3 = p3parts.every((x) => x.lowest && x.ratio <= 1.15);
  // P4
  const p4parts = PARAMS.Ks.map((K) => { const z = get(K, 'stigmergy-e0'), b = best[K];
    return { K, slower: z.time_by_episode[9] > z.time_by_episode[0], mass0_ratio: z.trail_mass_at_episode_start[9] / z.trail_mass_at_episode_start[4], massBest_ratio: b.trail_mass_at_episode_start[9] / b.trail_mass_at_episode_start[4] }; });
  const p4 = p4parts.every((x) => x.slower && x.mass0_ratio > 1.5 && x.massBest_ratio < 1.2);
  const tests = [
    { id: 'P1', verdict: p1 ? 'supported' : 'not supported', detail: PARAMS.Ks.map((K) => `K=${K}: time ${num(get(K, 'stigmergy-e0.01').time_to_solution.mean, 1)} vs ${num(get(K, 'no-coordination').time_to_solution.mean, 1)}; duplication ${pct(get(K, 'stigmergy-e0.01').duplicated_fraction.mean)} vs ${pct(get(K, 'no-coordination').duplicated_fraction.mean)}`).join('; ') },
    { id: 'P2', verdict: p2 ? 'supported' : (p2parts.some((x) => x.ok) ? 'partially supported' : 'not supported'), detail: p2parts.map((x) => `K=${x.K}: best epsilon=${x.best_eps} (t=${num(x.t_best, 1)}) vs epsilon=0 (${num(x.t0, 1)}) and epsilon=1 (${num(x.t1, 1)}); significant=${x.ok}`).join('; ') },
    { id: 'P3', verdict: p3 ? 'supported' : 'not supported', detail: p3parts.map((x) => `K=${x.K}: messages with lowest time=${x.lowest}; best stigmergy/messages=${num(x.ratio, 3)}; messages/episode=${num(x.msgs, 0)}`).join('; ') },
    { id: 'P4', verdict: p4 ? 'supported' : 'not supported', detail: p4parts.map((x) => `K=${x.K}: eps=0 ep10 slower than ep1=${x.slower}; mass ep10/ep5 eps=0: ${num(x.mass0_ratio, 2)}; best eps: ${num(x.massBest_ratio, 2)}`).join('; ') },
  ];
  const h = (K, label) => { const x = get(K, label); return `${label} (K=${K}): time ${ciNum(x.time_to_solution, 1)}, duplication ${pct(x.duplicated_fraction.mean)}, msgs/episode ${num(x.messages_per_episode.mean, 0)}`; };
  const headline = PARAMS.Ks.flatMap((K) => [h(K, 'no-coordination'), h(K, 'all-to-all-messages'), h(K, 'stigmergy-e0'), h(K, `stigmergy-e${best[K].epsilon}`)]);
  return roundDeep({ id: ID, version: VERSION, title: 'Stigmergy with evaporation vs all-to-all messages vs no coordination', seed: BASE_SEED,
    hypothesis: HYPOTHESIS, params: PARAMS, results: { configs: results, best_epsilon: Object.fromEntries(PARAMS.Ks.map((K) => [K, best[K].epsilon])) }, tests, headline }, 4);
}

mainIfDirect(import.meta.url, run);
