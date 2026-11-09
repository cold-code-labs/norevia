import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDecimal } from '../src/format.mjs';
import { allocate } from '../src/allocate.mjs';

test('agrupamento padrão', () => {
  assert.equal(formatDecimal('1234567.891'), '1,234,567.89');
});
test('agrupamento indiano', () => {
  assert.equal(formatDecimal('1234567', { grouping: 'indian', places: 0 }), '12,34,567');
});
test('rateio simples', () => {
  assert.deepEqual(allocate(100, [1, 1, 1]), [34, 33, 33]);
});
