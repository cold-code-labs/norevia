// sim-correlated-vote — 1 high-effort agent vs majority vote of N low-effort agents
// with errors correlated through a shared latent factor (Gaussian copula).
// Usage: node sims/sim-correlated-vote.mjs   (deterministic; writes results/sims/sim-correlated-vote.json)
import { Rng, hashSeed, seedKey, BASE_SEED, normInv, normCdf, latentGrid, condP, prop, wilson, Z95, roundDeep, pct, ciPct, num, mainIfDirect } from './lib.mjs';

export const ID = 'sim-correlated-vote';
export const VERSION = '1.2.0';
const SEED_ID = seedKey(ID); // frozen seed key (see FROZEN_SEED_KEYS in lib.mjs)

// Hypothesis registered BEFORE the first run (see results/sims/PREREGISTRATION.jsonl).
export const HYPOTHESIS = {
  statement: 'Correlated errors impose a ceiling on majority-vote accuracy; above a critical correlation, 1 high-effort agent beats any N of low-effort agents in accuracy, and the cost of reaching an accuracy target favours the single agent when returns to effort are not strongly diminishing.',
  predictions: [
    { id: 'P1', text: 'With p_L=0.6 and p_H=0.8 (k=4, beta=0.5), the theoretical vote ceiling is Phi(z_L/sqrt(rho)); the predicted critical correlation is rho_c=(z_L/z_H)^2 ~= 0.091. For every rho >= 0.1, the single agent has higher accuracy than the vote for EVERY N in 1..64 (paired 95% CI excludes 0).' },
    { id: 'P2', text: 'With rho=0 there is an N <= 25 at which the vote beats p_H=0.8 with a paired 95% CI excluding 0.' },
    { id: 'P3', text: 'At equal budget (N=k low-effort agents vs 1 agent with effort k), the region where the vote wins shrinks as rho grows and as beta (return to effort) grows; with beta=1 the single agent wins for every k>=3 and every rho.' },
    { id: 'P4', text: 'Minimum cost to reach accuracy targets 0.7/0.8/0.9: with beta>=0.5 the single agent is cheaper for every rho; with beta=0.25 the vote is cheaper only for high targets (>=0.9) and low rho (<=0.1).' },
  ],
};

export const PARAMS = {
  seed: BASE_SEED,
  err1: 0.4,                 // error at effort 1 (p_L = 0.6)
  effort_model: 'p(e) = 1 - err1 * e^(-beta)',
  betas: [0.25, 0.5, 1.0],
  rhos: [0, 0.025, 0.05, 0.075, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8], // v1.1: 0.025–0.075 added after the 1st run (exploratory, to refine the boundary)
  Nmax: 64,
  replicas_per_rho: 20000,   // simulated tasks per rho value (common random numbers across N, k, beta)
  ref: { k: 4, beta: 0.5 },  // reference high-effort agent: cost 4, p_H = 0.8
  targets: [0.7, 0.8, 0.9],
  answer_space: 'binary (worst case for voting: all errors coincide); ties broken by a coin flip',
  cost_model: 'cost = sum of efforts (low-effort agent = 1; high-effort agent = k); no aggregation cost',
};

// ---- v1.2.0: SENSITIVITY ANALYSIS (requested by coordination; does not change P1–P4) ----
// Sweeps individual accuracy p and the answer space. For K=4, when wrong, an agent picks the task's attractor answer
// with prob. a (otherwise uniform over the 3 wrong answers). a=0.63 gives ~0.6 agreement between two agents that are both wrong,
// calibrated from lit-correlated-errors (author-reported, ~0.6 vs 1/3 by chance). Compared with the ~45% threshold
// reported by Kim et al. (arXiv:2512.08296v3, lit-scaling-agent-systems) — a different setting (agentic benchmarks, MAS architectures).
export const SENSITIVITY = {
  expectation: 'Expectation stated before running (not a formal prediction): in the binary vote the gain of the vote over 1 agent with the same p vanishes at p=0.5 by construction; with K=4 and attracted errors the threshold falls below 0.5; at equal budget (vs 1 agent with effort N) the gain vanishes at much lower p, or never exists with high rho.',
  ps: [0.2, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.7, 0.8, 0.9],
  rhos: [0, 0.2, 0.4, 0.55, 0.7],
  answer_spaces: [{ K: 2, attractor: 1 }, { K: 4, attractor: 0.63 }],
  Ns: [3, 5, 9], replicas: 20000, beta_equal_budget: 0.5,
  reference_threshold_kim_2025: 0.45,
};
function runSensitivity() {
  const S = SENSITIVITY; const out = [];
  for (const as of S.answer_spaces) for (const rho of S.rhos) {
    const rows = { K: as.K, attractor: as.attractor, rho, Ns: S.Ns, ps: S.ps, gain_same_p: S.Ns.map(() => []), gain_same_p_lo: S.Ns.map(() => []), gain_same_p_hi: S.Ns.map(() => []), gain_equal_budget: S.Ns.map(() => []), gain_equal_budget_lo: S.Ns.map(() => []), gain_equal_budget_hi: S.Ns.map(() => []) };
    for (const p of S.ps) {
      const rng = new Rng(hashSeed(BASE_SEED, SEED_ID, 'sens', as.K, rho, p));
      const zp = normInv(p), sr = Math.sqrt(rho), se = Math.sqrt(1 - rho);
      const zH = S.Ns.map((N) => normInv(1 - (1 - p) * Math.pow(N, -S.beta_equal_budget)));
      const acc = S.Ns.map(() => ({ s1: 0, q1: 0, s2: 0, q2: 0 }));
      const NM = Math.max(...S.Ns); const ans = new Int8Array(NM); const votes = new Int32Array(as.K);
      for (let r = 0; r < S.replicas; r++) {
        const Sx = rng.normal();
        for (let i = 0; i < NM; i++) {
          if (sr * Sx + se * rng.normal() < zp) ans[i] = 0;
          else ans[i] = as.K === 2 ? 1 : (rng.uniform() < as.attractor ? 1 : 1 + rng.int(as.K - 1));
        }
        const single = ans[0] === 0 ? 1 : 0;
        const zh = sr * Sx + se * rng.normal();
        S.Ns.forEach((N, j) => {
          votes.fill(0); for (let i = 0; i < N; i++) votes[ans[i]]++;
          let best = -1, nt = 0, win = 0; for (let k = 0; k < as.K; k++) { if (votes[k] > best) { best = votes[k]; win = k; nt = 1; } else if (votes[k] === best) { nt++; if (rng.uniform() < 1 / nt) win = k; } }
          const v = win === 0 ? 1 : 0; const d1 = v - single, d2 = v - (zh < zH[j] ? 1 : 0);
          acc[j].s1 += d1; acc[j].q1 += d1 * d1; acc[j].s2 += d2; acc[j].q2 += d2 * d2;
        });
      }
      S.Ns.forEach((N, j) => {
        const w1 = winner(acc[j].s1, acc[j].q1, S.replicas), w2 = winner(acc[j].s2, acc[j].q2, S.replicas);
        rows.gain_same_p[j].push(w1.diff); rows.gain_same_p_lo[j].push(w1.lo); rows.gain_same_p_hi[j].push(w1.hi);
        rows.gain_equal_budget[j].push(w2.diff); rows.gain_equal_budget_lo[j].push(w2.lo); rows.gain_equal_budget_hi[j].push(w2.hi);
      });
    }
    // threshold: smallest p on the grid from which the gain is significantly > 0 for every larger p (null = never)
    const thr = (lo) => { let th = null; for (let i = S.ps.length - 1; i >= 0; i--) { if (lo[i] > 0) th = S.ps[i]; else break; } return th; };
    rows.min_p_vote_beats_same_p = S.Ns.map((_, j) => thr(rows.gain_same_p_lo[j]));
    rows.p_range_vote_beats_equal_budget = S.Ns.map((_, j) => S.ps.filter((_, i) => rows.gain_equal_budget_lo[j][i] > 0));
    out.push(rows);
  }
  return out;
}

const pOf = (e, beta) => 1 - PARAMS.err1 * Math.pow(e, -beta);

// ---- analytical: vote accuracy integrating over the latent factor ----
const LOGF = (() => { const a = new Float64Array(200); for (let i = 1; i < 200; i++) a[i] = a[i - 1] + Math.log(i); return a; })();
function voteGivenQ(N, q) {
  if (q <= 0) return 0; if (q >= 1) return 1;
  const lq = Math.log(q), l1 = Math.log(1 - q); let acc = 0;
  for (let c = 0; c <= N; c++) {
    const pm = Math.exp(LOGF[N] - LOGF[c] - LOGF[N - c] + c * lq + (N - c) * l1);
    if (2 * c > N) acc += pm; else if (2 * c === N) acc += 0.5 * pm;
  }
  return acc;
}
const GRID = latentGrid(801, 8);
export function analyticVote(N, p, rho) {
  if (rho === 0) return voteGivenQ(N, p);
  let s = 0; for (let i = 0; i < GRID.s.length; i++) s += GRID.w[i] * voteGivenQ(N, condP(p, rho, GRID.s[i]));
  return s;
}

function winner(sum, sumsq, n) { // paired difference (vote - single)
  const m = sum / n, v = (sumsq / n - m * m) * n / (n - 1), hw = Z95 * Math.sqrt(v / n);
  return { diff: m, lo: m - hw, hi: m + hw, winner: m - hw > 0 ? 'vote' : (m + hw < 0 ? 'single' : 'tie') };
}

export function run() {
  const { rhos, Nmax, betas, replicas_per_rho: R, err1 } = PARAMS;
  const pL = 1 - err1, zL = normInv(pL);
  const pRef = pOf(PARAMS.ref.k, PARAMS.ref.beta), zRef = normInv(pRef);
  const ks = Array.from({ length: Nmax }, (_, i) => i + 1);
  const zHigh = betas.map((b) => ks.map((k) => normInv(pOf(k, b))));
  const out = { curves: {}, phase: {}, validation: {} };
  const accVote = [], accVoteLo = [], accVoteHi = [], accAnalytic = [], cpcVote = [], cpcVoteLo = [], cpcVoteHi = [];
  const singleRef = [], phaseAcc = [], phaseAccDiff = [], errCorr = [];
  const phaseEq = betas.map(() => []), phaseEqDiff = betas.map(() => []);
  let covered = 0, cells = 0, maxAbs = 0;

  for (const rho of rhos) {
    const rng = new Rng(hashSeed(BASE_SEED, SEED_ID, 'rho', rho));
    const sr = Math.sqrt(rho), se = Math.sqrt(1 - rho);
    const corr = new Float64Array(Nmax + 1);
    const dRefS = new Float64Array(Nmax + 1), dRefQ = new Float64Array(Nmax + 1);
    const dEqS = betas.map(() => new Float64Array(Nmax + 1)), dEqQ = betas.map(() => new Float64Array(Nmax + 1));
    let refCorrect = 0, w1 = 0, w2 = 0, w12 = 0;
    const voteOK = new Uint8Array(Nmax + 1);
    for (let t = 0; t < R; t++) {
      const S = rng.normal();
      let c = 0;
      for (let i = 1; i <= Nmax; i++) {
        const ok = sr * S + se * rng.normal() < zL;
        if (ok) c++;
        if (i === 1) { if (!ok) w1++; } else if (i === 2) { if (!ok) { w2++; if (voteOK[1] === 0) w12++; } }
        let v;
        if (2 * c > i) v = 1; else if (2 * c === i) v = rng.uniform() < 0.5 ? 1 : 0; else v = 0;
        voteOK[i] = v; corr[i] += v;
      }
      const zh = sr * S + se * rng.normal(); // latent of the high-effort agent (same task)
      const refOK = zh < zRef ? 1 : 0; refCorrect += refOK;
      for (let N = 1; N <= Nmax; N++) { const d = voteOK[N] - refOK; dRefS[N] += d; dRefQ[N] += d * d; }
      for (let b = 0; b < betas.length; b++) for (let k = 1; k <= Nmax; k++) {
        const d = voteOK[k] - (zh < zHigh[b][k - 1] ? 1 : 0); dEqS[b][k] += d; dEqQ[b][k] += d * d;
      }
    }
    const a = [], alo = [], ahi = [], an = [], cp = [], cplo = [], cphi = [], ph = [], phd = [];
    for (let N = 1; N <= Nmax; N++) {
      const pr = prop(corr[N], R); const th = analyticVote(N, pL, rho);
      a.push(pr.p); alo.push(pr.lo); ahi.push(pr.hi); an.push(th);
      cp.push(N / pr.p); cplo.push(N / pr.hi); cphi.push(N / pr.lo);
      cells++; if (th >= pr.lo && th <= pr.hi) covered++; maxAbs = Math.max(maxAbs, Math.abs(th - pr.p));
      const w = winner(dRefS[N], dRefQ[N], R); ph.push(w.winner); phd.push(w.diff);
    }
    accVote.push(a); accVoteLo.push(alo); accVoteHi.push(ahi); accAnalytic.push(an);
    cpcVote.push(cp); cpcVoteLo.push(cplo); cpcVoteHi.push(cphi); phaseAcc.push(ph); phaseAccDiff.push(phd);
    const sp = prop(refCorrect, R);
    singleRef.push({ rho, acc: sp.p, lo: sp.lo, hi: sp.hi, cost_per_correct: PARAMS.ref.k / sp.p, cpc_lo: PARAMS.ref.k / sp.hi, cpc_hi: PARAMS.ref.k / sp.lo });
    // phi correlation between the errors of two low-effort agents (maps latent rho -> observable error correlation)
    const pw1 = w1 / R, pw2 = w2 / R, pw12 = w12 / R;
    errCorr.push((pw12 - pw1 * pw2) / Math.sqrt(pw1 * (1 - pw1) * pw2 * (1 - pw2)));
    for (let b = 0; b < betas.length; b++) {
      const row = [], rowd = [];
      for (let k = 1; k <= Nmax; k++) { const w = winner(dEqS[b][k], dEqQ[b][k], R); row.push(w.winner); rowd.push(w.diff); }
      phaseEq[b].push(row); phaseEqDiff[b].push(rowd);
    }
  }

  // ---- minimum cost to reach targets (analytical, continuous effort for the single agent) ----
  const targetCost = [];
  for (const A of PARAMS.targets) for (const beta of betas) {
    const eStar = Math.pow(err1 / (1 - A), 1 / beta);
    const row = { target: A, beta, single_cost: eStar, vote_min_N: [], cheaper: [] };
    for (const rho of rhos) {
      let nStar = null; for (let N = 1; N <= Nmax; N++) if (analyticVote(N, pL, rho) >= A) { nStar = N; break; }
      row.vote_min_N.push(nStar);
      row.cheaper.push(nStar === null ? 'single' : (nStar < eStar ? 'vote' : (nStar > eStar ? 'single' : 'tie')));
    }
    targetCost.push(row);
  }

  const zH = normInv(pRef);
  const rhoC = (zL / zH) ** 2;
  const ceiling = PARAMS.rhos.map((rho) => (rho === 0 ? 1 : normCdf(zL / Math.sqrt(rho))));

  out.curves = { N: ks, rhos: PARAMS.rhos, acc_vote: accVote, acc_vote_lo: accVoteLo, acc_vote_hi: accVoteHi, acc_vote_analytic: accAnalytic,
    cost_per_correct_vote: cpcVote, cost_per_correct_vote_lo: cpcVoteLo, cost_per_correct_vote_hi: cpcVoteHi,
    single_ref: singleRef, vote_ceiling_analytic: ceiling, error_phi_correlation: errCorr };
  out.phase = { accuracy_vs_ref: { rows: 'rho', cols: 'N', winner: phaseAcc, diff_vote_minus_single: phaseAccDiff },
    equal_budget: betas.map((b, i) => ({ beta: b, rows: 'rho', cols: 'k=N', p_single: ks.map((k) => pOf(k, b)), winner: phaseEq[i], diff_vote_minus_single: phaseEqDiff[i] })),
    target_cost: targetCost };
  out.validation = { analytic_inside_mc_ci_fraction: covered / cells, cells, max_abs_diff_mc_vs_analytic: maxAbs, rho_critical_analytic: rhoC };

  // ---- evaluation of the predictions ----
  const iR = (rho) => PARAMS.rhos.indexOf(rho);
  const p1ok = PARAMS.rhos.filter((x) => x >= 0.1).every((rho) => phaseAcc[iR(rho)].every((w) => w === 'single'));
  const p1fail = PARAMS.rhos.filter((x) => x >= 0.1).flatMap((rho) => phaseAcc[iR(rho)].map((w, j) => (w !== 'single' ? `rho=${rho},N=${j + 1}:${w}` : null)).filter(Boolean));
  const firstWin0 = phaseAcc[0].findIndex((w) => w === 'vote') + 1;
  const p2ok = firstWin0 > 0 && firstWin0 <= 25;
  // P3: number of cells where the vote wins, by beta and by rho
  const eqVoteCells = betas.map((b, i) => PARAMS.rhos.map((rho, j) => phaseEq[i][j].filter((w) => w === 'vote').length));
  const monoRho = eqVoteCells.every((arr) => arr.every((v, j) => j === 0 || v <= arr[j - 1]));
  const monoBeta = PARAMS.rhos.every((_, j) => eqVoteCells.every((arr, i) => i === 0 || arr[j] <= eqVoteCells[i - 1][j]));
  const b1 = betas.indexOf(1.0);
  const beta1All = phaseEq[b1].every((row) => row.slice(2).every((w) => w === 'single'));
  const p3ok = monoRho && monoBeta && beta1All;
  // P4
  const p4rows = targetCost.filter((t) => t.beta >= 0.5);
  const p4a = p4rows.every((t) => t.cheaper.every((c) => c === 'single'));
  const b025 = targetCost.filter((t) => t.beta === 0.25);
  const p4b = b025.every((t) => t.cheaper.every((c, j) => c !== 'vote' || (t.target >= 0.9 && PARAMS.rhos[j] <= 0.1)));
  const p4ok = p4a && p4b;

  const tests = [
    { id: 'P1', verdict: p1ok ? 'supported' : 'not supported', detail: p1ok ? `analytical rho_c = ${num(rhoC, 3)}; for every rho>=0.1 and N=1..64 the single agent wins with paired 95% CI` : `exceptions: ${p1fail.slice(0, 12).join('; ')}${p1fail.length > 12 ? ' …' : ''}` },
    { id: 'P2', verdict: p2ok ? 'supported' : 'not supported', detail: `with rho=0 the vote beats p_H=0.8 (paired CI) from N=${firstWin0 || 'never'}` },
    { id: 'P3', verdict: p3ok ? 'supported' : 'not supported', detail: `number of k (1..64) where the vote wins, by beta (rows) and rho (columns): ${JSON.stringify(eqVoteCells)}; monotone in rho=${monoRho}, in beta=${monoBeta}; beta=1 single agent wins k>=3 for every rho=${beta1All}` },
    { id: 'P4', verdict: p4ok ? 'supported' : 'not supported', detail: `beta>=0.5 single agent always cheaper=${p4a}; beta=0.25 vote cheaper only at target>=0.9 and rho<=0.1=${p4b}` },
  ];

  const j0 = 0, j3 = iR(0.3), j6 = iR(0.6);
  const n64 = (j) => ({ p: accVote[j][63], lo: accVoteLo[j][63], hi: accVoteHi[j][63] });
  const headline = [
    `Theoretical vote ceiling (N→∞) with p_L=0.6: ${pct(ceiling[j3])} at rho=0.3 and ${pct(ceiling[j6])} at rho=0.6; critical rho vs p_H=0.8: ${num(rhoC, 3)}`,
    `Vote N=64: ${ciPct(n64(j0))} (rho=0); ${ciPct(n64(j3))} (rho=0.3); ${ciPct(n64(j6))} (rho=0.6)`,
    `Single agent (k=4, p=0.8) at rho=0.3: ${ciPct({ p: singleRef[j3].acc, lo: singleRef[j3].lo, hi: singleRef[j3].hi })}`,
    `With rho=0 the vote beats the single agent (k=4) from N=${firstWin0}`,
    `MC vs analytical validation: ${pct(covered / cells)} of the ${cells} cells with the analytical value inside the 95% CI; max. error ${num(maxAbs * 100, 2)} p.p.`,
  ];

  out.sensitivity = { design: SENSITIVITY, cells: runSensitivity() };
  const sc = (K, rho) => out.sensitivity.cells.find((c) => c.K === K && c.rho === rho);
  const fmtP = (x) => (x === null ? 'never' : num(x, 2));
  headline.push(`Sensitivity (K=4, error agreement ~0.6): vote N=5 beats 1 agent with the same p from p=${fmtP(sc(4, 0).min_p_vote_beats_same_p[1])} (rho=0), ${fmtP(sc(4, 0.4).min_p_vote_beats_same_p[1])} (rho=0.4), ${fmtP(sc(4, 0.7).min_p_vote_beats_same_p[1])} (rho=0.7)`);
  headline.push(`Sensitivity at equal budget (N=5 vs 1 agent with effort 5, beta=0.5): p ranges where the vote wins — K=2 rho=0: [${sc(2, 0).p_range_vote_beats_equal_budget[1].map((x) => num(x, 2)).join(' ')}]; K=4 rho=0: [${sc(4, 0).p_range_vote_beats_equal_budget[1].map((x) => num(x, 2)).join(' ')}]; K=4 rho=0.4: [${sc(4, 0.4).p_range_vote_beats_equal_budget[1].map((x) => num(x, 2)).join(' ')}]`);
  return roundDeep({ id: ID, version: VERSION, title: 'Correlated vote: 1 high-effort agent vs N low-effort agents', seed: BASE_SEED,
    hypothesis: HYPOTHESIS, params: PARAMS, results: out, tests, headline }, 5);
}

mainIfDirect(import.meta.url, run);
