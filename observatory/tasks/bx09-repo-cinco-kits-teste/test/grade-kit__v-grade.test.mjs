import { test } from 'node:test';
import assert from 'node:assert/strict';
import { multiply } from '../src/grade-kit/matrix.mjs';
import { Grid } from '../src/grade-kit/grid.mjs';
import { floodFill } from '../src/grade-kit/flood.mjs';
import { encodeRow } from '../src/grade-kit/rle.mjs';

test('multiply 2x3 por 3x1', () => {
  assert.deepEqual(multiply([[1, 0, 2], [0, 1, 0]], [[3], [4], [5]]), [[13], [4]]);
});
test('Grid.get', () => {
  assert.equal(new Grid(['#.', '.#']).get(1, 1), '#');
});
test('floodFill preserva a grade original', () => {
  const mapa = [['.', '.'], ['#', '.']];
  const pintado = floodFill(mapa, 0, 0, '~');
  assert.deepEqual(pintado, [['~', '~'], ['#', '~']]);
  assert.deepEqual(mapa, [['.', '.'], ['#', '.']]);
});
test('encodeRow', () => {
  assert.equal(encodeRow('..##.'), '2.2#.');
});
