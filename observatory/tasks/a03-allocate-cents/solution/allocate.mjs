/**
 * Allocation of monetary values in cents.
 *
 * allocate(totalCents, weights) splits `totalCents` into integer parts
 * proportional to `weights`, without losing or creating cents (the sum of the parts
 * is always `totalCents`).
 *
 * Largest remainder method:
 *   1. each part receives floor(totalCents * w / sum(weights));
 *   2. the leftover cents are handed out, one per part, to the parts with the largest
 *      remainder of the division; in case of a tie in the remainder, the part with the lowest index
 *      receives first.
 */

function assertInt(name, value) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer, got ${value}`);
  }
}

export function allocate(totalCents, weights) {
  assertInt('totalCents', totalCents);
  if (!Array.isArray(weights) || weights.length === 0) {
    throw new RangeError('weights must be a non-empty array');
  }
  weights.forEach((w, i) => assertInt(`weights[${i}]`, w));
  const sum = weights.reduce((acc, w) => acc + w, 0);
  if (sum === 0) throw new RangeError('weights must not all be zero');

  const parts = weights.map((w, index) => {
    const scaled = totalCents * w;
    const base = Math.floor(scaled / sum);
    return { index, amount: base, remainder: scaled - base * sum };
  });

  let leftover = totalCents - parts.reduce((acc, p) => acc + p.amount, 0);
  const byRemainder = [...parts].sort(
    (x, y) => y.remainder - x.remainder || x.index - y.index,
  );
  for (let i = 0; leftover > 0; i++, leftover--) {
    byRemainder[i].amount += 1;
  }
  return parts.map((p) => p.amount);
}

/**
 * Splits `totalCents` into `n` equal parts (maximum difference of 1 cent).
 */
export function splitEvenly(totalCents, n) {
  if (!Number.isInteger(n) || n < 1) throw new RangeError('n must be a positive integer');
  return allocate(totalCents, new Array(n).fill(1));
}
