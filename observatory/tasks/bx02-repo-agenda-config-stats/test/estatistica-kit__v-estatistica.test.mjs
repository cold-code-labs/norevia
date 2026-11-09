import { test } from 'node:test';
import assert from 'node:assert/strict';
import { median } from '../src/estatistica-kit/central.mjs';
import { percentile } from '../src/estatistica-kit/percentile.mjs';
import { histogram } from '../src/estatistica-kit/histogram.mjs';

test('mediana de latências', () => {
  assert.equal(median([120, 95, 80]), 95);
});
test('P25 interpolado', () => {
  assert.equal(percentile([10, 20, 30, 40, 50], 25), 20);
});
test('histograma conta o valor máximo', () => {
  const h = histogram([1, 2, 3, 4], { bins: 3 });
  assert.equal(h.reduce((s, b) => s + b.count, 0), 4);
});
