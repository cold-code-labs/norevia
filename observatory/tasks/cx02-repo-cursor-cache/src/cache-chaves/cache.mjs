/**
 * Cache em memória com expiração (TTL) e relógio injetável.
 *
 * O relógio (`now`) devolve milissegundos. O TTL de cada entrada é informado
 * em SEGUNDOS no `set`. Uma entrada gravada no instante `t0` com TTL `s` é
 * válida enquanto `now() < t0 + s * 1000` e deixa de existir a partir daí.
 */
export class TtlCache {
  /**
   * @param {{ now?: () => number }} [options]
   */
  constructor({ now = () => Date.now() } = {}) {
    this.now = now;
    this.entries = new Map();
    this.stats = { hits: 0, misses: 0 };
  }

  #alive(key) {
    const e = this.entries.get(key);
    if (!e) return undefined;
    if (this.now() >= e.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }
    return e;
  }

  /**
   * Grava `value` sob `key` por `ttlSeconds` segundos (número > 0; `Infinity`
   * significa sem expiração). Valor `undefined` não pode ser armazenado.
   */
  set(key, value, ttlSeconds) {
    if (typeof ttlSeconds !== 'number' || Number.isNaN(ttlSeconds) || ttlSeconds <= 0) {
      throw new RangeError(`ttl inválido: ${ttlSeconds}`);
    }
    if (value === undefined) throw new TypeError('valor undefined não pode ser armazenado');
    this.entries.set(key, { value, expiresAt: this.now() + ttlSeconds });
    return this;
  }

  /** Valor vivo sob `key`, ou `undefined`. Atualiza `stats`. */
  get(key) {
    const e = this.#alive(key);
    if (e) this.stats.hits++;
    else this.stats.misses++;
    return e ? e.value : undefined;
  }

  /** Existe entrada viva sob `key`? (não altera `stats`) */
  has(key) {
    return this.#alive(key) !== undefined;
  }

  /** Remove `key`; devolve `true` se havia entrada viva. */
  invalidate(key) {
    const alive = this.#alive(key) !== undefined;
    this.entries.delete(key);
    return alive;
  }

  /** Remove todas as entradas cuja chave começa com `prefix`; devolve quantas estavam vivas. */
  invalidatePrefix(prefix) {
    let n = 0;
    for (const key of [...this.entries.keys()]) {
      if (!key.startsWith(prefix)) continue;
      if (this.#alive(key)) n++;
      this.entries.delete(key);
    }
    return n;
  }

  /** Chaves vivas, em ordem de inserção. */
  keys() {
    return [...this.entries.keys()].filter((k) => this.#alive(k));
  }

  get size() {
    return this.keys().length;
  }
}
