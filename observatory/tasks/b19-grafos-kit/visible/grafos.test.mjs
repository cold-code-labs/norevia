import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topoSort, CycleError } from '../src/topo.mjs';
import { shortestPath } from '../src/dijkstra.mjs';

test('topoSort emite sempre o menor nó disponível', () => {
  assert.deepEqual(topoSort(['d', 'c', 'b', 'a'], [['c', 'a'], ['d', 'b']]), ['c', 'a', 'd', 'b']);
});

test('ciclo de três nós é reportado no sentido das arestas', () => {
  assert.throws(() => topoSort([], [['a', 'b'], ['b', 'c'], ['c', 'a']]), (e) => e instanceof CycleError && JSON.stringify(e.cycle) === '["a","b","c","a"]');
});

test('shortestPath simples', () => {
  const E = [{ from: 's', to: 'a', w: 4 }, { from: 's', to: 'b', w: 1 }, { from: 'b', to: 'a', w: 2 }, { from: 'a', to: 't', w: 1 }];
  assert.deepEqual(shortestPath(E, 's', 't'), { cost: 4, path: ['s', 'b', 'a', 't'] });
});
