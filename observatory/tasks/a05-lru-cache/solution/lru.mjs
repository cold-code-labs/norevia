/**
 * LRU (least recently used) cache with fixed capacity.
 *
 * - `get(key)` and `set(key, value)` mark the key as the most recently used.
 * - `has(key)` and `peek(key)` do NOT change the usage order.
 * - When inserting a new key with the cache full, the least recently used key is
 *   removed and `onEvict(key, value)` is called (only for capacity
 *   evictions; not for `delete`, `clear` or value update).
 */
export class LRUCache {
  #map = new Map(); // iteration order: least -> most recently used
  #capacity;
  #onEvict;

  constructor(capacity, { onEvict } = {}) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError('capacity must be a positive integer');
    }
    this.#capacity = capacity;
    this.#onEvict = onEvict;
  }

  get size() {
    return this.#map.size;
  }

  get capacity() {
    return this.#capacity;
  }

  has(key) {
    return this.#map.has(key);
  }

  peek(key) {
    return this.#map.get(key);
  }

  get(key) {
    if (!this.#map.has(key)) return undefined;
    const value = this.#map.get(key);
    this.#map.delete(key);
    this.#map.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.#map.has(key)) {
      this.#map.delete(key);
      this.#map.set(key, value);
      return this;
    }
    if (this.#map.size >= this.#capacity) {
      const [oldestKey, oldestValue] = this.#map.entries().next().value;
      this.#map.delete(oldestKey);
      this.#onEvict?.(oldestKey, oldestValue);
    }
    this.#map.set(key, value);
    return this;
  }

  delete(key) {
    return this.#map.delete(key);
  }

  clear() {
    this.#map.clear();
  }

  /** Keys from the least to the most recently used. */
  keys() {
    return [...this.#map.keys()];
  }
}
