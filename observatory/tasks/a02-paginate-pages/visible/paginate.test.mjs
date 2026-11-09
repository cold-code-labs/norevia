import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paginate } from '../src/paginate.mjs';

const nums = (n) => Array.from({ length: n }, (_, i) => i + 1);

test('first page', () => {
  const r = paginate(nums(25), 1, 10);
  assert.deepEqual(r.items, nums(10));
  assert.equal(r.hasPrev, false);
  assert.equal(r.hasNext, true);
});

test('last partial page', () => {
  const r = paginate(nums(25), 3, 10);
  assert.deepEqual(r.items, [21, 22, 23, 24, 25]);
  assert.equal(r.totalPages, 3);
});
