import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeIntervals, coveredLength, covers } from '../src/intervals.mjs';

test('intervals that touch are merged', () => {
  assert.deepEqual(mergeIntervals([[3, 5], [1, 3]]), [[1, 5]]);
});

test('contained interval does not shrink the larger one', () => {
  assert.deepEqual(mergeIntervals([[1, 10], [2, 3], [4, 12]]), [[1, 12]]);
});

test('empty, single point and disjoint', () => {
  assert.deepEqual(mergeIntervals([]), []);
  assert.deepEqual(mergeIntervals([[2, 2]]), [[2, 2]]);
  assert.deepEqual(mergeIntervals([[5, 6], [1, 2]]), [[1, 2], [5, 6]]);
});

test('does not modify the input nor the inner pairs', () => {
  const a = [1, 4], b = [2, 9], c = [9, 11];
  const input = [c, a, b];
  mergeIntervals(input);
  assert.deepEqual(a, [1, 4]);
  assert.deepEqual(b, [2, 9]);
  assert.deepEqual(c, [9, 11]);
  assert.equal(input[0], c);
  assert.equal(input[1], a);
});

test('returned pairs are new arrays', () => {
  const input = [[1, 2], [5, 6]];
  const out = mergeIntervals(input);
  assert.notEqual(out[0], input[0]);
  assert.notEqual(out[1], input[1]);
  out[0][1] = 100;
  assert.deepEqual(input, [[1, 2], [5, 6]]);
});

test('coveredLength and covers stable across repeated calls', () => {
  const input = [[0, 2], [1, 5], [10, 12]];
  assert.equal(coveredLength(input), 7);
  assert.equal(coveredLength(input), 7);
  assert.equal(covers(input, 5), true);
  assert.equal(covers(input, 3), true);
  assert.equal(covers(input, 7), false);
  assert.deepEqual(input, [[0, 2], [1, 5], [10, 12]]);
});

test('invalid inputs', () => {
  assert.throws(() => mergeIntervals([[3, 1]]), RangeError);
  assert.throws(() => mergeIntervals([[1]]), TypeError);
  assert.throws(() => mergeIntervals('x'), TypeError);
  assert.throws(() => mergeIntervals([[NaN, 1]]), TypeError);
});
