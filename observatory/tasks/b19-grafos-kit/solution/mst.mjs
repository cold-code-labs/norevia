import { cmpStr } from './graph.mjs';

export class UnionFind {
  #parent = new Map();
  #size = new Map();
  #count = 0;

  constructor(items = []) {
    for (const x of items) this.add(x);
  }

  add(x) {
    if (this.#parent.has(x)) return false;
    this.#parent.set(x, x);
    this.#size.set(x, 1);
    this.#count++;
    return true;
  }

  find(x) {
    if (!this.#parent.has(x)) throw new RangeError(`elemento desconhecido: ${x}`);
    let r = x;
    while (this.#parent.get(r) !== r) r = this.#parent.get(r);
    while (x !== r) {
      const next = this.#parent.get(x);
      this.#parent.set(x, r);
      x = next;
    }
    return r;
  }

  union(a, b) {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return false;
    if (this.#size.get(ra) < this.#size.get(rb)) [ra, rb] = [rb, ra];
    this.#parent.set(rb, ra);
    this.#size.set(ra, this.#size.get(ra) + this.#size.get(rb));
    this.#count--;
    return true;
  }

  connected(a, b) {
    return this.find(a) === this.find(b);
  }

  sizeOf(x) {
    return this.#size.get(this.find(x));
  }

  get count() {
    return this.#count;
  }
}

export function kruskal(nodes, edges) {
  if (!Array.isArray(nodes) || !Array.isArray(edges)) throw new TypeError('nodes e edges devem ser arrays');
  const uf = new UnionFind(nodes);
  const list = edges.map((e) => {
    if (e === null || typeof e !== 'object' || typeof e.u !== 'string' || typeof e.v !== 'string') throw new TypeError('aresta inválida');
    if (typeof e.w !== 'number' || !Number.isFinite(e.w)) throw new RangeError(`peso inválido: ${e.w}`);
    uf.add(e.u);
    uf.add(e.v);
    return e.u < e.v ? { u: e.u, v: e.v, w: e.w } : { u: e.v, v: e.u, w: e.w };
  });
  list.sort((x, y) => x.w - y.w || cmpStr(x.u, y.u) || cmpStr(x.v, y.v));
  const chosen = [];
  let weight = 0;
  for (const e of list) {
    const [a, b] = e.u < e.v ? [e.u, e.v] : [e.v, e.u];
    if (a === b) continue;
    if (uf.union(a, b)) {
      chosen.push({ u: a, v: b, w: e.w });
      weight += e.w;
    }
  }
  return { weight, edges: chosen, components: uf.count };
}
