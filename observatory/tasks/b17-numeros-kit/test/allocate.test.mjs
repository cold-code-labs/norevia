import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allocate, splitEvenly, allocateMoney } from '../src/allocate.mjs';

test('rateio básico', () => {
  assert.deepEqual(allocate(100, [1, 1, 1]), [34, 33, 33]);
  assert.deepEqual(allocate(100, [50, 30, 20]), [50, 30, 20]);
  assert.deepEqual(allocate(10, [0, 5, 5]), [0, 5, 5]);
  assert.deepEqual(allocate(7, [1, 1, 1, 1]), [2, 2, 2, 1]);
  assert.deepEqual(allocate(0, [3, 1]), [0, 0]);
  assert.deepEqual(splitEvenly(10, 3), [4, 3, 3]);
});

test('validação', () => {
  assert.throws(() => allocate(1.5, [1]), RangeError);
  assert.throws(() => allocate(10, []), RangeError);
  assert.throws(() => allocate(10, [0, 0]), RangeError);
  assert.throws(() => allocate(10, [1, -1]), RangeError);
  assert.throws(() => splitEvenly(10, 0), RangeError);
});

test('restos iguais desempatam pelo menor índice', () => {
  assert.deepEqual(allocate(3, [1, 7, 1]), [1, 2, 0]);
  assert.deepEqual(allocate(2, [1, 7, 2]), [0, 2, 0]);
  assert.deepEqual(allocate(3, [4, 4, 1]), [2, 1, 0]);
  assert.deepEqual(allocate(4, [1, 4, 1]), [1, 3, 0]);
});

test('total negativo e valores monetários', () => {
  assert.deepEqual(allocate(-3, [1, 7, 1]), [-1, -2, 0]);
  assert.deepEqual(allocate(-100, [1, 1, 1]), [-34, -33, -33]);
  assert.deepEqual(allocateMoney('-10.00', [1, 1, 1]), ['-3.34', '-3.33', '-3.33']);
  assert.deepEqual(allocateMoney('0.03', [1, 7, 1]), ['0.01', '0.02', '0.00']);
  assert.throws(() => allocateMoney('1.005', [1]), RangeError);
});
