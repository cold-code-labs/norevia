import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topoSort, isDAG, layers, CycleError } from '../src/topo.mjs';

const cycleOf = (nodes, edges) => {
  try { topoSort(nodes, edges); } catch (e) { assert.ok(e instanceof CycleError && e instanceof Error); assert.equal(e.name, 'CycleError'); return e.cycle; }
  assert.fail('esperava CycleError');
};

test('ordem lexicográfica por unidades de código e arestas repetidas', () => {
  assert.deepEqual(topoSort(['b', 'a', 'B', 'c'], []), ['B', 'a', 'b', 'c']);
  assert.deepEqual(topoSort([], [['x', 'y'], ['x', 'y'], ['w', 'y']]), ['w', 'x', 'y']);
  assert.deepEqual(topoSort(['z'], [['m', 'a'], ['b', 'a']]), ['b', 'm', 'a', 'z']);
  assert.throws(() => topoSort('a', []), TypeError);
  assert.throws(() => topoSort([], [['a']]), TypeError);
});

test('ciclos de dois nós e laço', () => {
  assert.deepEqual(cycleOf([], [['b', 'a'], ['a', 'b']]), ['a', 'b', 'a']);
  assert.deepEqual(cycleOf(['a'], [['a', 'q'], ['q', 'q']]), ['q', 'q']);
});

test('ciclo canônico com nós pendurados', () => {
  assert.deepEqual(cycleOf([], [['x', 'y'], ['y', 'z'], ['z', 'x'], ['z', 'a']]), ['x', 'y', 'z', 'x']);
  assert.deepEqual(cycleOf([], [['p', 'q'], ['q', 'r'], ['r', 's'], ['s', 'p'], ['r', 'b']]), ['p', 'q', 'r', 's', 'p']);
});

test('ciclo escolhido pelo menor predecessor', () => {
  const E = [['a', 'c'], ['c', 'e'], ['e', 'a'], ['b', 'c'], ['c', 'd'], ['d', 'b']];
  assert.deepEqual(cycleOf([], E), ['a', 'c', 'e', 'a']);
  const F = [['m', 'n'], ['n', 'm'], ['k', 'o'], ['o', 'l'], ['l', 'k'], ['n', 'k']];
  assert.deepEqual(cycleOf([], F), ['k', 'o', 'l', 'k']);
});

test('isDAG e layers', () => {
  assert.equal(isDAG([], [['a', 'b'], ['b', 'c']]), true);
  assert.equal(isDAG([], [['a', 'b'], ['b', 'a']]), false);
  assert.deepEqual(layers(['e'], [['a', 'c'], ['b', 'c'], ['c', 'd'], ['a', 'd']]), [['a', 'b', 'e'], ['c'], ['d']]);
  assert.throws(() => layers([], [['a', 'b'], ['b', 'c'], ['c', 'b']]), (e) => e instanceof CycleError && JSON.stringify(e.cycle) === '["b","c","b"]');
});
