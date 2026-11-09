/**
 * range(start, end, step = 1): array of numbers from start (inclusive) up to end (exclusive).
 * step may be negative; step 0 throws RangeError.
 */
export function range(start, end, step = 1) {
  if (step === 0) throw new RangeError('step must not be 0');
  const out = [];
  if (step > 0) {
    for (let x = start; x < end; x += step) out.push(x);
  } else {
    for (let x = start; x >= end; x += step) out.push(x);
  }
  return out;
}
