import { buildGraph, cmpStr } from './graph.mjs';

function finishOrder(succ) {
  const seen = new Set();
  const order = [];
  for (const s of [...succ.keys()].sort(cmpStr)) {
    if (seen.has(s)) continue;
    seen.add(s);
    const stack = [[s, [...succ.get(s)].sort(cmpStr), 0]];
    while (stack.length) {
      const top = stack[stack.length - 1];
      const [v, nbrs, i] = top;
      if (i < nbrs.length) {
        top[2]++;
        const w = nbrs[i];
        if (!seen.has(w)) {
          seen.add(w);
          stack.push([w, [...succ.get(w)].sort(cmpStr), 0]);
        }
      } else {
        stack.pop();
        order.push(v);
      }
    }
  }
  return order;
}

export function scc(nodes, edges) {
  const { succ, pred } = buildGraph(nodes, edges);
  const order = finishOrder(succ);
  const comp = new Map();
  const comps = [];
  for (let k = order.length - 1; k >= 0; k--) {
    const s = order[k];
    if (comp.has(s)) continue;
    const members = [];
    const stack = [s];
    comp.set(s, comps.length);
    while (stack.length) {
      const v = stack.pop();
      members.push(v);
      for (const p of pred.get(v)) {
        if (!comp.has(p)) {
          comp.set(p, comps.length);
          stack.push(p);
        }
      }
    }
    comps.push(members);
  }
  return comps.map((c) => c.sort(cmpStr)).sort((x, y) => cmpStr(x[0], y[0]));
}

export function condensation(nodes, edges) {
  const components = scc(nodes, edges);
  const { succ } = buildGraph(nodes, edges);
  const idx = new Map();
  components.forEach((c, i) => c.forEach((n) => idx.set(n, i)));
  const seen = new Set();
  const out = [];
  for (const [u, vs] of succ) {
    for (const v of vs) {
      const i = idx.get(u);
      const j = idx.get(v);
      if (i === j || seen.has(i + j)) continue;
      seen.add(i + j);
      out.push([i, j]);
    }
  }
  out.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  return { components, edges: out };
}
