/**
 * Percentis por interpolação linear entre os pontos da amostra ordenada
 * (posição = p/100 * (n - 1)), o mesmo método padrão do NumPy e do Excel PERCENTILE.INC.
 */

/**
 * percentile(xs, p): p em [0, 100] (senão RangeError). Array vazio → NaN.
 * p = 0 devolve o mínimo e p = 100 o máximo. Não altera xs.
 */
export function percentile(xs, p) {
  if (!(p >= 0 && p <= 100)) throw new RangeError('p must be within [0, 100]');
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const rank = (p / 100) * (s.length - 1);
  const lo = Math.floor(rank);
  const hi = lo + 1;
  return s[lo] + (s[hi] - s[lo]) * (rank - lo);
}

/** Vários percentis de uma vez, na ordem pedida. */
export function quantiles(xs, ps) {
  return ps.map((p) => percentile(xs, p));
}

/** Amplitude interquartil: P75 - P25. */
export function iqr(xs) {
  return percentile(xs, 75) - percentile(xs, 25);
}

/** Resumo de cinco números: { min, q1, median, q3, max } (P0, P25, P50, P75, P100). */
export function fiveNumberSummary(xs) {
  const [min, q1, median, q3, max] = quantiles(xs, [0, 25, 50, 75, 100]);
  return { min, q1, median, q3, max };
}
