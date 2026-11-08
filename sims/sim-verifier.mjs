// sim-verifier — best-of-N with an imperfect verifier vs majority vote vs single agent.
// Measures accuracy (correct delivery), false-success rate (wrong delivery declared a success), abstention and cost.
// Usage: node sims/sim-verifier.mjs
import { Rng, hashSeed, seedKey, BASE_SEED, normInv, prop, RatioAcc, roundDeep, pct, ciPct, num, ciNum, mainIfDirect } from './lib.mjs';

export const ID = 'sim-verifier';
export const VERSION = '1.0.0';
const SEED_ID = seedKey(ID); // frozen seed key (see FROZEN_SEED_KEYS in lib.mjs)

export const HYPOTHESIS = {
  statement: 'An imperfect verifier with high specificity and errors uncorrelated with the generators reduces false success below the vote and the single agent; but, since every extra attempt is a new chance to accept an error, the false success of best-of-N grows with N, and a weak verifier, or one correlated with task difficulty, can be worse than the vote.',
  predictions: [
    { id: 'P1', text: 'With spec >= 0.95 and rho_v=0, bon-seq has a lower false-success rate (FS) than vote-N and than single-high (same generation budget) for every N>=3 and every rho (Wilson 95% CIs do not overlap).' },
    { id: 'P2', text: 'The FS of bon-seq is non-decreasing in N (tolerance: maximum drop < 1 p.p.) in every cell; with rho=rho_v=0 the observed FS matches the formula FS(N) = r_w/(r_c+r_w)*(1-(1-r_c-r_w)^N), r_c=p*sens, r_w=(1-p)(1-spec), within the 95% CI in >= 90% of the points.' },
    { id: 'P3', text: 'A verifier correlated with difficulty (rho_v=0.5) increases the FS of bon-seq relative to rho_v=0 (same marginal sens/spec) for rho>=0.3 and N>=3 in every sens/spec combination with spec<0.99.' },
    { id: 'P4', text: 'With a weak verifier (spec=0.5) and rho=0, bon-seq has higher FS than the vote at N=33 (weak verifier worse than the vote when errors are independent).' },
    { id: 'P5', text: 'With rho_v=0, the accuracy advantage of bon-seq over the vote at N=9 grows with rho (rho=0 < 0.3 < 0.6) for spec>=0.8.' },
  ],
};

export const PARAMS = {
  seed: BASE_SEED,
  err1: 0.4, beta: 0.5, effort_model: 'p(e) = 1 - err1 * e^(-beta); low-effort agent e=1 -> p=0.6',
  rhos: [0, 0.3, 0.6],          // latent correlation between generators
  rho_vs: [0, 0.5],             // correlation of the verifier with the task's latent factor (accepting wrong answers on hard tasks)
  sens: [0.8, 0.95],            // P(accept | correct candidate)
  spec: [0.5, 0.8, 0.95, 0.99], // P(reject | wrong candidate)
  Ns: [1, 2, 3, 5, 9, 17, 33],
  replicas: 10000,              // tasks per cell (common random numbers across N and strategies)
  verify_costs: [0.2, 1.0],     // cost of 1 verification in units of 1 low-effort generation
  strategies: {
    'single-low': '1 agent (e=1), always delivers',
    'single-high': '1 agent with effort e=N (same generation budget), always delivers',
    'vote': 'N agents, majority (binary, ties by coin flip), always delivers',
    'bon-seq': 'generates and verifies sequentially until the 1st accepted (max. N); if none, ABSTAINS (honest failure)',
    'bon-fallback': 'like bon-seq, but if none is accepted delivers the vote of the N (masked failure)',
  },
  false_success_definition: 'delivery of a wrong answer declared as a success (every delivery is declared a success); abstention is not false success',
};
const STRATS = Object.keys(PARAMS.strategies);
const NMAX = Math.max(...PARAMS.Ns);

function fsFormula(p, sens, spec, N) { const rc = p * sens, rw = (1 - p) * (1 - spec); return rw / (rc + rw) * (1 - Math.pow(1 - rc - rw, N)); }

export function run() {
  const { err1, beta, Ns, replicas: R } = PARAMS;
  const pL = 1 - err1, zL = normInv(pL);
  const zHigh = Ns.map((N) => normInv(1 - err1 * Math.pow(N, -beta)));
  const cells = [];
  for (const rho of PARAMS.rhos) for (const rv of PARAMS.rho_vs) for (const sens of PARAMS.sens) for (const spec of PARAMS.spec) {
    const rng = new Rng(hashSeed(BASE_SEED, SEED_ID, rho, rv, sens, spec));
    const sr = Math.sqrt(rho), se = Math.sqrt(1 - rho), svr = Math.sqrt(rv), sve = Math.sqrt(1 - rv), zSpec = normInv(spec);
    // counters [strategy][iN]
    const C = STRATS.map(() => Ns.map(() => ({ ok: 0, wrong: 0, abst: 0, gens: 0, vers: 0, ratio: PARAMS.verify_costs.map(() => new RatioAcc()) })));
    const corr = new Uint8Array(NMAX), acc = new Uint8Array(NMAX);
    const voteAt = new Int8Array(NMAX + 1);
    for (let t = 0; t < R; t++) {
      const S = rng.normal();
      let c = 0;
      for (let i = 0; i < NMAX; i++) {
        const ok = sr * S + se * rng.normal() < zL; corr[i] = ok ? 1 : 0; if (ok) c++;
        acc[i] = ok ? (rng.uniform() < sens ? 1 : 0) : (svr * S + sve * rng.normal() > zSpec ? 1 : 0);
        const n = i + 1; voteAt[n] = 2 * c > n ? 1 : (2 * c === n ? (rng.uniform() < 0.5 ? 1 : 0) : 0);
      }
      let fa = -1; for (let i = 0; i < NMAX; i++) if (acc[i]) { fa = i; break; }
      const zh = sr * S + se * rng.normal();
      for (let j = 0; j < Ns.length; j++) {
        const N = Ns[j];
        // outcome: 1 correct, 0 wrong delivered, -1 abstention ; gens/vers
        const res = [
          [corr[0], 1, 0],
          [zh < zHigh[j] ? 1 : 0, N, 0],
          [voteAt[N], N, 0],
          fa >= 0 && fa < N ? [corr[fa], fa + 1, fa + 1] : [-1, N, N],
          fa >= 0 && fa < N ? [corr[fa], fa + 1, fa + 1] : [voteAt[N], N, N],
        ];
        for (let s = 0; s < STRATS.length; s++) {
          const [o, g, v] = res[s]; const cc = C[s][j];
          if (o === 1) cc.ok++; else if (o === 0) cc.wrong++; else cc.abst++;
          cc.gens += g; cc.vers += v;
          for (let q = 0; q < PARAMS.verify_costs.length; q++) cc.ratio[q].add(g + PARAMS.verify_costs[q] * v, o === 1 ? 1 : 0);
        }
      }
    }
    const strat = {};
    for (let s = 0; s < STRATS.length; s++) {
      strat[STRATS[s]] = {
        acc: Ns.map((_, j) => prop(C[s][j].ok, R)),
        false_success: Ns.map((_, j) => prop(C[s][j].wrong, R)),
        abstain: Ns.map((_, j) => C[s][j].abst / R),
        precision_delivered: Ns.map((_, j) => (C[s][j].ok + C[s][j].wrong ? C[s][j].ok / (C[s][j].ok + C[s][j].wrong) : null)),
        mean_generations: Ns.map((_, j) => C[s][j].gens / R),
        mean_verifications: Ns.map((_, j) => C[s][j].vers / R),
        cost_per_correct: PARAMS.verify_costs.map((cv, q) => ({ verify_cost: cv, values: Ns.map((_, j) => C[s][j].ratio[q].ci()) })),
      };
    }
    cells.push({ rho, rho_v: rv, sens, spec, strategies: strat,
      fs_formula_independent: rho === 0 && rv === 0 ? Ns.map((N) => fsFormula(pL, sens, spec, N)) : null });
  }

  // ---- tests ----
  const iN = (N) => Ns.indexOf(N);
  const get = (rho, rv, sens, spec) => cells.find((c) => c.rho === rho && c.rho_v === rv && c.sens === sens && c.spec === spec);
  // P1
  const p1f = [];
  for (const c of cells) if (c.spec >= 0.95 && c.rho_v === 0) for (const N of Ns) if (N >= 3) {
    const j = iN(N), b = c.strategies['bon-seq'].false_success[j];
    for (const other of ['vote', 'single-high']) { const o = c.strategies[other].false_success[j]; if (!(b.hi < o.lo)) p1f.push(`rho=${c.rho},sens=${c.sens},spec=${c.spec},N=${N} vs ${other}`); }
  }
  // P2
  let mono = true, monoFail = [], cov = 0, covN = 0;
  for (const c of cells) {
    const fs = c.strategies['bon-seq'].false_success.map((x) => x.p);
    for (let j = 1; j < fs.length; j++) if (fs[j] < fs[j - 1] - 0.01) { mono = false; monoFail.push(`rho=${c.rho},rv=${c.rho_v},sens=${c.sens},spec=${c.spec},N=${Ns[j]}`); }
    if (c.fs_formula_independent) c.fs_formula_independent.forEach((f, j) => { covN++; const o = c.strategies['bon-seq'].false_success[j]; if (f >= o.lo && f <= o.hi) cov++; });
  }
  const p2ok = mono && cov / covN >= 0.9;
  // P3
  const p3f = []; let p3n = 0;
  for (const rho of [0.3, 0.6]) for (const sens of PARAMS.sens) for (const spec of PARAMS.spec) if (spec < 0.99) for (const N of Ns) if (N >= 3) {
    p3n++; const a = get(rho, 0, sens, spec).strategies['bon-seq'].false_success[iN(N)], b = get(rho, 0.5, sens, spec).strategies['bon-seq'].false_success[iN(N)];
    if (!(b.lo > a.hi)) p3f.push(`rho=${rho},sens=${sens},spec=${spec},N=${N}`);
  }
  // P4
  const p4c = PARAMS.sens.map((sens) => { const c = get(0, 0, sens, 0.5); const j = iN(33); return { sens, bon: c.strategies['bon-seq'].false_success[j], vote: c.strategies['vote'].false_success[j] }; });
  const p4ok = p4c.every((x) => x.bon.lo > x.vote.hi);
  // P5
  const p5rows = []; let p5ok = true;
  for (const sens of PARAMS.sens) for (const spec of PARAMS.spec) if (spec >= 0.8) {
    const adv = PARAMS.rhos.map((rho) => { const c = get(rho, 0, sens, spec); const j = iN(9); return c.strategies['bon-seq'].acc[j].p - c.strategies['vote'].acc[j].p; });
    if (!(adv[0] < adv[1] && adv[1] < adv[2])) p5ok = false;
    p5rows.push({ sens, spec, adv_by_rho: adv });
  }
  const tests = [
    { id: 'P1', verdict: p1f.length === 0 ? 'supported' : 'not supported', detail: p1f.length === 0 ? 'all comparisons with disjoint CIs' : `${p1f.length} failures, e.g.: ${p1f.slice(0, 6).join('; ')}` },
    { id: 'P2', verdict: p2ok ? 'supported' : 'not supported', detail: `monotone=${mono}${monoFail.length ? ' (failures: ' + monoFail.slice(0, 5).join('; ') + ')' : ''}; formula inside the CI at ${cov}/${covN} points` },
    { id: 'P3', verdict: p3f.length === 0 ? 'supported' : (p3f.length < p3n / 2 ? 'partially supported' : 'not supported'), detail: `${p3n - p3f.length}/${p3n} comparisons with a significant increase; exceptions: ${p3f.slice(0, 8).join('; ')}` },
    { id: 'P4', verdict: p4ok ? 'supported' : 'not supported', detail: p4c.map((x) => `sens=${x.sens}: FS bon-seq ${pct(x.bon.p)} vs vote ${pct(x.vote.p)}`).join('; ') },
    { id: 'P5', verdict: p5ok ? 'supported' : 'not supported', detail: p5rows.map((x) => `sens=${x.sens},spec=${x.spec}: ${x.adv_by_rho.map((a) => num(a * 100, 1)).join(' / ')} p.p.`).join('; ') },
  ];

  const c1 = get(0.3, 0, 0.95, 0.95), c2 = get(0.3, 0.5, 0.95, 0.95), j9 = iN(9), j33 = iN(33);
  const headline = [
    `rho=0.3, sens=spec=0.95, N=9: FS bon-seq ${ciPct(c1.strategies['bon-seq'].false_success[j9])} vs vote ${ciPct(c1.strategies['vote'].false_success[j9])} vs single-high ${ciPct(c1.strategies['single-high'].false_success[j9])}`,
    `Same cell: bon-seq accuracy ${ciPct(c1.strategies['bon-seq'].acc[j9])}, abstention ${pct(c1.strategies['bon-seq'].abstain[j9])}; bon-fallback FS ${ciPct(c1.strategies['bon-fallback'].false_success[j9])}`,
    `Correlated verifier (rho_v=0.5) in the same cell: bon-seq FS rises to ${ciPct(c2.strategies['bon-seq'].false_success[j9])}`,
    `Weak verifier (spec=0.5, sens=0.95, rho=0, N=33): FS bon-seq ${ciPct(p4c[1].bon)} vs vote ${ciPct(p4c[1].vote)}`,
    `Cost per correct (c_v=0.2) rho=0.3 N=9: bon-seq ${ciNum(c1.strategies['bon-seq'].cost_per_correct[0].values[j9])} vs vote ${ciNum(c1.strategies['vote'].cost_per_correct[0].values[j9])}`,
  ];
  return roundDeep({ id: ID, version: VERSION, title: 'Best-of-N with an imperfect verifier vs vote vs single agent', seed: BASE_SEED,
    hypothesis: HYPOTHESIS, params: PARAMS, results: { Ns, cells }, tests, headline }, 5);
}

mainIfDirect(import.meta.url, run);
