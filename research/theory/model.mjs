#!/usr/bin/env node
// Norevia — a Cold Code Labs research project — theoretical model of the "collective efficiency law" (th-model).
// Node 22, no dependencies. Usage:
//   node model.mjs all            # generates all curves in ./curves/*.json and prints a summary
//   node model.mjs <name>         # generates one curve (see CURVES below)
//   node model.mjs list           # lists curves
// All formulas are documented in MODEL.md (sections §1–§9).
// Evidence: hypothesis (mathematical model). Numerical check: model.test.mjs.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// §0 Numerical utilities
// ---------------------------------------------------------------------------
const LANCZOS = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];

export function lgamma(x) {
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
  x -= 1;
  let a = LANCZOS[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += LANCZOS[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
export const lbeta = (a, b) => lgamma(a) + lgamma(b) - lgamma(a + b);
export const lchoose = (n, k) => lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);
export const choose = (n, k) => Math.round(Math.exp(lchoose(n, k)));

function betacf(a, b, x) {
  const MAXIT = 500, EPS = 1e-15, FPMIN = 1e-300;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - qab * x / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c; h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}
/** Regularized incomplete beta function I_x(a,b). */
export function ibeta(a, b, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(-lbeta(a, b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
}

// Deterministic PRNG (mulberry32) + samplers, for Monte Carlo checks.
export function rng(seed = 12345) {
  let s = seed >>> 0;
  const u = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const normal = () => {
    let a = 0; while (a === 0) a = u();
    return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * u());
  };
  const gamma = (k) => {
    if (k < 1) return gamma(k + 1) * Math.pow(u() || 1e-300, 1 / k);
    const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) {
      let x, v;
      do { x = normal(); v = 1 + c * x; } while (v <= 0);
      v = v * v * v;
      const uu = u();
      if (uu < 1 - 0.0331 * x ** 4) return d * v;
      if (Math.log(uu) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  };
  const beta = (a, b) => { const x = gamma(a), y = gamma(b); return x / (x + y); };
  return { u, normal, gamma, beta };
}

// ---------------------------------------------------------------------------
// §1 Capability, cost, latency
// ---------------------------------------------------------------------------
/** Individual capability p(e): Hill curve in the effort e (normalized reasoning tokens).
 *  h = half-saturation (grows with difficulty d), beta = slope (initial convexity). */
export function capability(e, { pLo = 0, pHi = 0.95, h = 2, beta = 1 } = {}) {
  if (e <= 0) return pLo;
  const x = Math.pow(e / h, beta);
  return pLo + (pHi - pLo) * x / (1 + x);
}
/** Cost per call: fixed overhead c0 (prompt/context/tools) + c1 per unit of effort. */
export const callCost = (e, { c0 = 0.2, c1 = 1 } = {}) => c0 + c1 * e;
/** Communication edges per round for common topologies. */
export function edges(N, topology = 'full') {
  switch (topology) {
    case 'none': return 0;
    case 'star': return Math.max(0, N - 1);          // orchestrator ↔ workers
    case 'ring': return N > 2 ? N : Math.max(0, N - 1);
    case 'board': return N;                          // stigmergy: each agent reads/writes the board
    case 'full': default: return N * (N - 1) / 2;    // all-to-all (Brooks/coherence)
  }
}
/** Communication cost: kappaMsg per edge per round × R rounds. */
export const commCost = (N, { kappaMsg = 0.05, rounds = 1, topology = 'full' } = {}) => kappaMsg * rounds * edges(N, topology);
/** Latency: t0 per call + e/throughput; parallel = 1 round; sequential = expected calls. */
export const callLatency = (e, { t0 = 1, rate = 1 } = {}) => t0 + e / rate;

// ---------------------------------------------------------------------------
// §2 Majority vote with correlation
// ---------------------------------------------------------------------------
/** Beta parameters for mean p and intra-class correlation rho (beta-binomial). */
export function betaParams(p, rho) {
  if (rho <= 0) return null;
  const k = (1 - rho) / rho;
  return { a: p * k, b: (1 - p) * k };
}
/** Mixed moment M(i,j) = E[P^i (1-P)^j] for P ~ Beta(a,b) (or fixed P = p if rho = 0). */
export function mixedMoment(i, j, p, rho) {
  return Math.exp(logMixedMoment(i, j, p, rho));
}
/** ln M(i,j) (avoids Infinity·0 when combined with large binomial coefficients). */
export function logMixedMoment(i, j, p, rho) {
  const bp = betaParams(p, rho);
  if (!bp) return (i === 0 ? 0 : i * Math.log(p)) + (j === 0 ? 0 : j * Math.log(1 - p));
  return lbeta(bp.a + i, bp.b + j) - lbeta(bp.a, bp.b);
}
/** P(X = k), X = no. of correct votes among N; beta-binomial (rho>0) or binomial (rho=0). */
export function votePmf(N, k, p, rho = 0) {
  return Math.exp(lchoose(N, k) + logMixedMoment(k, N - k, p, rho));
}
/** Majority-vote accuracy (binary; ties broken by a coin flip). */
export function majorityAccuracy(N, p, rho = 0) {
  let acc = 0;
  for (let k = 0; k <= N; k++) {
    const w = votePmf(N, k, p, rho);
    if (2 * k > N) acc += w; else if (2 * k === N) acc += 0.5 * w;
  }
  return Math.min(1, Math.max(0, acc));
}
/** Asymptotic ceiling (N→∞) in the beta-binomial model: P(P > 1/2) = 1 - I_{1/2}(a,b). */
export function voteCeiling(p, rho) {
  const bp = betaParams(p, rho);
  if (!bp) return p > 0.5 ? 1 : p < 0.5 ? 0 : 0.5;
  return 1 - ibeta(bp.a, bp.b, 0.5);
}
/** Alternative "common shock" model: with prob. rho everyone copies a single draw. */
export const majorityCommonShock = (N, p, rho) => rho * p + (1 - rho) * majorityAccuracy(N, p, 0);
export const commonShockCeiling = (p, rho) => rho * p + (1 - rho) * (p > 0.5 ? 1 : p < 0.5 ? 0 : 0.5);
/** Exact marginal gain from N=2m+1 → 2m+3 (conditional on P it is the classical identity;
 *  under beta, take the expectation):  ΔA_m = C(2m+1,m) E[(2P-1) (P(1-P))^{m+1}]. */
export function voteMarginalGain(m, p, rho = 0) {
  const lc = lchoose(2 * m + 1, m);
  return 2 * Math.exp(lc + logMixedMoment(m + 2, m + 1, p, rho)) - Math.exp(lc + logMixedMoment(m + 1, m + 1, p, rho));
}
/** Mixture of difficulty classes: [{w, p, rho}] (Chen et al. 2024: non-monotonic curve). */
export const majorityMixture = (N, classes) => classes.reduce((s, c) => s + c.w * majorityAccuracy(N, c.p, c.rho ?? 0), 0);

/** Odd N* that maximizes U(N) = V·A_N − N·c − comm(N), and N that maximizes A_N/cost. */
export function optimalVoteN(p, rho, { V = 10, c = 1, comm = {}, Nmax = 101 } = {}) {
  let best = { N: 1, U: -Infinity }, bestRatio = { N: 1, ratio: -Infinity };
  const rows = [];
  for (let N = 1; N <= Nmax; N += 2) {
    const A = majorityAccuracy(N, p, rho);
    const cost = N * c + (N > 1 ? commCost(N, comm) : 0);
    const U = V * A - cost;
    const ratio = A / cost;
    rows.push({ N, A, cost, U, ratio });
    if (U > best.U + 1e-12) best = { N, U, A, cost };
    if (ratio > bestRatio.ratio + 1e-12) bestRatio = { N, ratio, A, cost };
  }
  // Marginal rule (myopic stopping): expand from N to N+2 while V·ΔA > 2c + Δcomm.
  let Nmarg = 1;
  for (let m = 0; 2 * m + 3 <= Nmax; m++) {
    const N = 2 * m + 1;
    const dComm = commCost(N + 2, comm) - (N > 1 ? commCost(N, comm) : 0);
    if (V * voteMarginalGain(m, p, rho) > 2 * c + dComm) Nmarg = N + 2; else break;
  }
  return { utility: best, ratio: bestRatio, marginalRule: Nmarg, ceiling: voteCeiling(p, rho), rows };
}

// ---------------------------------------------------------------------------
// §3 Best-of-N with an imperfect verifier
// ---------------------------------------------------------------------------
/** Generate up to N candidates (sequential, stops at the 1st accepted; or parallel and pick an accepted one at random —
 *  same outcome distribution by exchangeability). Verifier: sensitivity s = P(accept|correct),
 *  false acceptance f = 1 − specificity = P(accept|wrong). Correlation between candidates via P~Beta (rho).
 *  r(P) = (1−s)P + (1−f)(1−P) (rejection prob.) is a convex combination → expansion with positive terms. */
export function bestOfN(N, p, { s = 0.9, f = 0.05, rho = 0 } = {}) {
  // E[P^x (1-P)^y r^k] = Σ_j C(k,j)(1-s)^j(1-f)^{k-j} M(x+j, y+k-j)
  const Er = (k, x, y) => {
    let acc = 0;
    for (let j = 0; j <= k; j++) {
      const w = Math.pow(1 - s, j) * Math.pow(1 - f, k - j);
      if (w > 0) acc += w * Math.exp(lchoose(k, j) + logMixedMoment(x + j, y + k - j, p, rho));
    }
    return acc;
  };
  let pTrue = 0, pFalse = 0, calls = 0;
  for (let k = 0; k < N; k++) {
    pTrue += s * Er(k, 1, 0);
    pFalse += f * Er(k, 0, 1);
    calls += Er(k, 0, 0);
  }
  const abstain = Er(N, 0, 0);
  const precision = p * s / (p * s + (1 - p) * f);
  return { N, pTrue, pFalse, abstain, expectedCalls: calls, precisionAccepted: pTrue / Math.max(1e-300, pTrue + pFalse), precisionIid: precision };
}
/** Best-of-N success ceiling (N→∞), independent: precision π = ps/(ps+(1−p)f). */
export const bestOfNCeiling = (p, s, f) => p * s / (p * s + (1 - p) * f);
/** Utility: U = V·P_true − L·P_false − cost; cost = expected calls × (c_gen + c_ver) (sequential)
 *  or N × (c_gen + c_ver) (parallel). */
export function bestOfNUtility(N, p, { s, f, rho, V = 10, L = 10, cGen = 1, cVer = 0.3, mode = 'sequential' } = {}) {
  const r = bestOfN(N, p, { s, f, rho });
  const calls = mode === 'sequential' ? r.expectedCalls : N;
  const cost = calls * (cGen + cVer);
  return { ...r, cost, U: V * r.pTrue - L * r.pFalse - cost, costPerTrueSuccess: cost / r.pTrue };
}
/** N to reach a target coverage with a perfect verifier (independent): ln(1−target)/ln(1−p). */
export const coverageN = (p, target) => Math.ceil(Math.log(1 - target) / Math.log(1 - p));

// ---------------------------------------------------------------------------
// §4 Equal budget: 1 agent with effort E vs N agents with effort E/N
// ---------------------------------------------------------------------------
/** Per-agent effort that matches the cost of 1 call with effort E (overhead c0 per call). */
export function equalBudgetEffort(E, N, cost = {}) {
  const { c0 = 0.2, c1 = 1 } = cost;
  return (c0 + c1 * E - N * c0) / (N * c1);
}
export function equalBudgetCompare(E, N, cap, { mode = 'bestof-perfect', rho = 0, s = 1, f = 0, cost = {} } = {}) {
  const e = equalBudgetEffort(E, N, cost);
  const pSolo = capability(E, cap);
  if (e <= 0) return { N, e, pSolo, pEach: 0, pSwarm: 0, swarmWins: false };
  const pEach = capability(e, cap);
  let pSwarm;
  if (mode === 'vote') pSwarm = majorityAccuracy(N, pEach, rho);
  else if (mode === 'bestof-perfect') pSwarm = 1 - mixedMoment(0, N, pEach, rho); // 1 − E[(1−P)^N]
  else pSwarm = bestOfN(N, pEach, { s, f, rho }).pTrue;
  const pSoloV = mode === 'bestof' ? bestOfN(1, pSolo, { s, f, rho: 0 }).pTrue : pSolo;
  return { N, e, pSolo: pSoloV, pEach, pSwarm, swarmWins: pSwarm > pSoloV };
}

// ---------------------------------------------------------------------------
// §5 Coordination cost: Universal Scalability Law (Gunther)
// ---------------------------------------------------------------------------
/** X(N) = γN / (1 + σ(N−1) + κN(N−1)). */
export const usl = (N, { sigma = 0.05, kappa = 0.01, gamma = 1 } = {}) => gamma * N / (1 + sigma * (N - 1) + kappa * N * (N - 1));
/** Peak: N_max = sqrt((1−σ)/κ). */
export const uslNmax = ({ sigma = 0.05, kappa = 0.01 } = {}) => Math.sqrt((1 - sigma) / kappa);
/** Token cost of a swarm with shared context: each agent rereads everyone's messages
 *  (coherence ~ N²) — cost = N·c + kappaMsg·R·edges(N). Useful per unit of cost. */
export function swarmTokenCost(N, { c = 1, kappaMsg = 0.05, rounds = 2, topology = 'full' } = {}) {
  return N * c + kappaMsg * rounds * edges(N, topology);
}

// ---------------------------------------------------------------------------
// §6 Decomposability: k subproblems with coupling χ
// ---------------------------------------------------------------------------
/** Solo: one agent with effort E solves the k parts (E/k each), with context interference ι
 *  per additional part. Split: k agents (per-agent effort adjusted to the same budget),
 *  each coupled pair (fraction χ of the k(k−1)/2 pairs) crosses an interface with loss μ; integration q_int. */
export function decomposition({ k = 3, chi = 0, iota = 0.08, mu = 0.15, qInt = 1, E = 6, cap = {}, cost = {} } = {}) {
  const pairs = k * (k - 1) / 2;
  const qSolo = capability(E / k, cap);
  const pSolo = Math.pow(qSolo, k) * Math.pow(1 - iota, k - 1);
  const eK = equalBudgetEffort(E, k, cost) ; // equal budget (k calls)
  const qSplit = eK > 0 ? capability(eK, cap) : 0;
  const pSplit = Math.pow(qSplit, k) * Math.pow(1 - mu, chi * pairs) * qInt;
  return { k, chi, pSolo, pSplit, splitWins: pSplit > pSolo, chiStar: chiStar({ k, iota, mu, qInt, qSolo, qSplit }) };
}
/** Critical coupling χ*: split wins ⇔ χ < χ*.
 *  χ* = [(k−1)ln(1−ι) + k·ln(q_solo/q_split) − ln q_int] / [C(k,2)·ln(1−μ)];  ≈ 2ι/(kμ) if q_solo = q_split, q_int = 1. */
export function chiStar({ k, iota, mu, qInt = 1, qSolo = 1, qSplit = 1 }) {
  if (k < 2) return 0;
  const num = (k - 1) * Math.log(1 - iota) + k * Math.log(qSolo / qSplit) - Math.log(qInt);
  return num / ((k * (k - 1) / 2) * Math.log(1 - mu));
}

// ---------------------------------------------------------------------------
// §7 Stopping and elasticity: SPRT (Wald), quorum, marginal gain, bounded repair
// ---------------------------------------------------------------------------
/** Symmetric binary SPRT (answer A vs B, each vote correct with assumed prob p0):
 *  LLR per vote = ±ln(p0/(1−p0)); stop when |margin| ≥ m* = ceil(ln((1−α)/α)/ln(p0/(1−p0))). */
export const sprtMargin = (p0, alpha) => Math.ceil(Math.log((1 - alpha) / alpha) / Math.log(p0 / (1 - p0)));
/** Exact error (gambler's ruin, no cap): P(wrong | P) = 1/(1+(P/(1−P))^m). Under Beta: integrate. */
export const sprtErrorGivenP = (P, m) => 1 / (1 + Math.pow(P / (1 - P), m));
export function sprtErrorBeta(p, rho, m, grid = 20000) {
  if (rho <= 0) return sprtErrorGivenP(p, m);
  const { a, b } = betaParams(p, rho);
  // Integration with substitution P = I^{-1}: use CDF differences (robust to singularities).
  let acc = 0, prev = 0;
  for (let i = 1; i <= grid; i++) {
    const x = i / grid, cdf = ibeta(a, b, x), mid = (i - 0.5) / grid;
    acc += (cdf - prev) * sprtErrorGivenP(Math.min(1 - 1e-12, Math.max(1e-12, mid)), m);
    prev = cdf;
  }
  return acc;
}
/** Monte Carlo simulation of the SPRT with a vote cap (per task P~Beta). */
export function sprtSimulate(p, rho, { p0 = 0.7, alpha = 0.05, cap = 51, trials = 20000, seed = 7 } = {}) {
  const R = rng(seed), m = sprtMargin(p0, alpha), bp = betaParams(p, rho);
  let wrong = 0, samples = 0, capped = 0;
  for (let t = 0; t < trials; t++) {
    const P = bp ? R.beta(bp.a, bp.b) : p;
    let margin = 0, n = 0;
    while (Math.abs(margin) < m && n < cap) { margin += R.u() < P ? 1 : -1; n++; }
    if (Math.abs(margin) < m) capped++;
    if (margin < 0 || (margin === 0 && R.u() < 0.5)) wrong++;
    samples += n;
  }
  return { m, nominalAlpha: alpha, realizedError: wrong / trials, meanVotes: samples / trials, cappedFrac: capped / trials };
}
/** Quorum as a race: the first option to accumulate Q votes decides (votes ~ Bern(P)).
 *  P(correct) = Σ_{j<Q} C(Q−1+j,j) E[P^Q(1−P)^j]; E[votes] = Σ_j (Q+j)·C(Q−1+j,j)(E[P^Q(1−P)^j]+E[(1−P)^Q P^j]). */
export function quorumRace(Q, p, rho = 0) {
  let acc = 0, ev = 0;
  for (let j = 0; j < Q; j++) {
    const lc = lchoose(Q - 1 + j, j);
    const right = Math.exp(lc + logMixedMoment(Q, j, p, rho)), wrongW = Math.exp(lc + logMixedMoment(j, Q, p, rho));
    acc += right; ev += (Q + j) * (right + wrongW);
  }
  return { Q, accuracy: acc, expectedVotes: ev };
}
/** Elasticity (sequential best-of-N) vs fixed size (parallel) on a mixture of difficulties. */
export function elasticVsFixed(classes, { s = 0.9, f = 0.05, Nmax = 8, cGen = 1, cVer = 0.3 } = {}) {
  const agg = (mode) => {
    let pT = 0, pF = 0, cost = 0;
    for (const cl of classes) {
      const r = bestOfN(Nmax, cl.p, { s, f, rho: cl.rho ?? 0 });
      pT += cl.w * r.pTrue; pF += cl.w * r.pFalse;
      cost += cl.w * (mode === 'elastic' ? r.expectedCalls : Nmax) * (cGen + cVer);
    }
    return { pTrue: pT, pFalse: pF, cost, costPerTrueSuccess: cost / pT };
  };
  return { fixed: agg('fixed'), elastic: agg('elastic') };
}
/** Bounded repair: attempt j fixes with q_j = q1·δ^{j−1}; each attempt costs c and introduces a
 *  regression with prob g (penalty Lreg). One-step rule (monotone case): try j while V·q_j > c + g·Lreg. */
export function repairCap({ q1 = 0.5, delta = 0.6, c = 1, g = 0.05, Lreg = 10, V = 10 } = {}) {
  const thr = c + g * Lreg;
  if (V * q1 <= thr) return { Rstar: 0, pFix: 0 };
  const Rstar = 1 + Math.floor(Math.log(thr / (V * q1)) / Math.log(delta));
  let unfixed = 1;
  for (let j = 1; j <= Rstar; j++) unfixed *= 1 - q1 * Math.pow(delta, j - 1);
  return { Rstar, pFix: 1 - unfixed };
}

// ---------------------------------------------------------------------------
// §8 Formalized natural mechanisms: response threshold and stigmergy with evaporation
// ---------------------------------------------------------------------------
/** Response threshold (Bonabeau et al. 1996): T_θ(s) = s^n/(s^n+θ^n). */
export const thresholdResponse = (s, theta, n = 2) => (s <= 0 ? 0 : Math.pow(s, n) / (Math.pow(s, n) + Math.pow(theta, n)));
/** Expected no. of active agents for stimulus s (e.g. estimated uncertainty) and thresholds θ_i. */
export const expectedActive = (s, thetas, n = 2) => thetas.reduce((acc, th) => acc + thresholdResponse(s, th, n), 0);
/** Stigmergy with evaporation λ (continuous time), environment changes as Poisson(h):
 *  weight of stale information = h/(h+λ); relative signal variance (discrete EWMA) = λ/(2−λ). */
export const staleWeight = (h, lambda) => h / (h + lambda);
export const ewmaVarianceFactor = (lambda) => lambda / (2 - lambda);
/** MSE-optimal λ ≈ minimize w_stale·Δ² + σ²·λ/(2−λ). */
export function optimalEvaporation(h, { delta2 = 1, noise2 = 0.25 } = {}) {
  let best = { lambda: null, mse: Infinity };
  for (let l = 0.001; l < 1; l += 0.001) {
    const mse = staleWeight(h, l) * delta2 + ewmaVarianceFactor(l) * noise2;
    if (mse < best.mse) best = { lambda: +l.toFixed(3), mse };
  }
  return best;
}
/** Messages per round: direct all-to-all N(N−1) vs stigmergic board 2N (write+read). */
export const messagesDirect = (N) => N * (N - 1);
export const messagesBoard = (N) => 2 * N;

// ---------------------------------------------------------------------------
// §10 Bridges to the literature (calibration; authors' numbers = author-reported)
// ---------------------------------------------------------------------------
/** Plurality with K_eff equiprobable wrong alternatives: per task, P(correct answer)=P~Beta, each
 *  wrong one gets (1−P)/K. Ceiling (N→∞): the correct one wins ⇔ P > 1/(1+K) ⇒ 1 − I_{1/(1+K)}(a,b). K=1 recovers the binary case.
 *  Agreement between errors (given both are wrong) = 1/K ⇒ K_eff ≈ 1/(agreement on errors). */
export function pluralityCeiling(p, rho, K) {
  const bp = betaParams(p, rho), thr = 1 / (1 + K);
  if (!bp) return p > thr ? 1 : p < thr ? 0 : 0.5;
  return 1 - ibeta(bp.a, bp.b, thr);
}
export function pluralitySimulate(N, p, rho, K, { trials = 20000, seed = 11 } = {}) {
  const R = rng(seed), bp = betaParams(p, rho);
  let ok = 0;
  for (let t = 0; t < trials; t++) {
    const P = bp ? R.beta(bp.a, bp.b) : p;
    const counts = new Array(K + 1).fill(0); // 0 = correct
    for (let i = 0; i < N; i++) counts[R.u() < P ? 0 : 1 + Math.floor(R.u() * K)]++;
    const mx = Math.max(...counts), winners = counts.map((c, j) => (c === mx ? j : -1)).filter((j) => j >= 0);
    if (winners.includes(0)) ok += 1 / winners.length;
  }
  return ok / trials;
}
/** Absolute marginal gain of the 2nd verified candidate (sequential): g(p) = E[P s · r(P)].
 *  Independent: g = ps(1−f) − p²s(s−f), peak at p* = (1−f)/(2(s−f)) (= 0.5 with a perfect verifier). */
export const secondAgentGain = (p, s = 1, f = 0, rho = 0) => s * ((1 - s) * mixedMoment(2, 0, p, rho) + (1 - f) * mixedMoment(1, 1, p, rho));
export const secondAgentPeak = (s = 1, f = 0) => Math.min(1, (1 - f) / (2 * (s - f)));
/** Peak of the 1→3 vote gain (independent): argmax (2p−1)p(1−p) = (3+√3)/6 ≈ 0.789. */
export const votePeak = () => (3 + Math.sqrt(3)) / 6;
/** Fraction of majority errors in which the vote is UNANIMOUS and wrong: E[(1−P)^N]/(1 − A_N).
 *  Disagreement signals cannot see these errors. */
export const unanimousWrongShare = (N, p, rho) => mixedMoment(0, N, p, rho) / (1 - majorityAccuracy(N, p, rho));
/** Fit (p, ρ) of the Beta family to pass@N coverage points (log grid). */
export function fitCoverage(points) {
  let best = null;
  for (let lp = -4; lp <= -0.05; lp += 0.01) for (let lr = -3; lr <= -0.01; lr += 0.01) {
    const p = 10 ** lp, rho = 10 ** lr;
    const e = points.reduce((s, [N, c]) => s + (1 - mixedMoment(0, N, p, rho) - c) ** 2, 0);
    if (!best || e < best.sse) best = { p, rho, sse: e };
  }
  return best;
}

// ---------------------------------------------------------------------------
// §11 Formalization of the nature candidates (nat-candidates C01–C10 + extras)
// ---------------------------------------------------------------------------
/** C01: effective N (Kish design effect) n/(1+(n−1)ρ) → 1/ρ; fraction of the possible vote gain obtained with N. */
export const nEffective = (N, rho) => N / (1 + (N - 1) * rho);
export function voteGainFraction(N, p, rho) {
  const a1 = majorityAccuracy(1, p, rho), ainf = voteCeiling(p, rho);
  return (majorityAccuracy(N, p, rho) - a1) / (ainf - a1);
}
/** Smallest odd N that obtains ≥ frac of the possible vote gain. */
export function nForGainFraction(p, rho, frac = 0.9, Nmax = 4001) {
  for (let N = 1; N <= Nmax; N += 2) if (voteGainFraction(N, p, rho) >= frac) return N;
  return Infinity;
}
/** C07: each agent reads k peers (fixed topological neighborhood) and decides by the majority of k+1 (k even).
 *  k* = smallest k with A_{k+1} ≥ A_∞ − δ — does not depend on N; read cost N·k (vs N(N−1) all-to-all). */
export function kStarNeighbors(p, rho, delta = 0.03, kMax = 2000, N = null) {
  // target: ceiling N→∞ (N = null) or full read of a finite group (majority of N, N odd)
  const target = (N ? majorityAccuracy(N, p, rho) : voteCeiling(p, rho)) - delta;
  for (let k = 0; k <= kMax; k += 2) if (majorityAccuracy(k + 1, p, rho) >= target) return k;
  return Infinity;
}
/** C08: sparse activation. Only m of N agents are competent on the task (success pc; others ≈ 0).
 *  Dense: N candidates + perfect verifier ⇒ 1 − (1−pc)^m, cost N.
 *  Sparse: the router puts j competent agents among the k active ones with a "biased" hypergeometric prob. — here,
 *  each of the k slots hits a competent agent with prob. r (router quality), without repetition. */
export function sparseVsDense({ N = 12, m = 3, pc = 0.6, k = 3, r = 0.7 } = {}) {
  const dense = 1 - Math.pow(1 - pc, m);
  // no. of competent agents activated J ~ Binomial(k, r) truncated at m
  let sparse = 0;
  for (let j = 0; j <= k; j++) {
    const w = Math.exp(lchoose(k, j)) * Math.pow(r, j) * Math.pow(1 - r, k - j);
    sparse += w * (1 - Math.pow(1 - pc, Math.min(j, m)));
  }
  return { dense, sparse, costRatio: k / N, gap: dense - sparse };
}
/** C06/C09: branching process (Galton–Watson; Harris 1963). Each job spawns m children on average;
 *  cleanup/deduplication/cancellation removes a fraction d ⇒ m_ef = m(1−d). Expected total progeny per root
 *  = 1/(1−m_ef) if m_ef < 1; diverges if m_ef ≥ 1. Critical cleanup d* = 1 − 1/m. */
export function branching(m, d = 0) {
  const mEff = m * (1 - d);
  return { mEff, totalProgenyPerRoot: mEff < 1 ? 1 / (1 - mEff) : Infinity, dCritical: m > 1 ? 1 - 1 / m : 0, supercritical: mEff >= 1 };
}
/** C06: launches coupled to acceptances — x_{t+1} = ε + g·a·x_t (a = acceptance prob. per attempt:
 *  p·s + (1−p)·f). Fixed point x* = ε/(1 − g·a) if g·a < 1 (contracts); if g·a ≥ 1 it grows up to the cap.
 *  On an infeasible task (p = 0) a = f ⇒ stationary waste ε/(1 − g·f) calls/round. */
export function acceptanceCoupledLaunch({ eps = 0.2, g = 2, p = 0, s = 0.9, f = 0.05, cap = 16, rounds = 200 } = {}) {
  const a = p * s + (1 - p) * f;
  let x = 1, total = 0;
  for (let t = 0; t < rounds; t++) { total += x; x = Math.min(cap, eps + g * a * x); }
  return { a, gain: g * a, fixedPoint: g * a < 1 ? eps / (1 - g * a) : cap, meanCallsPerRound: total / rounds };
}
/** C10: readaptation after an abrupt change. EWMA with rate λ: weight of the past after t steps = (1−λ)^t
 *  ⇒ t_frac = ln(1−frac)/ln(1−λ). Cumulative mean without decay with history T0: weight T0/(T0+t)
 *  ⇒ t_frac = T0·frac/(1−frac) (grows with the history: lock-in). */
export function readaptation(lambda, T0, frac = 0.9) {
  const tEwma = lambda > 0 ? Math.log(1 - frac) / Math.log(1 - lambda) : Infinity;
  const tCum = T0 * frac / (1 - frac);
  return { tEwma, tCumulative: tCum, ratio: tCum / tEwma, steadyNoiseFactor: ewmaVarianceFactor(lambda) };
}
/** Idle reserve (nat-inactive-reserve): M/M/c queue (Erlang C; Kleinrock 1975). a = λ/μ (load in agents).
 *  P(wait) = C(c, a); mean wait W_q = C/(cμ − λ). Unstable if a ≥ c. */
export function erlangC(c, a) {
  if (a >= c) return 1;
  let sum = 0, term = 1;
  for (let k = 0; k < c; k++) { if (k > 0) term *= a / k; sum += term; }
  const last = term * a / c * (c / (c - a)); // a^c/c! · c/(c−a)
  // term now = a^{c−1}/(c−1)!; a^c/c! = term·a/c
  return last / (sum + last);
}
export function mmcWait(c, lambda, mu = 1) {
  const a = lambda / mu;
  if (a >= c) return { stable: false, pWait: 1, Wq: Infinity };
  const C = erlangC(c, a);
  return { stable: true, pWait: C, Wq: C / (c * mu - lambda), utilization: a / c };
}
/** Impasse between two equally supported options (nat-stop-signal-cross-inhibition): a symmetric walk of the
 *  margin ±1 until |margin| = m takes E[T] = m² rounds (gambler's ruin). With verifiable cross-inhibition
 *  (each round, with prob. v, a verified counterexample eliminates the wrong option), E[T] = E[min(T_walk, Geom(v))].
 *  Exact computation by value iteration on the margin chain. */
export function impasseTime(m, v = 0) {
  const n = 2 * m + 1; let T = new Array(n).fill(0);
  for (let it = 0; it < 200000; it++) {
    const nt = T.slice(); let diff = 0;
    for (let i = 1; i < n - 1; i++) { nt[i] = 1 + (1 - v) * 0.5 * (T[i - 1] + T[i + 1]); diff = Math.max(diff, Math.abs(nt[i] - T[i])); }
    T = nt; if (diff < 1e-10) break;
  }
  return T[m];
}

// ---------------------------------------------------------------------------
// §9 Transition maps (1 agent → micro → macro)
// ---------------------------------------------------------------------------
/** Effort knee of the Hill curve (pLo = 0): elasticity ε(e) = d ln p/d ln e = β/(1+(e/h)^β) < 1
 *  ⇔ e > e_knee = h·(β−1)^{1/β} (β > 1); for β ≤ 1, ε < 1 always. Heuristic: splitting the budget
 *  pays off when the per-agent effort stays above the knee; concentrating, when it falls below. */
export const effortKnee = (h, beta) => (beta <= 1 ? 0 : h * Math.pow(beta - 1, 1 / beta));
/** V/c threshold for solo → micro (1 → 3 voters): V/c > (2 + Δcomm/c)/ΔA_0, ΔA_0 = E[(2P−1)P(1−P)]. */
export const voteSoloToMicroThreshold = (p, rho = 0, dCommOverC = 0) => (2 + dCommOverC) / voteMarginalGain(0, p, rho);

/** Picks the regime with the highest utility U = V·P_true − L·P_false − cost, with N agents in PARALLEL
 *  (1 round; latency ≈ constant) and verifier (s, f). Capability via Hill(h, β):
 *  solo-high = 1 agent with effort eHigh; solo-low = 1 agent with eLow; micro = 2–3 agents with eLow;
 *  macro = 4..Nmax agents with eLow. Correlation between candidates: ρ. */
export function regimeChoice({ h = 2, beta = 1, pHi = 0.95, eLow = 1, eHigh = 6, s = 0.9, f = 0.05, rho = 0, cost = {}, cVer = 0.3, V = 10, L = 10, Nmax = 32 }) {
  const cap = { pLo: 0, pHi, h, beta };
  const pLow = capability(eLow, cap), pHigh = capability(eHigh, cap);
  const evalN = (N, p, e, rr) => {
    const r = bestOfN(N, p, { s, f, rho: rr });
    const c = N * (callCost(e, cost) + cVer);
    return { N, e, p, U: V * r.pTrue - L * r.pFalse - c, pTrue: r.pTrue, pFalse: r.pFalse, cost: c };
  };
  const opts = { soloHigh: evalN(1, pHigh, eHigh, 0), soloLow: evalN(1, pLow, eLow, 0), micro: null, macro: null };
  for (let N = 2; N <= Nmax; N++) {
    const cand = evalN(N, pLow, eLow, rho);
    if (N <= 3) { if (!opts.micro || cand.U > opts.micro.U) opts.micro = cand; } else if (!opts.macro || cand.U > opts.macro.U) opts.macro = cand;
  }
  const winner = Object.entries(opts).sort((x, y) => y[1].U - x[1].U)[0][0];
  return { winner, pLow, pHigh, ...opts };
}

// ---------------------------------------------------------------------------
// CLI: curve generation
// ---------------------------------------------------------------------------
const r4 = (x) => (typeof x === 'number' ? +x.toFixed(4) : x);
const round = (o) => JSON.parse(JSON.stringify(o, (k, v) => r4(v)));

export const CURVES = {
  vote_vs_N() {
    const ps = [0.55, 0.6, 0.7, 0.8], rhos = [0, 0.05, 0.1, 0.2, 0.3, 0.5], Ns = [1, 3, 5, 7, 9, 15, 21, 31, 51, 101];
    const rows = [];
    for (const p of ps) for (const rho of rhos) rows.push({ p, rho, ceiling: voteCeiling(p, rho), commonShockCeiling: commonShockCeiling(p, rho), acc: Object.fromEntries(Ns.map((N) => [N, majorityAccuracy(N, p, rho)])), accCommonShock: Object.fromEntries(Ns.map((N) => [N, majorityCommonShock(N, p, rho)])) });
    return { description: 'Majority-vote accuracy vs N (beta-binomial and common shock) and asymptotic ceiling (§2).', rows };
  },
  vote_optimal_N() {
    const rows = [];
    for (const p of [0.55, 0.6, 0.7, 0.8, 0.9]) for (const rho of [0, 0.1, 0.3]) for (const V of [5, 20, 100]) {
      const o = optimalVoteN(p, rho, { V, c: 1, comm: { kappaMsg: 0.05, rounds: 1, topology: 'star' } });
      rows.push({ p, rho, V, N_util: o.utility.N, A_util: o.utility.A, N_marginalRule: o.marginalRule, N_accPerCost: o.ratio.N, ceiling: o.ceiling });
    }
    return { description: 'N* (odd) that maximizes V·A_N − cost, myopic marginal rule and N that maximizes accuracy/cost (§2). c=1 per agent, κ=0.05 per edge (star).', rows };
  },
  vote_heterogeneous() {
    const mixes = [
      { name: '80% easy (p=.8) + 20% hard (p=.3)', classes: [{ w: 0.8, p: 0.8 }, { w: 0.2, p: 0.3 }] },
      { name: '50% easy (p=.75) + 50% hard (p=.35)', classes: [{ w: 0.5, p: 0.75 }, { w: 0.5, p: 0.35 }] },
      { name: '30% easy (p=.9) + 70% hard (p=.4)', classes: [{ w: 0.3, p: 0.9 }, { w: 0.7, p: 0.4 }] },
    ];
    const Ns = [1, 3, 5, 7, 9, 11, 15, 21, 31, 51, 101];
    return { description: 'Mixture of difficulties: aggregate vote accuracy can be non-monotonic in N (cf. Chen et al. 2024, arXiv:2403.02419v2) (§2.4).', rows: mixes.map((m) => { const acc = Ns.map((N) => majorityMixture(N, m.classes)); const iBest = acc.indexOf(Math.max(...acc)); return { mix: m.name, acc: Object.fromEntries(Ns.map((N, i) => [N, acc[i]])), argmaxN: Ns[iBest] }; }) };
  },
  bestofN_verifier() {
    const rows = [];
    for (const p of [0.05, 0.1, 0.3, 0.5]) for (const f of [0, 0.01, 0.05, 0.2]) for (const rho of [0, 0.3]) {
      const Ns = [1, 2, 3, 5, 8, 16, 32, 64];
      rows.push({ p, s: 0.9, f, rho, ceiling_iid: bestOfNCeiling(p, 0.9, f), byN: Object.fromEntries(Ns.map((N) => { const r = bestOfN(N, p, { s: 0.9, f, rho }); return [N, { pTrue: r.pTrue, pFalse: r.pFalse, abstain: r.abstain, calls: r.expectedCalls }]; })) });
    }
    return { description: 'Sequential best-of-N with verifier (s=0.9, f=false acceptance). P_true saturates at precision π; P_false grows with N (§3).', rows };
  },
  equal_budget() {
    const rows = [];
    for (const beta of [0.5, 1, 2, 3]) for (const h of [1, 4, 16]) for (const mode of ['bestof-perfect', 'vote']) {
      const cap = { pLo: 0, pHi: 0.95, h, beta };
      const E = 8;
      rows.push({ beta, h, E, mode, solo: capability(E, cap), byN: Object.fromEntries([2, 3, 4, 8, 16].map((N) => { const r = equalBudgetCompare(E, N, cap, { mode, rho: 0.1 }); return [N, { eEach: r.e, pEach: r.pEach, pSwarm: r.pSwarm, swarmWins: r.swarmWins }]; })) });
    }
    return { description: 'Equal budget: 1 agent with effort E=8 vs N agents with effort (E/N − overhead). Hill capability (h=half-saturation, β=convexity). ρ=0.1 (§4).', rows };
  },
  usl() {
    const rows = [];
    for (const [sigma, kappa] of [[0.02, 0.001], [0.05, 0.01], [0.1, 0.02], [0.2, 0.05]]) {
      rows.push({ sigma, kappa, Nmax: uslNmax({ sigma, kappa }), Xmax: usl(uslNmax({ sigma, kappa }), { sigma, kappa }), X: Object.fromEntries([1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 64].map((N) => [N, usl(N, { sigma, kappa })])) });
    }
    const tokens = ['none', 'star', 'board', 'full'].map((topology) => ({ topology, cost: Object.fromEntries([1, 2, 3, 5, 8, 16, 32].map((N) => [N, swarmTokenCost(N, { topology })])) }));
    return { description: 'Gunther\'s USL (σ contention, κ coherence) and token cost by topology (§5).', rows, tokens };
  },
  decomposition() {
    const rows = [];
    for (const k of [1, 2, 3, 4, 6]) for (const chi of [0, 0.1, 0.25, 0.5, 1]) rows.push(decomposition({ k, chi, iota: 0.08, mu: 0.15, cap: { pLo: 0, pHi: 0.97, h: 0.5, beta: 1 }, E: 6 }));
    const chiStarApprox = [2, 3, 4, 6, 10].map((k) => ({ k, chiStarExactEqualQ: chiStar({ k, iota: 0.08, mu: 0.15 }), approx: 2 * 0.08 / (k * 0.15) }));
    return { description: 'Task with k subproblems, coupling χ; ι=0.08 context interference, μ=0.15 loss per interface (§6).', rows, chiStarApprox };
  },
  sprt_correlation() {
    const rows = [];
    for (const rho of [0, 0.05, 0.1, 0.2, 0.3]) {
      const sim = sprtSimulate(0.7, rho, { p0: 0.7, alpha: 0.05 });
      rows.push({ p: 0.7, rho, ...sim, exactErrorNoCap: sprtErrorBeta(0.7, rho, sim.m), fixedN_sameMeanVotes: majorityAccuracy(Math.max(1, 2 * Math.floor(sim.meanVotes / 2) + 1), 0.7, rho) });
    }
    return { description: 'SPRT calibrated for independence (p0=0.7, α=0.05) applied under correlation: realized vs nominal error (§7.1).', rows };
  },
  quorum() {
    const rows = [];
    for (const rho of [0, 0.2]) for (const Q of [1, 2, 3, 5, 8, 12]) rows.push({ p: 0.65, rho, ...quorumRace(Q, 0.65, rho) });
    return { description: 'Quorum as a race to Q votes: accuracy vs expected votes (time) — speed-accuracy (§7.2).', rows };
  },
  elastic_vs_fixed() {
    const mix = [{ w: 0.5, p: 0.9 }, { w: 0.3, p: 0.5 }, { w: 0.2, p: 0.15 }];
    const rows = [1, 2, 3, 4, 6, 8, 12].map((Nmax) => ({ Nmax, ...elasticVsFixed(mix, { Nmax, s: 0.9, f: 0.05 }) }));
    return { description: 'Mixture 50% easy (p=.9), 30% medium (.5), 20% hard (.15); verifier s=.9, f=.05; fixed parallel vs elastic sequential (§7.3).', mix, rows };
  },
  repair() {
    const rows = [];
    for (const q1 of [0.3, 0.6]) for (const delta of [0.4, 0.7, 0.9]) for (const g of [0, 0.05, 0.15]) rows.push({ q1, delta, g, ...repairCap({ q1, delta, g }) });
    return { description: 'Bounded repair: R* attempts by the one-step rule (V=10, c=1, Lreg=10) (§7.4).', rows };
  },
  nature_mechanisms() {
    const thetas = [0.1, 0.2, 0.35, 0.5, 0.7, 0.9];
    const activation = [0, 0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 0.9].map((s) => ({ stimulus: s, expectedActive: expectedActive(s, thetas, 2) }));
    const stig = [0.01, 0.05, 0.2].map((h) => ({ changeRate: h, optimal: optimalEvaporation(h), staleAt: Object.fromEntries([0.01, 0.05, 0.1, 0.3].map((l) => [l, staleWeight(h, l)])) }));
    const msgs = [2, 3, 5, 8, 16, 32].map((N) => ({ N, direct: messagesDirect(N), board: messagesBoard(N) }));
    return { description: 'Response threshold (activation), stigmergy with evaporation (stale weight h/(h+λ)) and messages direct vs board (§8).', thresholds: thetas, activation, stigmergy: stig, messages: msgs };
  },
  literature_calibration() {
    // (1) Large Language Monkeys (lit-large-language-monkeys; author-reported): MATH, Llama-3-8B-Instruct,
    //     coverage 82.9% (N=100) and 98.44% (N=10,000); vote/RM plateau at ~41%.
    const fit = fitCoverage([[100, 0.829], [10000, 0.9844]]);
    const Ks = [1, 1.67, 2.36, 3, 5, 8, 10, 15, 20];
    const ceilByK = Ks.map((K) => ({ K, ceiling: pluralityCeiling(fit.p, fit.rho, K) }));
    let Kimplied = null;
    for (let K = 1; K <= 100; K += 0.01) if (pluralityCeiling(fit.p, fit.rho, K) >= 0.41) { Kimplied = +K.toFixed(2); break; }
    // (2) Correlated errors (lit-correlated-errors; author-reported): agreement when both are wrong
    //     ≈ 0.6 (HELM; chance ≈ 1/3) and 0.423 (HuggingFace; chance 0.127) ⇒ K_eff = 1/agreement.
    const kEff = [{ source: 'HELM', errorAgreement: 0.6, Keff: 1 / 0.6 }, { source: 'HuggingFace', errorAgreement: 0.423, Keff: 1 / 0.423 }];
    // (3) Capability threshold (lit-scaling-agent-systems; author-reported: diminishing returns above ~45% single-agent success).
    const ps = [0.05, 0.1, 0.2, 0.3, 0.4, 0.45, 0.5, 0.6, 0.7, 0.8, 0.9];
    const gain = [];
    for (const rho of [0, 0.3, 0.6]) for (const [s, f] of [[1, 0], [0.9, 0.05], [0.9, 0.2]]) {
      const g = ps.map((p) => secondAgentGain(p, s, f, rho));
      gain.push({ rho, s, f, peakIid: secondAgentPeak(s, f), argmaxGrid: ps[g.indexOf(Math.max(...g))], gain: Object.fromEntries(ps.map((p, i) => [p, g[i]])), relGain: Object.fromEntries(ps.map((p, i) => [p, g[i] / (p * s)])) });
    }
    const voteGain = [0, 0.3].map((rho) => ({ rho, peakIid: votePeak(), gain: Object.fromEntries([0.55, 0.6, 0.7, 0.79, 0.85, 0.9, 0.95].map((p) => [p, voteMarginalGain(0, p, rho)])) }));
    // (4) Unanimous and wrong (lit-debate-routing-matched-ceiling reports 66% of the cases in which debate helps have a unanimous, wrong vote).
    const unanimous = [];
    for (const N of [3, 5]) for (const p of [0.5, 0.6, 0.7, 0.8]) unanimous.push({ N, p, byRho: Object.fromEntries([0, 0.1, 0.3, 0.5, 0.7].map((rho) => [rho, unanimousWrongShare(N, p, rho)])) });
    // (5) Coordination turns (lit-scaling-agent-systems: T = 2.72·(n+0.5)^1.724, R² = 0.974): exponent between star (1) and full (2).
    const turns = [1, 2, 3, 5, 8].map((n) => ({ n, turnsKim: 2.72 * (n + 0.5) ** 1.724, edgesStar: edges(n, 'star'), edgesFull: edges(n, 'full') }));
    return {
      description: 'Bridges to the literature (§10). Input numbers are author-reported; the outputs are consequences of the model, not validation.',
      monkeys: { input: { cov100: 0.829, cov10000: 0.9844, stableVote: 0.41 }, betaFit2Points: fit, predictedCoverageN1: 1 - mixedMoment(0, 1, fit.p, fit.rho), binaryCeiling: voteCeiling(fit.p, fit.rho), pluralityCeilingByK: ceilByK, KeffImpliedFor41: Kimplied, note: '2 points, 2 parameters: exact fit, not a test. Test = compare predicted pass@1 with the measured one and 1/K_eff with the agreement between wrong samples.' },
      kEff, capability: { verifiedSecondAgent: gain, voteOneToThree: voteGain }, unanimousWrong: unanimous, turns,
    };
  },
  nature_candidates() {
    const c01 = [];
    for (const p of [0.6, 0.7, 0.8]) for (const rho of [0.05, 0.1, 0.2, 0.3, 0.5]) c01.push({ p, rho, nCeil1overRho: 2 * Math.floor(Math.ceil(1 / rho) / 2) + 1, fracAtCeil1overRho: voteGainFraction(2 * Math.floor(Math.ceil(1 / rho) / 2) + 1, p, rho), nFor90: nForGainFraction(p, rho, 0.9), nEff10: nEffective(10, rho), nEffMax: 1 / rho });
    const c07 = [];
    for (const p of [0.6, 0.7, 0.8]) for (const rho of [0, 0.1, 0.3]) c07.push({ p, rho, kStar_3pp_inf: kStarNeighbors(p, rho, 0.03), kStarVsFullRead_3pp: Object.fromEntries([7, 13, 25, 51].map((N) => [N, kStarNeighbors(p, rho, 0.03, 2000, N)])), readsPerRound: Object.fromEntries([7, 13, 25].map((N) => [N, { topological: N * kStarNeighbors(p, rho, 0.03, 2000, N), full: N * (N - 1) }])) });
    const c08 = [];
    for (const r of [0.5, 0.7, 0.9]) for (const k of [1, 2, 3, 4, 6]) c08.push({ r, k, ...sparseVsDense({ N: 12, m: 3, pc: 0.6, k, r }) });
    const c09 = [0.5, 0.9, 1.0, 1.2, 1.5, 2].map((m) => ({ m, ...branching(m, 0), withCleanup30: branching(m, 0.3) }));
    const c06 = [];
    for (const p of [0, 0.3, 0.7]) for (const g of [1, 2, 4]) c06.push({ p, g, ...acceptanceCoupledLaunch({ p, g }) });
    const c10 = [0.01, 0.05, 0.1, 0.2].map((lambda) => ({ lambda, ...readaptation(lambda, 500) }));
    const reserve = [];
    for (const [c, lam] of [[4, 3], [4, 3.6], [5, 3.6], [6, 3.6], [4, 4.5], [5, 4.5], [6, 4.5]]) reserve.push({ c, lambda: lam, ...mmcWait(c, lam, 1) });
    const impasse = [];
    for (const m of [2, 3, 5]) impasse.push({ m, noInhibition: impasseTime(m, 0), v005: impasseTime(m, 0.05), v02: impasseTime(m, 0.2) });
    return { description: 'Formalization of the nature candidates (§11): C01 rule N≈1/ρ, C07 neighborhood k*, C08 sparse activation, C06/C09 branching, C10 readaptation, reserve (Erlang C), impasse vs cross-inhibition.', c01, c07, c08, c06, c09, c10, reserve, impasse };
  },
  transitions() {
    const map = [];
    for (const beta of [0.7, 1, 2, 3]) for (const h of [0.5, 2, 5, 12]) for (const f of [0.01, 0.05, 0.2]) for (const rho of [0, 0.3]) {
      const r = regimeChoice({ h, beta, f, rho, V: 20, L: 20 });
      map.push({ beta, h, f, rho, pLow: r.pLow, pHigh: r.pHigh, winner: r.winner, nMicro: r.micro.N, nMacro: r.macro.N, U: { soloHigh: r.soloHigh.U, soloLow: r.soloLow.U, micro: r.micro.U, macro: r.macro.U } });
    }
    const vote = [];
    for (const p of [0.55, 0.65, 0.75, 0.85]) for (const rho of [0, 0.05, 0.15, 0.3, 0.5]) {
      const o = optimalVoteN(p, rho, { V: 50, c: 1, comm: { kappaMsg: 0.05, topology: 'star' } });
      vote.push({ p, rho, Nstar: o.utility.N, regime: o.utility.N === 1 ? 'solo' : o.utility.N <= 3 ? 'micro' : 'macro', ceiling: o.ceiling, VoverC_soloToMicro: voteSoloToMicroThreshold(p, rho, 0.1) });
    }
    const knees = [];
    for (const beta of [0.5, 1, 2, 3]) for (const h of [1, 4, 16]) {
      const cap = { pLo: 0, pHi: 0.95, h, beta };
      for (const N of [2, 4, 8]) {
        const r = equalBudgetCompare(8, N, cap, { mode: 'bestof-perfect', rho: 0.1 });
        knees.push({ beta, h, N, eEach: r.e, eKnee: effortKnee(h, beta), predictedSplit: r.e > effortKnee(h, beta), actualSplit: r.swarmWins });
      }
    }
    return { description: 'Regime maps (§9): (a) verifier s=0.9, V=L=20, parallel; Hill capability(h, β), eLow=1, eHigh=6, c(e)=0.2+e, verification 0.3; (b) vote (V=50, c=1, κ=0.05 star) with V/c threshold solo→micro; (c) predicted effort knee vs actual winner under equal budget (E=8, ρ=0.1).', verifierMap: map, voteMap: vote, kneeCheck: knees, kneeAgreement: knees.filter((k) => k.predictedSplit === k.actualSplit).length / knees.length };
  },
};

function writeCurve(name, outDir) {
  const data = round({ id: `th-curve-${name.replace(/_/g, '-')}`, generatedBy: 'research/theory/model.mjs', evidence: 'hypothesis', ...CURVES[name]() });
  writeFileSync(join(outDir, `${name}.json`), JSON.stringify(data, null, 2) + '\n');
  return data;
}

function summary(all) {
  const L = [];
  const v = all.vote_vs_N.rows.filter((r) => r.p === 0.7);
  L.push('§2 Vote (p=0.7): ρ → ceiling | A_5 | A_21 | A_101');
  for (const r of v) L.push(`  ρ=${r.rho}: ${r.ceiling} | ${r.acc[5]} | ${r.acc[21]} | ${r.acc[101]}`);
  L.push('§2 N* (utility) p,ρ,V → N*, marginal rule, N(accuracy/cost)');
  for (const r of all.vote_optimal_N.rows.filter((r) => r.V === 20)) L.push(`  p=${r.p} ρ=${r.rho} V=20 → N*=${r.N_util} marg=${r.N_marginalRule} acc/cost=${r.N_accPerCost}`);
  L.push('§2.4 Difficulty mixture: argmax N');
  for (const r of all.vote_heterogeneous.rows) L.push(`  ${r.mix}: argmaxN=${r.argmaxN} A1=${r.acc[1]} A101=${r.acc[101]}`);
  L.push('§3 Best-of-N (s=0.9): p,f,ρ → ceiling π | P_true(64) | P_false(64)');
  for (const r of all.bestofN_verifier.rows) L.push(`  p=${r.p} f=${r.f} ρ=${r.rho}: π=${r.ceiling_iid} | ${r.byN[64].pTrue} | ${r.byN[64].pFalse}`);
  L.push('§4 Equal budget (E=8, perfect best-of, ρ=0.1): β,h → solo | swarm N=2,4,8');
  for (const r of all.equal_budget.rows.filter((r) => r.mode === 'bestof-perfect')) L.push(`  β=${r.beta} h=${r.h}: ${r.solo} | ${r.byN[2].pSwarm} ${r.byN[4].pSwarm} ${r.byN[8].pSwarm}`);
  L.push('§5 USL: σ,κ → N_max');
  for (const r of all.usl.rows) L.push(`  σ=${r.sigma} κ=${r.kappa}: N_max=${r.Nmax} X_max=${r.Xmax}`);
  L.push('§6 χ* (ι=0.08, μ=0.15): k → exact | ≈2ι/(kμ)');
  for (const r of all.decomposition.chiStarApprox) L.push(`  k=${r.k}: ${r.chiStarExactEqualQ} | ${r.approx}`);
  L.push('§7.1 SPRT under correlation (p=0.7, α=0.05): ρ → realized error | mean votes | uncapped error (exact)');
  for (const r of all.sprt_correlation.rows) L.push(`  ρ=${r.rho}: ${r.realizedError} | ${r.meanVotes} | ${r.exactErrorNoCap}`);
  L.push('§7.2 Quorum (p=0.65): ρ,Q → accuracy | votes');
  for (const r of all.quorum.rows) L.push(`  ρ=${r.rho} Q=${r.Q}: ${r.accuracy} | ${r.expectedVotes}`);
  L.push('§7.3 Elastic vs fixed: Nmax → cost/success fixed | elastic ; P_false');
  for (const r of all.elastic_vs_fixed.rows) L.push(`  Nmax=${r.Nmax}: ${r.fixed.costPerTrueSuccess} | ${r.elastic.costPerTrueSuccess} ; P_true=${r.elastic.pTrue} P_false=${r.elastic.pFalse}`);
  L.push('§7.4 Repair: q1,δ,g → R*, P_fix');
  for (const r of all.repair.rows.filter((r) => r.g === 0.05)) L.push(`  q1=${r.q1} δ=${r.delta}: R*=${r.Rstar} P_fix=${r.pFix}`);
  L.push('§8 Optimal evaporation: h → λ*');
  for (const r of all.nature_mechanisms.stigmergy) L.push(`  h=${r.changeRate}: λ*=${r.optimal.lambda}`);
  L.push('§9 Regime map (verifier): β,h,f,ρ → p_low,p_high → winner (N micro/macro)');
  for (const r of all.transitions.verifierMap) L.push(`  β=${r.beta} h=${r.h} f=${r.f} ρ=${r.rho}: p=${r.pLow}/${r.pHigh} → ${r.winner} (micro N=${r.nMicro}, macro N=${r.nMacro})`);
  L.push('§9 Regime map (vote, V=50): p,ρ → N*, V/c threshold solo→micro');
  for (const r of all.transitions.voteMap) L.push(`  p=${r.p} ρ=${r.rho}: N*=${r.Nstar} (${r.regime}) ceiling=${r.ceiling} V/c*=${r.VoverC_soloToMicro}`);
  const cal = all.literature_calibration;
  L.push(`§10 Monkeys (MATH): Beta fit p=${cal.monkeys.betaFit2Points.p} ρ=${cal.monkeys.betaFit2Points.rho} → predicted pass@1=${cal.monkeys.predictedCoverageN1}; binary ceiling=${cal.monkeys.binaryCeiling}; K_eff for ceiling 0.41 = ${cal.monkeys.KeffImpliedFor41}`);
  L.push('§10 Gain of the 2nd verified agent: ρ,s,f → peak (iid) | argmax on the grid');
  for (const g of cal.capability.verifiedSecondAgent) L.push(`  ρ=${g.rho} s=${g.s} f=${g.f}: p*=${g.peakIid} | ${g.argmaxGrid}`);
  L.push('§10 Unanimous-and-wrong fraction (N=3): p → ρ=0 | 0.3 | 0.7');
  for (const u of cal.unanimousWrong.filter((u) => u.N === 3)) L.push(`  p=${u.p}: ${u.byRho[0]} | ${u.byRho[0.3]} | ${u.byRho[0.7]}`);
  const nc = all.nature_candidates;
  L.push('§11 C01: p,ρ → N=⌈1/ρ⌉ odd | gain fraction | N for 90%');
  for (const r of nc.c01) L.push(`  p=${r.p} ρ=${r.rho}: N=${r.nCeil1overRho} | ${r.fracAtCeil1overRho} | ${r.nFor90}`);
  L.push('§11 C07: p,ρ → k* (3 pp from full read) for N=7,13,25,51 | k* vs ceiling ∞');
  for (const r of nc.c07) L.push(`  p=${r.p} ρ=${r.rho}: ${Object.values(r.kStarVsFullRead_3pp).join(', ')} | ${r.kStar_3pp_inf}`);
  L.push('§11 C08 (N=12, m=3, pc=0.6): r,k → sparse | dense | cost');
  for (const r of nc.c08) L.push(`  r=${r.r} k=${r.k}: ${r.sparse} | ${r.dense} | ${r.costRatio}`);
  L.push('§11 C06: p,g → gain g·a | calls/round');
  for (const r of nc.c06) L.push(`  p=${r.p} g=${r.g}: ${r.gain} | ${r.meanCallsPerRound}`);
  L.push('§11 C10 (T0=500): λ → t90 EWMA | t90 cumulative | ratio');
  for (const r of nc.c10) L.push(`  λ=${r.lambda}: ${r.tEwma} | ${r.tCumulative} | ${r.ratio}`);
  L.push('§11 Reserve M/M/c: c,λ → P(wait) | Wq');
  for (const r of nc.reserve) L.push(`  c=${r.c} λ=${r.lambda}: ${r.pWait} | ${r.Wq}`);
  L.push('§11 Impasse: m → E[T] no inhibition | v=0.05 | v=0.2');
  for (const r of nc.impasse) L.push(`  m=${r.m}: ${r.noInhibition} | ${r.v005} | ${r.v02}`);
  L.push(`§9 Agreement of the effort-knee criterion (equal budget): ${all.transitions.kneeAgreement}`);
  for (const r of all.transitions.kneeCheck.filter((r) => r.predictedSplit !== r.actualSplit)) L.push(`  disagreement: β=${r.beta} h=${r.h} N=${r.N} e=${r.eEach} knee=${r.eKnee}`);
  return L.join('\n');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const here = dirname(fileURLToPath(import.meta.url));
  const outDir = join(here, 'curves');
  mkdirSync(outDir, { recursive: true });
  const cmd = process.argv[2] ?? 'all';
  if (cmd === 'list') console.log(Object.keys(CURVES).join('\n'));
  else if (cmd === 'all') {
    const all = {};
    for (const name of Object.keys(CURVES)) all[name] = writeCurve(name, outDir);
    console.log(`Curves generated in ${outDir}: ${Object.keys(CURVES).length} files\n`);
    console.log(summary(all));
  } else if (CURVES[cmd]) console.log(JSON.stringify(writeCurve(cmd, outDir), null, 2));
  else { console.error(`unknown curve: ${cmd}`); process.exit(1); }
}
