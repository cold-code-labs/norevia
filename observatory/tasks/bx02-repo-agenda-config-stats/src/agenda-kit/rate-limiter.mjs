/**
 * Token bucket com relógio injetado.
 *
 * O balde começa cheio (`capacity` fichas) e recebe `refillPerSecond` fichas por
 * segundo de forma contínua (frações contam), nunca passando de `capacity`.
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
    /** Consome `n` fichas se houver; devolve true/false. n > capacity → RangeError. */
    tryRemove(n = 1) {
      if (n > capacity) throw new RangeError('n exceeds capacity');
      refill();
      if (tokens < n) return false;
      tokens -= n;
      return true;
    },

    /** Fichas disponíveis agora (pode ser fracionário). */
    available() {
      refill();
      return tokens;
    },

    /** Milissegundos (arredondados para cima) até haver `n` fichas; 0 se já houver. */
    msUntil(n = 1) {
      refill();
      if (tokens >= n) return 0;
      return Math.ceil(((n - tokens) * 1000) / refillPerSecond);
    },
  };
}
