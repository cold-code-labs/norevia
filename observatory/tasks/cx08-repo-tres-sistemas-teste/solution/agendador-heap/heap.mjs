/**
 * Heap binário genérico.
 *
 * O comparador segue a mesma convenção de `Array.prototype.sort`:
 * `cmp(a, b) < 0` significa que `a` vem antes de `b`. `peek()`/`pop()`
 * devolvem sempre o elemento que viria primeiro numa ordenação com `cmp`.
 */

export function defaultCompare(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export class Heap {
  /** @param {(a:any, b:any) => number} [cmp] */
  constructor(cmp = defaultCompare) {
    if (typeof cmp !== 'function') throw new TypeError('cmp deve ser uma função');
    this.cmp = cmp;
    this.items = [];
  }

  /** Constrói um heap a partir de um iterável em O(n). */
  static from(iterable, cmp = defaultCompare) {
    const h = new Heap(cmp);
    h.items = Array.from(iterable);
    for (let i = (h.items.length >> 1) - 1; i >= 0; i--) h.siftDown(i);
    return h;
  }

  get size() {
    return this.items.length;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  /** Primeiro elemento sem removê-lo (`undefined` se vazio). */
  peek() {
    return this.items[0];
  }

  /** Insere um ou mais valores; devolve o novo tamanho. */
  push(...values) {
    for (const v of values) {
      this.items.push(v);
      this.siftUp(this.items.length - 1);
    }
    return this.items.length;
  }

  /** Remove e devolve o primeiro elemento (`undefined` se vazio). */
  pop() {
    const items = this.items;
    if (items.length === 0) return undefined;
    const top = items[0];
    const last = items.pop();
    if (items.length > 0) {
      items[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  /** Cópia ordenada do conteúdo, sem alterar o heap. */
  toSortedArray() {
    const copy = new Heap(this.cmp);
    copy.items = this.items.slice();
    const out = [];
    while (!copy.isEmpty()) out.push(copy.pop());
    return out;
  }

  siftUp(i) {
    const items = this.items;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.cmp(items[i], items[parent]) >= 0) break;
      [items[i], items[parent]] = [items[parent], items[i]];
      i = parent;
    }
  }

  siftDown(i) {
    const items = this.items;
    const n = items.length;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let best = i;
      if (l < n && this.cmp(items[l], items[best]) < 0) best = l;
      if (r < n && this.cmp(items[r], items[best]) < 0) best = r;
      if (best === i) return;
      [items[i], items[best]] = [items[best], items[i]];
      i = best;
    }
  }
}
