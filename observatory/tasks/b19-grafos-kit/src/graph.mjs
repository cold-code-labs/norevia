/** Construção e validação de grafos dirigidos simples, usados por topo.mjs e scc.mjs. */

export function cmpStr(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * `nodes`: array de strings; `edges`: array de pares `[u, v]` (aresta u → v).
 * Nós citados só em arestas também entram; nós e arestas repetidos contam uma vez.
 */
export function buildGraph(nodes, edges) {
  if (!Array.isArray(nodes) || !Array.isArray(edges)) throw new TypeError('nodes e edges devem ser arrays');
  const succ = new Map();
  const pred = new Map();
  const add = (n) => {
    if (typeof n !== 'string') throw new TypeError(`nó inválido: ${n}`);
    if (!succ.has(n)) {
      succ.set(n, new Set());
      pred.set(n, new Set());
    }
  };
  for (const n of nodes) add(n);
  for (const e of edges) {
    if (!Array.isArray(e) || e.length !== 2) throw new TypeError('aresta deve ser [u, v]');
    add(e[0]);
    add(e[1]);
    succ.get(e[0]).add(e[1]);
    pred.get(e[1]).add(e[0]);
  }
  return { succ, pred };
}
