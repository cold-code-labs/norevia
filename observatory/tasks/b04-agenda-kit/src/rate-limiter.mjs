/**
 * Token bucket with an injected clock.
 *
 * The bucket starts full (`capacity` tokens) and receives `refillPerSecond` tokens per
 * second continuously (fractions count), never exceeding `capacity`.
 */
export function createTokenBucket({ capacity, refillPerSecond, clock }) {
  if (!(capacity > 0)) throw new RangeError('capacity must be > 0');
  if (!(refillPerSecond > 0)) throw new RangeError('refillPerSecond must be > 0');
  let tokens = capacity;
  let last = clock.now();

  function refill() {
    const now = clock.now();
    if (now > last) {
      tokens += ((now - last) * refillPerSecond) / 1000;
      last = now;
    }
  }

  return {
    /** Consumes `n` tokens if available; returns true/false. n > capacity → RangeError. */
    tryRemove(n = 1) {
      if (n > capacity) throw new RangeError('n exceeds capacity');
      refill();
      if (tokens < n) return false;
      tokens -= n;
      return true;
    },

    /** Tokens available now (may be fractional). */
    available() {
      refill();
      return tokens;
    },

    /** Milliseconds (rounded up) until there are `n` tokens; 0 if there already are. */
    msUntil(n = 1) {
      refill();
      if (tokens >= n) return 0;
      return Math.ceil(((n - tokens) * 1000) / refillPerSecond);
    },
  };
}
