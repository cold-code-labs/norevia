// Norevia Labs — utilitários compartilhados das simulações (sem dependências externas).
// PRNG determinístico (mulberry32), derivação de seeds por célula, normais, estatística e I/O.
// Licença: MIT.

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BASE_SEED = 20261107;
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const RESULTS_DIR = join(ROOT, 'results', 'sims');

// ---------- PRNG ----------
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Seed por célula: FNV-1a + finalizador murmur3 sobre a descrição textual da célula.
// Torna cada célula independente da ordem dos laços.
export function hashSeed(...parts) {
  let h = 2166136261 >>> 0;
  const s = parts.map(String).join('|');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

export class Rng {
  constructor(seed) { this.u = mulberry32(seed); this.spare = null; }
  uniform() { return this.u(); }
  normal() { // Marsaglia polar
    if (this.spare !== null) { const s = this.spare; this.spare = null; return s; }
    let u, v, s;
    do { u = 2 * this.u() - 1; v = 2 * this.u() - 1; s = u * u + v * v; } while (s >= 1 || s === 0);
    const m = Math.sqrt(-2 * Math.log(s) / s);
    this.spare = v * m;
    return u * m;
  }
  int(n) { return Math.floor(this.u() * n); }
  bern(p) { return this.u() < p; }
  poisson(l) { // Knuth (l pequeno) / aproximação normal (l >= 30)
    if (l <= 0) return 0;
    if (l < 30) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= this.u(); } while (p > L); return k - 1; }
    return Math.max(0, Math.round(l + Math.sqrt(l) * this.normal()));
  }
  lognormal(mu, sigma) { return Math.exp(mu + sigma * this.normal()); }
}

// ---------- Normal ----------
// erfc com erro fracionário < 1.2e-7 (Numerical Recipes, erfcc).
function erfc(x) {
  const z = Math.abs(x); const t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
    t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
    t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}
export function normCdf(x) { return 0.5 * erfc(-x / Math.SQRT2); }
export function normPdf(x) { return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI); }
// Inversa da normal (Acklam), erro relativo ~1e-9.
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

// Grade para integração numérica sobre o fator latente S ~ N(0,1) (regra de Simpson em [-L, L]).
export function latentGrid(n = 801, L = 8) {
  const s = new Float64Array(n), w = new Float64Array(n); const h = (2 * L) / (n - 1);
  for (let i = 0; i < n; i++) {
    s[i] = -L + i * h;
    const coef = (i === 0 || i === n - 1) ? 1 : (i % 2 === 1 ? 4 : 2);
    w[i] = coef * h / 3 * normPdf(s[i]);
  }
  return { s, w };
}
// Probabilidade condicional de acerto dado o fator latente s (modelo de cópula gaussiana):
// acerto se sqrt(rho)*s + sqrt(1-rho)*e < z_p, logo q(s) = Phi((z_p - sqrt(rho) s)/sqrt(1-rho)).
export function condP(p, rho, s) {
  if (rho <= 0) return p;
  return normCdf((normInv(p) - Math.sqrt(rho) * s) / Math.sqrt(1 - rho));
}

// ---------- Estatística ----------
export const Z95 = 1.959963984540054;
export function wilson(k, n, z = Z95) {
  if (n === 0) return [NaN, NaN];
  const ph = k / n, z2 = z * z, den = 1 + z2 / n;
  const ctr = (ph + z2 / (2 * n)) / den;
  const hw = z * Math.sqrt(ph * (1 - ph) / n + z2 / (4 * n * n)) / den;
  return [Math.max(0, ctr - hw), Math.min(1, ctr + hw)];
}
export function prop(k, n) { const [lo, hi] = wilson(k, n); return { p: k / n, lo, hi, n }; }
// Acumulador de média/variância (Welford) com IC normal 95%.
export class Acc {
  constructor() { this.n = 0; this.m = 0; this.s2 = 0; }
  add(x) { this.n++; const d = x - this.m; this.m += d / this.n; this.s2 += d * (x - this.m); }
  get mean() { return this.m; }
  get sd() { return this.n > 1 ? Math.sqrt(this.s2 / (this.n - 1)) : 0; }
  ci() { const hw = Z95 * this.sd / Math.sqrt(Math.max(1, this.n)); return { mean: this.m, lo: this.m - hw, hi: this.m + hw, n: this.n }; }
}
export function meanCI(arr) { const a = new Acc(); for (const x of arr) a.add(x); return a.ci(); }
// Razão de médias (ex.: custo por acerto = soma custo / soma acertos) com IC pelo método delta.
export class RatioAcc {
  constructor() { this.n = 0; this.sx = 0; this.sy = 0; this.sxx = 0; this.syy = 0; this.sxy = 0; }
  add(x, y) { this.n++; this.sx += x; this.sy += y; this.sxx += x * x; this.syy += y * y; this.sxy += x * y; }
  ci() {
    const n = this.n, mx = this.sx / n, my = this.sy / n;
    if (my === 0) return { ratio: null, lo: null, hi: null, n };
    const R = mx / my;
    const vx = (this.sxx - n * mx * mx) / (n - 1), vy = (this.syy - n * my * my) / (n - 1), cxy = (this.sxy - n * mx * my) / (n - 1);
    const v = (vx - 2 * R * cxy + R * R * vy) / (n * my * my);
    const hw = Z95 * Math.sqrt(Math.max(0, v));
    return { ratio: R, lo: R - hw, hi: R + hw, n };
  }
}

// ---------- Formatação ----------
export function r(x, d = 4) { if (x === null || x === undefined || !Number.isFinite(x)) return x ?? null; const f = 10 ** d; return Math.round(x * f) / f; }
// Arredonda recursivamente todos os números de um objeto (JSON estável).
export function roundDeep(o, d = 5) {
  if (typeof o === 'number') return r(o, d);
  if (Array.isArray(o)) return o.map((x) => roundDeep(x, d));
  if (o && typeof o === 'object') { const out = {}; for (const k of Object.keys(o)) out[k] = roundDeep(o[k], d); return out; }
  return o;
}
export function pct(x, d = 1) { return (100 * x).toFixed(d).replace('.', ',') + '%'; }
export function num(x, d = 2) { return Number(x).toFixed(d).replace('.', ','); }
export function ciPct(o, d = 1) { return `${pct(o.p ?? o.mean, d)} [IC95% ${pct(o.lo, d)}–${pct(o.hi, d)}]`; }
export function ciNum(o, d = 2) { const v = o.ratio ?? o.mean; return `${num(v, d)} [IC95% ${num(o.lo, d)}–${num(o.hi, d)}]`; }

// ---------- I/O ----------
export function stableStringify(obj) { return JSON.stringify(obj, null, 1); }
export function writeResult(id, obj) {
  mkdirSync(RESULTS_DIR, { recursive: true });
  const path = join(RESULTS_DIR, `${id}.json`);
  const text = stableStringify(obj) + '\n';
  const prev = existsSync(path) ? readFileSync(path, 'utf8') : null;
  writeFileSync(path, text);
  const sha = createHash('sha256').update(text).digest('hex');
  return { path, sha256: sha, changed: prev !== null && prev !== text, isNew: prev === null };
}
export function sha256File(path) { return createHash('sha256').update(readFileSync(path)).digest('hex'); }

// Execução direta: `node sims/<id>.mjs` grava o JSON e imprime as manchetes.
export function mainIfDirect(metaUrl, runFn) {
  if (process.argv[1] && fileURLToPath(metaUrl) === process.argv[1]) {
    const t0 = Date.now();
    const out = runFn();
    const w = writeResult(out.id, out);
    console.log(`[${out.id}] ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${w.path} sha256=${w.sha256.slice(0, 16)}`);
    for (const h of out.headline) console.log('  • ' + h);
  }
}
