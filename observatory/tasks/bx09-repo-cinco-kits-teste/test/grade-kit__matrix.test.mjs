import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shape, identity, transpose, add, multiply, power } from '../src/grade-kit/matrix.mjs';

test('shape', () => {
  assert.deepEqual(shape([[1, 2, 3], [4, 5, 6]]), [2, 3]);
  assert.deepEqual(shape([]), [0, 0]);
  assert.throws(() => shape([[1, 2], [3]]), RangeError);
});
test('identity e transpose', () => {
  assert.deepEqual(identity(3), [[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
  const m = [[1, 2, 3], [4, 5, 6]];
  assert.deepEqual(transpose(m), [[1, 4], [2, 5], [3, 6]]);
  assert.deepEqual(m, [[1, 2, 3], [4, 5, 6]]);
});
test('add', () => {
  assert.deepEqual(add([[1, 2]], [[10, 20]]), [[11, 22]]);
  assert.throws(() => add([[1, 2]], [[1], [2]]), RangeError);
});
test('multiply quadradas', () => {
  assert.deepEqual(multiply([[1, 2], [3, 4]], [[5, 6], [7, 8]]), [[19, 22], [43, 50]]);
});
test('multiply retangulares', () => {
  assert.deepEqual(multiply([[1, 2, 3], [4, 5, 6]], [[7, 8], [9, 10], [11, 12]]), [[58, 64], [139, 154]]);
  assert.deepEqual(multiply([[1], [2], [3]], [[4, 5, 6]]), [[4, 5, 6], [8, 10, 12], [12, 15, 18]]);
  assert.deepEqual(multiply([[1, 2, 3]], [[1], [1], [1]]), [[6]]);
});
test('multiply com dimensões incompatíveis', () => {
  assert.throws(() => multiply([[1, 2, 3], [4, 5, 6]], [[1, 2, 3], [4, 5, 6]]), RangeError);
  assert.throws(() => multiply([[1, 2], [3, 4]], [[1, 2], [3, 4], [5, 6]]), RangeError);
});
test('power', () => {
  assert.deepEqual(power([[1, 1], [1, 0]], 5), [[8, 5], [5, 3]]);
  assert.deepEqual(power([[2, 3], [4, 5]], 0), identity(2));
  assert.throws(() => power([[1, 2, 3]], 2), RangeError);
});
