import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allocate, splitEvenly } from '../src/allocate.mjs';

test('unequal weights', () => {
  assert.deepEqual(allocate(1000, [1, 3]), [250, 750]);
});

test('split of 100 cents into 3', () => {
  assert.deepEqual(splitEvenly(100, 3), [34, 33, 33]);
});
