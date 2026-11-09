/**
 * Measures of central tendency and dispersion. No function changes the received array.
 * All require an array of finite numbers (otherwise TypeError) and return NaN for an empty array.
 */

function check(xs) {
  if (!Array.isArray(xs) || !xs.every((x) => typeof x === 'number' && Number.isFinite(x))) {
    throw new TypeError('expected an array of finite numbers');
  }
}

export function mean(xs) {
  check(xs);
  if (xs.length === 0) return NaN;
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

/** Middle value of the sorted sample; with an even size, mean of the two middle ones. */
export function median(xs) {
  check(xs);
  const n = xs.length;
  if (n === 0) return NaN;
  const s = [...xs].sort();
  const mid = n >> 1;
  return n % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Most frequent value; tie → the smallest of them. */
export function mode(xs) {
  check(xs);
  if (xs.length === 0) return NaN;
  const counts = new Map();
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
  let best = NaN;
  let bestCount = 0;
  for (const [x, c] of counts) {
    if (c > bestCount || (c === bestCount && x < best)) {
      best = x;
      bestCount = c;
    }
  }
  return best;
}

/**
 * Population variance (divides by n) or sample variance ({ sample: true }, divides by n - 1;
 * fewer than 2 values → NaN).
 */
export function variance(xs, { sample = false } = {}) {
  check(xs);
  const n = xs.length;
  if (n === 0 || (sample && n < 2)) return NaN;
  const m = mean(xs);
  const ss = xs.reduce((s, x) => s + (x - m) ** 2, 0);
  return ss / (sample ? n - 1 : n);
}

export function stddev(xs, options) {
  return Math.sqrt(variance(xs, options));
}
