import { MinHeap } from './heap.mjs';

export function comparePaths(p, q) {
  const n = Math.min(p.length, q.length);
  for (let i = 0; i < n; i++) {
    if (p[i] < q[i]) return -1;
    if (p[i] > q[i]) return 1;
  }
  return p.length - q.length;
}

function pathTo(pred, v) {
  const out = [];
  for (let x = v; x !== null; x = pred.get(x)) out.push(x);
  return out.reverse();
}

function adjacency(edges) {
  if (!Array.isArray(edges)) throw new TypeError('edges deve ser um array');
  const adj = new Map();
  for (const e of edges) {
    if (e === null || typeof e !== 'object' || typeof e.from !== 'string' || typeof e.to !== 'string') throw new TypeError('aresta inválida');
    if (typeof e.w !== 'number' || !Number.isFinite(e.w) || e.w < 0) throw new RangeError(`peso inválido: ${e.w}`);
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from).push({ to: e.to, w: e.w });
  }
  return adj;
}

function run(edges, source) {
  if (typeof source !== 'string') throw new TypeError('source deve ser string');
  const adj = adjacency(edges);
  const dist = new Map([[source, 0]]);
  const hops = new Map([[source, 0]]);
  const pred = new Map([[source, null]]);
  const done = new Set();
  const heap = new MinHeap((a, b) => a[0] - b[0] || a[1] - b[1], [[0, 0, source]]);
  while (heap.size) {
    const [d, h, u] = heap.pop();
    if (done.has(u)) continue;
    done.add(u);
    for (const { to: v, w } of adj.get(u) ?? []) {
      if (done.has(v)) continue;
      const nd = d + w;
      const nh = h + 1;
      const od = dist.get(v);
      let better = od === undefined || nd < od || (nd === od && nh < hops.get(v));
      if (!better && nd === od && nh === hops.get(v)) better = comparePaths(pathTo(pred, u), pathTo(pred, pred.get(v))) < 0;
      if (better) {
        dist.set(v, nd);
        hops.set(v, nh);
        pred.set(v, u);
        heap.push([nd, nh, v]);
      }
    }
  }
  return { dist, pred };
}

export function shortestPath(edges, source, target) {
  if (typeof target !== 'string') throw new TypeError('target deve ser string');
  const { dist, pred } = run(edges, source);
  if (!dist.has(target)) return null;
  return { cost: dist.get(target), path: pathTo(pred, target) };
}

export function distances(edges, source) {
  const { dist } = run(edges, source);
  return Object.fromEntries(dist);
}
