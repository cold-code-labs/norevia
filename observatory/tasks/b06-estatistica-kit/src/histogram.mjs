/**
 * Fixed-width histograms.
 */

/**
 * histogram(xs, { bins = 10, min, max }) → [{ lo, hi, count }]
 *
 * - The interval [min, max] (default: minimum and maximum of xs) is divided into `bins`
 *   buckets of equal width. Each bucket is [lo, hi), except the last, which is [lo, hi]
 *   (includes max itself).
 * - Values outside [min, max] are ignored.
 * - If min === max, max = min + 1 is used.
 * - bins must be an integer >= 1 (otherwise RangeError); empty xs without min/max → [].
 */
export function histogram(xs, { bins = 10, min, max } = {}) {
  if (!Number.isInteger(bins) || bins < 1) throw new RangeError('bins must be a positive integer');
  if (xs.length === 0 && (min === undefined || max === undefined)) return [];
  const lo = min ?? Math.min(...xs);
  let hi = max ?? Math.max(...xs);
  if (hi < lo) throw new RangeError('max must be >= min');
  if (hi === lo) hi = lo + 1;
  const width = (hi - lo) / bins;
  const buckets = Array.from({ length: bins }, (_, i) => ({
    lo: lo + i * width,
    hi: i === bins - 1 ? hi : lo + (i + 1) * width,
    count: 0,
  }));
  for (const x of xs) {
    if (x < lo || x >= hi) continue;
    const idx = Math.min(Math.floor((x - lo) / width), bins - 1);
    buckets[idx].count++;
  }
  return buckets;
}

/** Cumulative counts: the i-th element is the sum of the counts of buckets 0..i. */
export function cumulative(buckets) {
  let total = 0;
  return buckets.map((b) => (total += b.count));
}
