import { MinHeap } from './heap.mjs';
import { buildGraph, cmpStr } from './graph.mjs';

export class CycleError extends Error {
  constructor(cycle) {
    super(`ciclo: ${cycle.join(' -> ')}`);
    this.name = 'CycleError';
    this.cycle = cycle;
  }
}

function minOf(list) {
  let m = list[0];
  for (const x of list) if (x < m) m = x;
  return m;
}

function findCycle(pred, rest) {
  const inRest = new Set(rest);
  const pos = new Map();
  const walk = [];
  let x = minOf(rest);
  while (!pos.has(x)) {
    pos.set(x, walk.length);
    walk.push(x);
    x = minOf([...pred.get(x)].filter((p) => inRest.has(p)));
  }
  const loop = walk.slice(pos.get(x)).reverse();
  const m = loop.indexOf(minOf(loop));
  const rot = loop.slice(m).concat(loop.slice(0, m));
  return [...rot, rot[0]];
}

function kahn(nodes, edges) {
  const { succ, pred } = buildGraph(nodes, edges);
  const indeg = new Map();
  for (const [n, ps] of pred) indeg.set(n, ps.size);
  const heap = new MinHeap(cmpStr);
  for (const [n, d] of indeg) if (d === 0) heap.push(n);
  const order = [];
  while (heap.size) {
    const u = heap.pop();
    order.push(u);
    for (const v of succ.get(u)) {
      const d = indeg.get(v) - 1;
      indeg.set(v, d);
      if (d === 0) heap.push(v);
    }
  }
  return { succ, pred, order };
}

export function topoSort(nodes, edges) {
  const { succ, pred, order } = kahn(nodes, edges);
  if (order.length < succ.size) {
    const done = new Set(order);
    throw new CycleError(findCycle(pred, [...succ.keys()].filter((n) => !done.has(n))));
  }
  return order;
}

export function isDAG(nodes, edges) {
  const { succ, order } = kahn(nodes, edges);
  return order.length === succ.size;
}

export function layers(nodes, edges) {
  const order = topoSort(nodes, edges);
  const { pred } = buildGraph(nodes, edges);
  const level = new Map();
  for (const n of order) {
    let l = 0;
    for (const p of pred.get(n)) l = Math.max(l, level.get(p) + 1);
    level.set(n, l);
  }
  const out = [];
  for (const n of order) {
    const l = level.get(n);
    (out[l] ??= []).push(n);
  }
  return out.map((layer) => layer.sort(cmpStr));
}
