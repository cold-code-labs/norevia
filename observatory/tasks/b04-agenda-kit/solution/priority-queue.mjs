/**
 * Priority queue (binary min-heap).
 *
 * `compare(a, b)` follows the Array#sort convention: negative if `a` comes out before `b`.
 * Elements that the comparator considers equal come out in insertion order (FIFO).
 */
export class PriorityQueue {
  #heap = [];
  #seq = 0;
  #compare;

  constructor(compare = (a, b) => a - b) {
    this.#compare = compare;
  }

  get size() {
    return this.#heap.length;
  }

  push(value) {
    this.#heap.push({ value, seq: this.#seq++ });
    this.#up(this.#heap.length - 1);
    return this.size;
  }

  /** Smallest element without removing it; empty queue → undefined. */
  peek() {
    return this.#heap[0]?.value;
  }

  /** Removes and returns the smallest element; empty queue → undefined. */
  pop() {
    const h = this.#heap;
    if (h.length === 0) return undefined;
    const top = h[0];
    const last = h.pop();
    if (h.length > 0) {
      h[0] = last;
      this.#down(0);
    }
    return top.value;
  }

  /** Empties the queue returning all elements in output order. */
  drain() {
    const out = [];
    while (this.size > 0) out.push(this.pop());
    return out;
  }

  #less(i, j) {
    const a = this.#heap[i];
    const b = this.#heap[j];
    const c = this.#compare(a.value, b.value);
    return c < 0 || (c === 0 && a.seq < b.seq);
  }

  #swap(i, j) {
    [this.#heap[i], this.#heap[j]] = [this.#heap[j], this.#heap[i]];
  }

  #up(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.#less(i, parent)) break;
      this.#swap(i, parent);
      i = parent;
    }
  }

  #down(i) {
    const n = this.#heap.length;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < n && this.#less(l, m)) m = l;
      if (r < n && this.#less(r, m)) m = r;
      if (m === i) return;
      this.#swap(i, m);
      i = m;
    }
  }
}
