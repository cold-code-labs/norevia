import { test } from 'node:test';
import assert from 'node:assert/strict';
import { percentile, quantiles, iqr, fiveNumberSummary } from '../src/estatistica-kit/percentile.mjs';

test('interpolação linear', () => {
  assert.equal(percentile([1, 2, 3, 4], 25), 1.75);
  assert.equal(percentile([4, 1, 3, 2], 50), 2.5);
});
test('p = 0 e p = 100 devolvem mínimo e máximo', () => {
  assert.equal(percentile([3, 1, 2], 0), 1);
  assert.equal(percentile([3, 1, 2], 100), 3);
});
test('amostra de um elemento', () => {
  assert.equal(percentile([7], 30), 7);
  assert.equal(percentile([7], 100), 7);
});
test('p fora do intervalo e vazio', () => {
  assert.throws(() => percentile([1], -1), RangeError);
  assert.throws(() => percentile([1], 101), RangeError);
  assert.throws(() => percentile([1], NaN), RangeError);
  assert.ok(Number.isNaN(percentile([], 50)));
});
test('não altera a entrada', () => {
  const xs = [4, 1, 3, 2];
  percentile(xs, 50);
  assert.deepEqual(xs, [4, 1, 3, 2]);
});
test('quantiles e iqr', () => {
  assert.deepEqual(quantiles([10, 20, 30], [0, 50, 75]), [10, 20, 25]);
  assert.equal(iqr([1, 2, 3, 4, 5, 6, 7, 8, 9]), 4);
});
test('fiveNumberSummary', () => {
  assert.deepEqual(fiveNumberSummary([5, 1, 4, 2, 3]), { min: 1, q1: 2, median: 3, q3: 4, max: 5 });
});
