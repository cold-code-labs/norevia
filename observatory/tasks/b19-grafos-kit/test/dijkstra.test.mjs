import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shortestPath, distances, comparePaths } from '../src/dijkstra.mjs';

const E = (...xs) => xs.map(([from, to, w]) => ({ from, to, w }));

test('caminho mínimo, inalcançável e origem = destino', () => {
  const g = E(['s', 'a', 7], ['s', 'b', 2], ['b', 'a', 3], ['a', 'c', 1], ['b', 'c', 9], ['c', 'd', 2]);
  assert.deepEqual(shortestPath(g, 's', 'd'), { cost: 8, path: ['s', 'b', 'a', 'c', 'd'] });
  assert.equal(shortestPath(g, 'd', 's'), null);
  assert.deepEqual(shortestPath(g, 'zz', 'zz'), { cost: 0, path: ['zz'] });
  assert.throws(() => shortestPath(E(['a', 'b', -1]), 'a', 'b'), RangeError);
  assert.throws(() => shortestPath(E(['a', 'b', NaN]), 'a', 'b'), RangeError);
  assert.throws(() => shortestPath([{ from: 'a', to: 1, w: 1 }], 'a', 'b'), TypeError);
});

test('empate de custo: menos arestas', () => {
  assert.deepEqual(shortestPath(E(['s', 'a', 1], ['a', 't', 1], ['s', 't', 2]), 's', 't').path, ['s', 't']);
  assert.deepEqual(shortestPath(E(['s', 'a', 0], ['a', 'b', 0], ['b', 't', 0], ['s', 'z', 0], ['z', 't', 0]), 's', 't').path, ['s', 'z', 't']);
});

test('empate de custo e arestas: menor sequência lexicográfica', () => {
  assert.deepEqual(shortestPath(E(['s', 'b', 1], ['b', 't', 1], ['s', 'a', 1], ['a', 't', 1]), 's', 't').path, ['s', 'a', 't']);
  const g = E(['s', 'a', 1], ['s', 'b', 1], ['a', 'y', 1], ['b', 'x', 1], ['y', 't', 1], ['x', 't', 1]);
  assert.deepEqual(shortestPath(g, 's', 't'), { cost: 3, path: ['s', 'a', 'y', 't'] });
});

test('desempate lexicográfico com custos parciais diferentes', () => {
  const g = E(['s', 'm', 2], ['s', 'c', 1], ['m', 'v', 1], ['c', 'q', 1], ['q', 'v', 1], ['s', 'p', 1], ['p', 'v', 2], ['v', 'w', 5]);
  assert.deepEqual(shortestPath(g, 's', 'v'), { cost: 3, path: ['s', 'm', 'v'] });
  const h = E(['s', 'b', 1], ['s', 'a', 2], ['b', 'y', 1], ['a', 'z', 0], ['y', 't', 1], ['z', 't', 1], ['t', 'u', 1]);
  assert.deepEqual(shortestPath(h, 's', 'u'), { cost: 4, path: ['s', 'a', 'z', 't', 'u'] });
});

test('distances e comparePaths', () => {
  const g = E(['s', 'a', 7], ['s', 'b', 2], ['b', 'a', 3], ['x', 's', 1]);
  assert.deepEqual(distances(g, 's'), { s: 0, b: 2, a: 5 });
  assert.ok(comparePaths(['s', 'a', 'z'], ['s', 'b', 'a']) < 0);
  assert.ok(comparePaths(['s', 'b'], ['s', 'a', 'a']) > 0);
  assert.ok(comparePaths(['s'], ['s', 'a']) < 0);
  assert.equal(comparePaths(['s', 'a'], ['s', 'a']), 0);
});

test('arestas de peso zero: menos arestas mesmo descobertas depois', () => {
  const g = E(['s', 'r', 5], ['r', 'u', 0], ['u', 'v', 0], ['s', 'p', 0], ['p', 'q', 0], ['q', 't', 0], ['t', 'v', 5], ['v', 'w', 1]);
  assert.deepEqual(shortestPath(g, 's', 'v'), { cost: 5, path: ['s', 'r', 'u', 'v'] });
  assert.deepEqual(shortestPath(g, 's', 'w'), { cost: 6, path: ['s', 'r', 'u', 'v', 'w'] });
  assert.deepEqual(distances(g, 's'), { s: 0, r: 5, u: 5, v: 5, p: 0, q: 0, t: 0, w: 6 });
});

test('arestas de peso zero: segundo caso', () => {
  const g = E(['s', 'k', 3], ['k', 'm', 0], ['s', 'b', 0], ['b', 'c', 0], ['c', 'n', 3], ['m', 'z', 0], ['n', 'z', 0]);
  assert.deepEqual(shortestPath(g, 's', 'z'), { cost: 3, path: ['s', 'k', 'm', 'z'] });
  const h = E(['s', 'a', 0], ['a', 'b', 0], ['b', 'c', 2], ['s', 'x', 2], ['x', 'c', 0], ['c', 'd', 0]);
  assert.deepEqual(shortestPath(h, 's', 'd'), { cost: 2, path: ['s', 'x', 'c', 'd'] });
});
