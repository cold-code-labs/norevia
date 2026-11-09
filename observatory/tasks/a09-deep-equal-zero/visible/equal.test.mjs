import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deepEqual, uniqueDeep } from '../src/equal.mjs';

test('nested structures and NaN', () => {
  assert.equal(deepEqual({ a: [1, { b: NaN }] }, { a: [1, { b: NaN }] }), true);
  assert.equal(deepEqual({ a: [1, 2] }, { a: [1, 3] }), false);
});

test('displacement vectors with negative zero', () => {
  assert.equal(deepEqual({ dx: 0, dy: -0 }, { dx: 0, dy: 0 }), false);
});
