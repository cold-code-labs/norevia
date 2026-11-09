import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allocate, splitEvenly } from '../src/allocate.mjs';

const sum = (xs) => xs.reduce((a, b) => a + b, 0);

test('splitEvenly with several leftover cents', () => {
  assert.deepEqual(splitEvenly(10, 4), [3, 3, 2, 2]);
  assert.deepEqual(splitEvenly(5, 3), [2, 2, 1]);
});

test('largest remainder wins, regardless of index', () => {
  // remainders: 1, 1, 2 (sum 4) -> the extra cent goes to index 2
  assert.deepEqual(allocate(5, [1, 1, 2]), [1, 1, 3]);
  assert.deepEqual(allocate(100, [1, 2]), [33, 67]);
});

test('tied remainders: lowest index first', () => {
  assert.deepEqual(allocate(1, [3, 1, 1, 3]), [1, 0, 0, 0]);
  assert.deepEqual(allocate(2, [1, 2, 2, 1]), [0, 1, 1, 0]);
  assert.deepEqual(allocate(3, [1, 1, 1, 1, 1]), [1, 1, 1, 0, 0]);
});

test('zero weight receives zero', () => {
  assert.deepEqual(allocate(3, [0, 1, 1]), [0, 2, 1]);
});

test('zero total and exact division', () => {
  assert.deepEqual(allocate(0, [1, 2, 3]), [0, 0, 0]);
  assert.deepEqual(allocate(600, [1, 2, 3]), [100, 200, 300]);
});

test('sum preserved', () => {
  const w = [7, 11, 13, 17, 19];
  for (const total of [1, 99, 1001, 12345]) assert.equal(sum(allocate(total, w)), total);
});

test('does not modify weights', () => {
  const w = [2, 1, 1];
  allocate(7, w);
  assert.deepEqual(w, [2, 1, 1]);
});

test('invalid inputs', () => {
  assert.throws(() => allocate(-1, [1]), RangeError);
  assert.throws(() => allocate(1.5, [1]), RangeError);
  assert.throws(() => allocate(10, []), RangeError);
  assert.throws(() => allocate(10, [0, 0]), RangeError);
  assert.throws(() => allocate(10, [1, -1]), RangeError);
  assert.throws(() => splitEvenly(10, 0), RangeError);
});
