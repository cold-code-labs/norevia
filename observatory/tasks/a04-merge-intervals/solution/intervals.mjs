/**
 * Operations on closed intervals [start, end] of numbers.
 *
 * Intervals that overlap or that touch at an endpoint ([1, 3] and [3, 5])
 * are merged. The functions are pure: they do not modify the received array nor the
 * [start, end] pairs inside it, and the returned pairs are new arrays.
 */

function validate(intervals) {
  if (!Array.isArray(intervals)) throw new TypeError('intervals must be an array');
  for (const iv of intervals) {
    if (!Array.isArray(iv) || iv.length !== 2) throw new TypeError('each interval must be [start, end]');
    const [s, e] = iv;
    if (typeof s !== 'number' || typeof e !== 'number' || Number.isNaN(s) || Number.isNaN(e)) {
      throw new TypeError('interval bounds must be numbers');
    }
    if (s > e) throw new RangeError(`invalid interval [${s}, ${e}]`);
  }
}

/**
 * Merges overlapping or adjacent intervals. Result sorted by start,
 * without overlaps.
 */
export function mergeIntervals(intervals) {
  validate(intervals);
  const sorted = [...intervals].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const out = [];
  for (const iv of sorted) {
    const last = out[out.length - 1];
    if (last && iv[0] <= last[1]) {
      last[1] = Math.max(last[1], iv[1]);
    } else {
      out.push([iv[0], iv[1]]);
    }
  }
  return out;
}

/**
 * Total length covered by the union of the intervals (sum of end - start
 * of the merged intervals).
 */
export function coveredLength(intervals) {
  return mergeIntervals(intervals).reduce((acc, [s, e]) => acc + (e - s), 0);
}

/**
 * true if `x` belongs to some of the intervals (endpoints included).
 */
export function covers(intervals, x) {
  return mergeIntervals(intervals).some(([s, e]) => s <= x && x <= e);
}
