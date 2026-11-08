// Norevia playground models — ported, formula for formula, from the repository's own code.
// Nothing here is a new result; every function names its origin. Used in the browser (bundled into each
// playground script by build.mjs) and in Node (build-time static previews).
//   sims/lib.mjs                     -> mulberry32, Rng, erfc/normCdf/normPdf/normInv, latentGrid, condP
//   sims/sim-voto-correlacionado.mjs -> pOf, voteGivenQ, analyticVote  (renamed sim-correlated-vote.mjs)
//   sims/sim-verificador.mjs         -> fsFormula                      (renamed sim-verifier.mjs)
//   sims/sim-elastico.mjs            -> ELASTIC params, qOf, fixedExact, bestFixedN, sizeClass (sim-elastic.mjs)
//   sims/sim-estigmergia.mjs         -> STIG params, buildGrid, stigmergy step (sim-stigmergy.mjs)
//   sims/sim-limiar-resposta.mjs     -> THR params, rateAt, threshold/fixed allocation (sim-response-threshold.mjs)
//   research/theory/model.mjs        -> lgamma, ibeta, betaParams, logMixedMoment, majorityAccuracy, bestOfN

// ---------------------------------------------------------------- sims/lib.mjs
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export class Rng {
  constructor(seed) { this.u = mulberry32(seed); this.spare = null; }
  uniform() { return this.u(); }
  normal() {
    if (this.spare !== null) { const s = this.spare; this.spare = null; return s; }
    let u, v, s;
    do { u = 2 * this.u() - 1; v = 2 * this.u() - 1; s = u * u + v * v; } while (s >= 1 || s === 0);
    const m = Math.sqrt(-2 * Math.log(s) / s);
    this.spare = v * m;
    return u * m;
  }
  int(n) { return Math.floor(this.u() * n); }
  poisson(l) {
    if (l <= 0) return 0;
    if (l < 30) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= this.u(); } while (p > L); return k - 1; }
    return Math.max(0, Math.round(l + Math.sqrt(l) * this.normal()));
  }
}
function erfc(x) {
  const z = Math.abs(x); const t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
    t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
    t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}
export function normCdf(x) { return 0.5 * erfc(-x / Math.SQRT2); }
export function normPdf(x) { return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI); }
export function normInv(p) {
  if (p <= 0) return -Infinity; if (p >= 1) return Infinity;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425, ph = 1 - pl; let q, r;
  if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p <= ph) { q = p - 0.5; r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
  q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}
// Simpson grid over the latent factor S ~ N(0,1) on [-L, L].
export function latentGrid(n = 801, L = 8) {
  const s = new Float64Array(n), w = new Float64Array(n); const h = (2 * L) / (n - 1);
  for (let i = 0; i < n; i++) {
    s[i] = -L + i * h;
    const coef = (i === 0 || i === n - 1) ? 1 : (i % 2 === 1 ? 4 : 2);
    w[i] = coef * h / 3 * normPdf(s[i]);
  }
  return { s, w };
}
// Gaussian copula: correct iff sqrt(rho)*S + sqrt(1-rho)*e < z_p  =>  q(s) = Phi((z_p - sqrt(rho) s)/sqrt(1-rho)).
export function condP(p, rho, s) {
  if (rho <= 0) return p;
  return normCdf((normInv(p) - Math.sqrt(rho) * s) / Math.sqrt(1 - rho));
}

// ---------------------------------------------------------------- sim-voto-correlacionado / sim-correlated-vote
// Effort model of the simulation: p(e) = 1 - err1 * e^(-beta); low-effort agent e=1 (p_L = 1 - err1).
export const pOf = (e, beta, err1) => 1 - err1 * Math.pow(e, -beta);
const LOGF = (() => { const a = new Float64Array(400); for (let i = 1; i < 400; i++) a[i] = a[i - 1] + Math.log(i); return a; })();
export function voteGivenQ(N, q) {
  if (q <= 0) return 0; if (q >= 1) return 1;
  const lq = Math.log(q), l1 = Math.log(1 - q); let acc = 0;
  for (let c = 0; c <= N; c++) {
    const pm = Math.exp(LOGF[N] - LOGF[c] - LOGF[N - c] + c * lq + (N - c) * l1);
    if (2 * c > N) acc += pm; else if (2 * c === N) acc += 0.5 * pm;
  }
  return acc;
}
let GRID = null;
export function analyticVote(N, p, rho, grid) {
  if (rho === 0) return voteGivenQ(N, p);
  const G = grid || GRID || (GRID = latentGrid(801, 8));
  let s = 0; for (let i = 0; i < G.s.length; i++) s += G.w[i] * voteGivenQ(N, condP(p, rho, G.s[i]));
  return s;
}
// Ceiling of the vote (N -> inf) in the copula model: Phi(z_L / sqrt(rho)); critical rho_c = (z_L / z_H)^2.
export const voteCeilingCopula = (p, rho) => (rho === 0 ? (p > 0.5 ? 1 : p < 0.5 ? 0 : 0.5) : normCdf(normInv(p) / Math.sqrt(rho)));
export const rhoCritical = (pL, pH) => (normInv(pL) / normInv(pH)) ** 2;

// ---------------------------------------------------------------- research/theory/model.mjs §0, §2, §3
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
export function betaParams(p, rho) {
  if (rho <= 0) return null;
  const k = (1 - rho) / rho;
  return { a: p * k, b: (1 - p) * k };
}
export function logMixedMoment(i, j, p, rho) {
  const bp = betaParams(p, rho);
  if (!bp) return (i === 0 ? 0 : i * Math.log(p)) + (j === 0 ? 0 : j * Math.log(1 - p));
  return lbeta(bp.a + i, bp.b + j) - lbeta(bp.a, bp.b);
}
export const mixedMoment = (i, j, p, rho) => Math.exp(logMixedMoment(i, j, p, rho));
export function votePmf(N, k, p, rho = 0) { return Math.exp(lchoose(N, k) + logMixedMoment(k, N - k, p, rho)); }
export function majorityAccuracy(N, p, rho = 0) {
  let acc = 0;
  for (let k = 0; k <= N; k++) {
    const w = votePmf(N, k, p, rho);
    if (2 * k > N) acc += w; else if (2 * k === N) acc += 0.5 * w;
  }
  return Math.min(1, Math.max(0, acc));
}
// Best-of-N with an imperfect verifier (sensitivity s, false-accept f = 1 - specificity), correlation via P~Beta.
export function bestOfN(N, p, { s = 0.9, f = 0.05, rho = 0 } = {}) {
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
  return { N, pTrue, pFalse, abstain, expectedCalls: calls };
}
export const bestOfNCeiling = (p, s, f) => p * s / (p * s + (1 - p) * f);
// sim-verificador: independent closed form of the false-success rate of sequential best-of-N.
export function fsFormula(p, sens, spec, N) { const rc = p * sens, rw = (1 - p) * (1 - spec); return rw / (rc + rw) * (1 - Math.pow(1 - rc - rw, N)); }

// ---------------------------------------------------------------- sim-elastico / sim-elastic
export const ELASTIC = {
  classes: [
    { name: 'easy', share: 0.5, p: 0.9, rho: 0.2 },
    { name: 'medium', share: 0.35, p: 0.5, rho: 0.3 },
    { name: 'coupled', share: 0.15, p: 0.15, rho: 0.5 },
  ],
  test: { sens: 1.0, spec: 0.98, cost: 0.1 },
  attempt_cost: 1, Nmax: 32,
};
const GN = 241, GL = 6;
const GS = Array.from({ length: GN }, (_, i) => -GL + (2 * GL * i) / (GN - 1));
export function qOf(p, rho, s) { return rho <= 0 ? p : normCdf((normInv(p) - Math.sqrt(rho) * s) / Math.sqrt(1 - rho)); }
// Exact (integrated) P(correct accepted) and P(false accepted) for N parallel attempts, all tested, first pass delivered.
export function fixedExact(c, N, spec = ELASTIC.test.spec) {
  let pc = 0, pf = 0, Z = 0;
  for (const s of GS) { const w = normPdf(s); Z += w; const q = qOf(c.p, c.rho, s), r = (1 - q) * spec; const g = Math.abs(1 - r) < 1e-15 ? N : (1 - Math.pow(r, N)) / (1 - r); pc += w * q * g; pf += w * (1 - q) * (1 - spec) * g; }
  return { pCorrect: pc / Z, pFalse: pf / Z };
}
// Utility U = V*P(correct) - N*(attempt+test) - V*P(false accept); N = 0 (do not try) has U = 0.
export function bestFixedN(c, V, { spec = ELASTIC.test.spec, unit = ELASTIC.attempt_cost + ELASTIC.test.cost, Nmax = ELASTIC.Nmax, table = null } = {}) {
  let best = { N: 0, U: 0 };
  for (let N = 1; N <= Nmax; N++) { const e = table ? table[N] : fixedExact(c, N, spec); const U = V * e.pCorrect - N * unit - V * e.pFalse; if (U > best.U + 1e-12) best = { N, U }; }
  return best;
}
export const sizeClass = (N) => (N === 0 ? 'do-not-try' : N === 1 ? 'single' : N <= 5 ? 'micro' : 'macro');

// ---------------------------------------------------------------- sim-estigmergia / sim-stigmergy
export const STIG = { grid: 24, Ks: [4, 16], epsilons: [0, 0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1], deposit: 1 };
export function buildGrid(W) {
  const n = W * W, nb = new Int32Array(n * 4).fill(-1), deg = new Uint8Array(n);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const v = y * W + x; const ns = [];
    if (x > 0) ns.push(v - 1); if (x < W - 1) ns.push(v + 1); if (y > 0) ns.push(v - W); if (y < W - 1) ns.push(v + W);
    deg[v] = ns.length; ns.forEach((u, i) => { nb[v * 4 + i] = u; });
  }
  return { n, nb, deg, W };
}
// Stepwise version of simulateRun (mode 'stigmergy' or 'none'): same rules, exposed one time step at a time.
export function stigmergyWorld({ K = 4, eps = 0.1, mode = 'stigmergy', seed = 20261107 } = {}) {
  const G = buildGrid(STIG.grid), { n, nb, deg, W } = G;
  const rng = new Rng(seed);
  const pos = new Int32Array(K).fill(Math.floor(W / 2) * W + Math.floor(W / 2)), prev = new Int32Array(K).fill(-1);
  const m = new Float64Array(n), tl = new Float64Array(n), visitedEp = new Int32Array(n).fill(-1);
  const cand = new Int32Array(4);
  const w = { G, K, eps, mode, pos, m, t: 0, ep: 0, steps: 0, target: -1, epTimes: [], dups: 0, moves: 0, lastFound: -1 };
  const logk = () => (w.eps > 0 && w.eps < 1 ? Math.log(1 - w.eps) : 0);
  w.val = (v, t = w.t) => { if (w.eps === 0) return m[v]; if (w.eps >= 1) return t === tl[v] ? m[v] : 0; return m[v] * Math.exp((t - tl[v]) * logk()); };
  w.newTarget = () => { let tg; do { tg = rng.int(n); } while (Array.prototype.some.call(pos, (p) => p === tg)); w.target = tg; for (let k = 0; k < K; k++) visitedEp[pos[k]] = w.ep; w.steps = 0; };
  w.step = () => {
    w.t++; w.steps++;
    let found = false;
    for (let k = 0; k < K && !found; k++) {
      const v = pos[k], d = deg[v]; let next;
      if (w.mode === 'none') {
        let c = 0; for (let i = 0; i < d; i++) { const u = nb[v * 4 + i]; if (u !== prev[k]) cand[c++] = u; }
        next = c ? cand[rng.int(c)] : nb[v * 4 + rng.int(d)];
      } else {
        let best = Infinity, c = 0;
        for (let i = 0; i < d; i++) {
          const u = nb[v * 4 + i]; const x = w.val(u, w.t);
          if (x < best - 1e-12) { best = x; c = 0; cand[c++] = u; } else if (Math.abs(x - best) <= 1e-12) cand[c++] = u;
        }
        next = cand[rng.int(c)];
      }
      prev[k] = v; pos[k] = next; w.moves++;
      if (visitedEp[next] === w.ep) w.dups++; else visitedEp[next] = w.ep;
      if (w.mode === 'stigmergy') { m[next] = w.val(next, w.t) + STIG.deposit; tl[next] = w.t; }
      if (next === w.target) found = true;
    }
    if (found || w.steps >= 20000) { w.epTimes.push(w.steps); w.lastFound = w.target; w.ep++; w.newTarget(); return true; }
    return false;
  };
  w.mass = () => { let s = 0; for (let v = 0; v < n; v++) s += w.val(v); return s; };
  w.newTarget();
  return w;
}

// ---------------------------------------------------------------- sim-limiar-resposta / sim-response-threshold
export const THR = { M: 40, types: 2, base_rate: 1.0, spike_duration: 50, spike_multiplier: 4, mu: 0.5, thMin: 5, thMax: 50, n: 2, pQuit: 0.1, fixedPerType: 3 };
// Threshold response T(s) = s^n / (s^n + theta^n) (Bonabeau, Theraulaz & Deneubourg 1996; model.mjs §8).
export const thresholdResponse = (s, theta, n = 2) => (s <= 0 ? 0 : Math.pow(s, n) / (Math.pow(s, n) + Math.pow(theta, n)));
// One allocation strategy fed by a shared arrival stream. kind: 'threshold' | 'fixed'.
export function allocationWorld({ kind = 'threshold', M = THR.M, thMin = THR.thMin, thMax = THR.thMax, pQuit = THR.pQuit, perType = THR.fixedPerType, seed = 7 } = {}) {
  const rng = new Rng(seed);
  const active = new Int8Array(M).fill(-1);
  const theta = [new Float64Array(M), new Float64Array(M)];
  for (let j = 0; j < 2; j++) for (let i = 0; i < M; i++) theta[j][i] = thMin + (thMax - thMin) * rng.uniform();
  if (kind === 'fixed') { let i = 0; for (let j = 0; j < 2; j++) for (let k = 0; k < perType; k++) active[i++] = j; }
  const w = { kind, M, active, theta, queue: [0, 0], t: 0, done: 0, pQuit };
  w.retune = (lo, hi) => { for (let j = 0; j < 2; j++) for (let i = 0; i < M; i++) theta[j][i] = lo + (hi - lo) * rng.uniform(); };
  w.step = (arrivals) => {
    for (let j = 0; j < 2; j++) w.queue[j] += arrivals[j];
    const ql = [w.queue[0], w.queue[1]];
    if (kind === 'threshold') {
      for (let i = 0; i < M; i++) {
        const a = active[i];
        if (a >= 0) { if (rng.uniform() < w.pQuit) active[i] = -1; }
        else {
          const first = rng.uniform() < 0.5 ? 0 : 1;
          for (let k = 0; k < 2; k++) {
            const j = (first + k) % 2, s = ql[j];
            if (s <= 0) continue;
            const sn = s * s, th = theta[j][i];
            if (rng.uniform() < sn / (sn + th * th)) { active[i] = j; break; }
          }
        }
      }
    }
    let nAct = 0; const per = [0, 0];
    for (let i = 0; i < M; i++) {
      const j = active[i]; if (j < 0) continue; nAct++; per[j]++;
      if (w.queue[j] > 0 && rng.uniform() < THR.mu) { w.queue[j]--; w.done++; }
    }
    w.t++;
    return { active: nAct, per, backlog: w.queue[0] + w.queue[1], queue: [w.queue[0], w.queue[1]] };
  };
  return w;
}
