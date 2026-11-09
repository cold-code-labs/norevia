import { test } from 'node:test';
import assert from 'node:assert/strict';
import { median } from '../src/central.mjs';
import { percentile } from '../src/percentile.mjs';
import { histogram } from '../src/histogram.mjs';

test('latency median', () => {
  assert.equal(median([120, 95, 80]), 95);
});
test('interpolated P25', () => {
  assert.equal(percentile([10, 20, 30, 40, 50], 25), 20);
});
test('histogram counts the maximum value', () => {
  const h = histogram([1, 2, 3, 4], { bins: 3 });
  assert.equal(h.reduce((s, b) => s + b.count, 0), 4);
});
