import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeIntervals } from '../src/intervals.mjs';

test('merges overlapping', () => {
  assert.deepEqual(mergeIntervals([[8, 10], [1, 3], [2, 6]]), [[1, 6], [8, 10]]);
});

test('calling twice with the same input gives the same result', () => {
  const input = [[1, 3], [2, 6], [8, 10]];
  const first = mergeIntervals(input);
  const second = mergeIntervals(input);
  assert.deepEqual(second, first);
  assert.deepEqual(input, [[1, 3], [2, 6], [8, 10]]);
});
