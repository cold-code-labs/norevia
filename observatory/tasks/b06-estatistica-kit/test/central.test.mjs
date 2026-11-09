import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mean, median, mode, variance, stddev } from '../src/central.mjs';

test('mean', () => {
  assert.equal(mean([1, 2, 3, 4]), 2.5);
  assert.ok(Number.isNaN(mean([])));
});
test('odd median uses numeric order', () => {
  assert.equal(median([10, 9, 2]), 9);
  assert.equal(median([3, 1, 2]), 2);
});
test('even median: mean of the two middle ones', () => {
  assert.equal(median([100, 20, 3, 4]), 12);
  assert.ok(Number.isNaN(median([])));
});
test('median does not change the input', () => {
  const xs = [3, 1, 2];
  median(xs);
  assert.deepEqual(xs, [3, 1, 2]);
});
test('mode: tie returns the smallest', () => {
  assert.equal(mode([1, 2, 2, 3, 3]), 2);
  assert.equal(mode([4, 4, 1, 1, 9]), 1);
  assert.equal(mode([5]), 5);
  assert.ok(Number.isNaN(mode([])));
});
test('variance and stddev', () => {
  const xs = [2, 4, 4, 4, 5, 5, 7, 9];
  assert.equal(variance(xs), 4);
  assert.equal(stddev(xs), 2);
  assert.equal(variance(xs, { sample: true }), 32 / 7);
  assert.ok(Number.isNaN(variance([1], { sample: true })));
});
test('invalid inputs', () => {
  assert.throws(() => mean([1, '2']), TypeError);
  assert.throws(() => median([NaN]), TypeError);
});
