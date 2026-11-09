import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scc, condensation } from '../src/scc.mjs';

test('ciclo único e nós isolados', () => {
  assert.deepEqual(scc(['z'], [['c', 'a'], ['a', 'b'], ['b', 'c']]), [['a', 'b', 'c'], ['z']]);
  assert.deepEqual(scc(['b', 'a'], []), [['a'], ['b']]);
});

test('DAG: cada nó é uma componente', () => {
  assert.deepEqual(scc([], [['a', 'b'], ['b', 'c'], ['a', 'c']]), [['a'], ['b'], ['c']]);
});

test('componentes encadeadas', () => {
  assert.deepEqual(scc([], [['a', 'b'], ['b', 'c'], ['c', 'b']]), [['a'], ['b', 'c']]);
  const E = [['a', 'b'], ['b', 'a'], ['b', 'c'], ['c', 'd'], ['d', 'e'], ['e', 'c'], ['e', 'f'], ['g', 'f'], ['f', 'g'], ['h', 'a']];
  assert.deepEqual(scc([], E), [['a', 'b'], ['c', 'd', 'e'], ['f', 'g'], ['h']]);
});

test('condensation', () => {
  const E = [['a', 'b'], ['b', 'a'], ['b', 'c'], ['a', 'c'], ['c', 'd'], ['d', 'c'], ['x', 'a']];
  assert.deepEqual(condensation([], E), { components: [['a', 'b'], ['c', 'd'], ['x']], edges: [[0, 1], [2, 0]] });
});

test('condensation não perde arestas entre componentes distintas', () => {
  assert.deepEqual(condensation([], [['a', 'd'], ['b', 'c']]), { components: [['a'], ['b'], ['c'], ['d']], edges: [[0, 3], [1, 2]] });
  const E = [['a', 'e'], ['b', 'd'], ['c', 'c'], ['e', 'f'], ['f', 'e'], ['b', 'c'], ['a', 'b']];
  assert.deepEqual(condensation([], E), { components: [['a'], ['b'], ['c'], ['d'], ['e', 'f']], edges: [[0, 1], [0, 4], [1, 2], [1, 3]] });
});
