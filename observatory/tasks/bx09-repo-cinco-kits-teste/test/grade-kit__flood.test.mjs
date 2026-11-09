import { test } from 'node:test';
import assert from 'node:assert/strict';
import { floodFill, regionSize, countRegions } from '../src/grade-kit/flood.mjs';

const make = () => [[1, 1, 0], [1, 0, 0], [0, 1, 1]];

test('floodFill preenche a região 4-conectada', () => {
  assert.deepEqual(floodFill(make(), 0, 0, 7), [[7, 7, 0], [7, 0, 0], [0, 1, 1]]);
});
test('diagonais não conectam', () => {
  assert.deepEqual(floodFill(make(), 1, 1, 5), [[1, 1, 5], [1, 5, 5], [0, 1, 1]]);
});
test('floodFill não altera a entrada', () => {
  const cells = make();
  floodFill(cells, 0, 0, 7);
  assert.deepEqual(cells, make());
});
test('mesmo valor devolve cópia independente', () => {
  const cells = make();
  const r = floodFill(cells, 0, 0, 1);
  assert.deepEqual(r, make());
  assert.notEqual(r, cells);
  assert.notEqual(r[0], cells[0]);
});
test('início fora da grade', () => {
  assert.throws(() => floodFill(make(), 3, 0, 1), RangeError);
  assert.throws(() => regionSize(make(), 0, -1), RangeError);
});
test('regionSize não altera a entrada', () => {
  const cells = make();
  assert.equal(regionSize(cells, 0, 0), 3);
  assert.equal(regionSize(cells, 2, 1), 2);
  assert.deepEqual(cells, make());
});
test('countRegions', () => {
  assert.equal(countRegions(make()), 4);
  assert.equal(countRegions([]), 0);
  assert.equal(countRegions([['a', 'a'], ['a', 'a']]), 1);
});
