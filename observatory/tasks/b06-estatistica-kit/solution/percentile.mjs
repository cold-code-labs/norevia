/**
 * Percentiles by linear interpolation between the points of the sorted sample
 * (position = p/100 * (n - 1)), the same default method as NumPy and Excel PERCENTILE.INC.
 */

/**
 * percentile(xs, p): p in [0, 100] (otherwise RangeError). Empty array → NaN.
 * p = 0 returns the minimum and p = 100 the maximum. Does not change xs.
 */
export function percentile(xs, p) {
  if (!(p >= 0 && p <= 100)) throw new RangeError('p must be within [0, 100]');
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const rank = (p / 100) * (s.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.min(lo + 1, s.length - 1);
  return s[lo] + (s[hi] - s[lo]) * (rank - lo);
}

/** Several percentiles at once, in the requested order. */
export function quantiles(xs, ps) {
  return ps.map((p) => percentile(xs, p));
}

/** Interquartile range: P75 - P25. */
export function iqr(xs) {
  return percentile(xs, 75) - percentile(xs, 25);
}

/** Five-number summary: { min, q1, median, q3, max } (P0, P25, P50, P75, P100). */
export function fiveNumberSummary(xs) {
  const [min, q1, median, q3, max] = quantiles(xs, [0, 25, 50, 75, 100]);
  return { min, q1, median, q3, max };
}
