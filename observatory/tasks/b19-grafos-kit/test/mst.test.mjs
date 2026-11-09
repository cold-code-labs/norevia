import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UnionFind, kruskal } from '../src/mst.mjs';

const E = (...xs) => xs.map(([u, v, w]) => ({ u, v, w }));
const fmt = (r) => r.edges.map((e) => `${e.u}${e.v}${e.w}`).join(' ');

test('UnionFind', () => {
  const uf = new UnionFind(['a', 'b', 'c', 'd']);
  assert.equal(uf.count, 4);
  assert.equal(uf.union('a', 'b'), true);
  assert.equal(uf.union('c', 'd'), true);
  assert.equal(uf.union('b', 'a'), false);
  assert.equal(uf.union('b', 'd'), true);
  assert.equal(uf.connected('a', 'c'), true);
  assert.equal(uf.sizeOf('d'), 4);
  assert.equal(uf.count, 1);
  assert.equal(uf.add('a'), false);
  assert.equal(uf.add('e'), true);
  assert.throws(() => uf.find('zz'), RangeError);
});

test('kruskal com pesos distintos e floresta', () => {
  const r = kruskal(['z'], E(['a', 'b', 4], ['b', 'c', 1], ['a', 'c', 3], ['c', 'd', 2], ['x', 'y', 5], ['d', 'd', 0]));
  assert.equal(fmt(r), 'bc1 cd2 ac3 xy5');
  assert.equal(r.weight, 11);
  assert.equal(r.components, 3);
  assert.throws(() => kruskal([], E(['a', 'b', Infinity])), RangeError);
  assert.throws(() => kruskal([], [{ u: 'a', w: 1 }]), TypeError);
});

test('arestas já normalizadas e empatadas', () => {
  const r = kruskal([], E(['b', 'c', 1], ['a', 'c', 1], ['a', 'b', 1]));
  assert.equal(fmt(r), 'ab1 ac1');
});

test('empate usa (min(u,v), max(u,v))', () => {
  const r = kruskal([], E(['c', 'a', 1], ['b', 'a', 1], ['b', 'c', 1]));
  assert.equal(fmt(r), 'ab1 ac1');
  const s = kruskal([], E(['d', 'a', 2], ['b', 'c', 2], ['c', 'a', 2], ['b', 'd', 2]));
  assert.equal(fmt(s), 'ac2 ad2 bc2');
  assert.equal(s.weight, 6);
});
