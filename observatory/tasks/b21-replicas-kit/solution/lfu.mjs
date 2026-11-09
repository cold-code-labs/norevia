/** Cache LFU: despeja o de menor frequência; empate → o usado há mais tempo. */
export class LFUCache {
  #cap;
  #items = new Map();
  #buckets = new Map();
  #min = 0;

  constructor(capacity) {
    if (!Number.isInteger(capacity) || capacity < 0) throw new RangeError(`capacidade inválida: ${capacity}`);
    this.#cap = capacity;
  }

  get size() {
    return this.#items.size;
  }

  get capacity() {
    return this.#cap;
  }

  #bucket(f) {
    let b = this.#buckets.get(f);
    if (!b) {
      b = new Set();
      this.#buckets.set(f, b);
    }
    return b;
  }

  #unlink(key, f) {
    const b = this.#buckets.get(f);
    b.delete(key);
    if (b.size === 0) {
      this.#buckets.delete(f);
      if (this.#min === f) this.#min = f + 1;
    }
  }

  #touch(key) {
    const e = this.#items.get(key);
    this.#unlink(key, e.freq);
    e.freq++;
    this.#bucket(e.freq).add(key);
  }

  #evict() {
    let b = this.#buckets.get(this.#min);
    if (!b) {
      this.#min = Math.min(...this.#buckets.keys());
      b = this.#buckets.get(this.#min);
    }
    const victim = b.values().next().value;
    this.#unlink(victim, this.#min);
    this.#items.delete(victim);
    return victim;
  }

  get(key) {
    const e = this.#items.get(key);
    if (!e) return undefined;
    this.#touch(key);
    return e.value;
  }

  peek(key) {
    return this.#items.get(key)?.value;
  }

  has(key) {
    return this.#items.has(key);
  }

  frequency(key) {
    return this.#items.get(key)?.freq ?? 0;
  }

  set(key, value) {
    if (this.#cap === 0) return undefined;
    const e = this.#items.get(key);
    if (e) {
      e.value = value;
      this.#touch(key);
      return undefined;
    }
    const evicted = this.#items.size >= this.#cap ? this.#evict() : undefined;
    this.#items.set(key, { value, freq: 1 });
    this.#bucket(1).add(key);
    this.#min = 1;
    return evicted;
  }

  delete(key) {
    const e = this.#items.get(key);
    if (!e) return false;
    this.#unlink(key, e.freq);
    this.#items.delete(key);
    return true;
  }

  evictionOrder() {
    const freqs = [...this.#buckets.keys()].sort((x, y) => x - y);
    return freqs.flatMap((f) => [...this.#buckets.get(f)]);
  }
}
