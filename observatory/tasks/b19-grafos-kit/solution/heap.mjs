/**
 * Fila de prioridade mínima (heap binário) com desempate FIFO: entre elementos que o
 * comparador considera iguais, sai primeiro o que entrou antes.
 */

/** Comparador padrão: `<` / `>` do JavaScript. */
export function defaultCompare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export class MinHeap {
  #a = [];
  #seq = 0;
  #cmp;

  constructor(compare = defaultCompare, items = []) {
    if (typeof compare !== 'function') throw new TypeError('compare deve ser uma função');
    if (!Array.isArray(items)) throw new TypeError('items deve ser um array');
    this.#cmp = compare;
    for (const v of items) this.#a.push({ v, s: this.#seq++ });
    for (let i = (this.#a.length >> 1) - 1; i >= 0; i--) this.#down(i);
  }

  get size() {
    return this.#a.length;
  }

  #less(x, y) {
    const c = this.#cmp(x.v, y.v);
    return c < 0 || (c === 0 && x.s < y.s);
  }

  #up(i) {
    const a = this.#a;
    const e = a[i];
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.#less(e, a[p])) break;
      a[i] = a[p];
      i = p;
    }
    a[i] = e;
  }

  #down(i) {
    const a = this.#a;
    const n = a.length;
    const e = a[i];
    for (;;) {
      let c = 2 * i + 1;
      if (c >= n) break;
      if (c + 1 < n && this.#less(a[c + 1], a[c])) c++;
      if (!this.#less(a[c], e)) break;
      a[i] = a[c];
      i = c;
    }
    a[i] = e;
  }

  push(v) {
    this.#a.push({ v, s: this.#seq++ });
    this.#up(this.#a.length - 1);
    return this;
  }

  peek() {
    return this.#a.length ? this.#a[0].v : undefined;
  }

  pop() {
    const a = this.#a;
    if (!a.length) return undefined;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      this.#down(0);
    }
    return top.v;
  }

  replace(v) {
    const a = this.#a;
    if (!a.length) {
      this.push(v);
      return undefined;
    }
    const top = a[0];
    a[0] = { v, s: this.#seq++ };
    this.#down(0);
    return top.v;
  }

  pushPop(v) {
    const a = this.#a;
    const e = { v, s: this.#seq++ };
    if (a.length && this.#less(a[0], e)) {
      const top = a[0];
      a[0] = e;
      this.#down(0);
      return top.v;
    }
    return v;
  }

  toArray() {
    const copy = this.#a.slice().sort((x, y) => (this.#less(x, y) ? -1 : 1));
    return copy.map((e) => e.v);
  }

  clear() {
    this.#a = [];
  }
}

/** Ordenação estável via heap; não altera `items`. */
export function heapSort(items, compare = defaultCompare) {
  const h = new MinHeap(compare, items);
  const out = [];
  while (h.size) out.push(h.pop());
  return out;
}

/** Os `k` menores elementos, em ordem crescente (estável). */
export function nSmallest(items, k, compare = defaultCompare) {
  if (!Number.isInteger(k) || k < 0) throw new RangeError('k inválido');
  const h = new MinHeap(compare, items);
  const out = [];
  while (h.size && out.length < k) out.push(h.pop());
  return out;
}
