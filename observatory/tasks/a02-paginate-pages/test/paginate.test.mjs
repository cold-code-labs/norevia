import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paginate, countPages, pageForIndex } from '../src/paginate.mjs';

const nums = (n) => Array.from({ length: n }, (_, i) => i + 1);

test('metadata of the second-to-last page with leftover', () => {
  const r = paginate(nums(25), 2, 10);
  assert.deepEqual(r, { items: nums(20).slice(10), page: 2, pageSize: 10, total: 25, totalPages: 3, hasPrev: true, hasNext: true });
});

test('last partial page', () => {
  const r = paginate(nums(7), 3, 3);
  assert.deepEqual(r.items, [7]);
  assert.equal(r.totalPages, 3);
  assert.equal(r.hasNext, false);
  assert.equal(r.hasPrev, true);
});

test('total exact multiple of pageSize', () => {
  const r = paginate(nums(20), 2, 10);
  assert.deepEqual(r.items, nums(20).slice(10));
  assert.equal(r.totalPages, 2);
  assert.equal(r.hasNext, false);
});

test('fewer items than one page', () => {
  const r = paginate(nums(4), 1, 10);
  assert.deepEqual(r.items, nums(4));
  assert.equal(r.totalPages, 1);
  assert.equal(r.hasNext, false);
});

test('empty list has one empty page', () => {
  const r = paginate([], 1, 5);
  assert.deepEqual(r, { items: [], page: 1, pageSize: 5, total: 0, totalPages: 1, hasPrev: false, hasNext: false });
});

test('page beyond the last one', () => {
  const r = paginate(nums(11), 4, 5);
  assert.deepEqual(r.items, []);
  assert.equal(r.totalPages, 3);
  assert.equal(r.hasPrev, true);
  assert.equal(r.hasNext, false);
});

test('default values and no mutation', () => {
  const input = nums(15);
  const r = paginate(input);
  assert.deepEqual(r.items, nums(10));
  assert.equal(r.pageSize, 10);
  assert.equal(r.totalPages, 2);
  assert.deepEqual(input, nums(15));
});

test('countPages and pageForIndex', () => {
  assert.equal(countPages(0, 10), 1);
  assert.equal(countPages(1, 10), 1);
  assert.equal(countPages(10, 10), 1);
  assert.equal(countPages(11, 10), 2);
  assert.equal(pageForIndex(0, 10), 1);
  assert.equal(pageForIndex(9, 10), 1);
  assert.equal(pageForIndex(10, 10), 2);
});

test('invalid inputs', () => {
  assert.throws(() => paginate(nums(3), 0, 10), RangeError);
  assert.throws(() => paginate(nums(3), 1, 0), RangeError);
  assert.throws(() => paginate(nums(3), 1.5, 10), RangeError);
  assert.throws(() => paginate('abc', 1, 10), TypeError);
});
