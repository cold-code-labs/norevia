/**
 * Token bucket rate limiter, with an injected clock.
 *
 * The bucket starts full (`capacity` tokens) and is refilled continuously at
 * `refillPerSecond` tokens per second, with fractions accumulating, up to the limit
 * `capacity`. The clock `now()` returns milliseconds and is assumed to be non-
 * decreasing.
 */
export function createTokenBucket({ capacity, refillPerSecond, now }) {
  if (!(typeof capacity === 'number' && capacity > 0 && Number.isFinite(capacity))) {
    throw new RangeError('capacity must be a positive finite number');
  }
  if (!(typeof refillPerSecond === 'number' && refillPerSecond > 0 && Number.isFinite(refillPerSecond))) {
    throw new RangeError('refillPerSecond must be a positive finite number');
  }
  if (typeof now !== 'function') throw new TypeError('now must be a function');

  let tokens = capacity;
  let last = now();

  function refill() {
    if (tokens >= capacity) return;
    const t = now();
    const elapsed = t - last;
    last = t;
    if (elapsed <= 0) return;
    tokens = Math.min(capacity, tokens + (elapsed * refillPerSecond) / 1000);
  }

  function checkAmount(n) {
    if (!(typeof n === 'number' && n > 0 && Number.isFinite(n))) {
      throw new RangeError('n must be a positive finite number');
    }
  }

  return {
    /** Consumes `n` tokens if available; otherwise consumes nothing. */
    tryTake(n = 1) {
      checkAmount(n);
      refill();
      if (tokens < n) return false;
      tokens -= n;
      return true;
    },

    /** Whole tokens available now. */
    available() {
      refill();
      return Math.floor(tokens);
    },

    /** Milliseconds (rounded up) until there are `n` tokens. */
    msUntil(n = 1) {
      checkAmount(n);
      if (n > capacity) return Infinity;
      refill();
      if (tokens >= n) return 0;
      return Math.ceil(((n - tokens) * 1000) / refillPerSecond);
    },
  };
}
