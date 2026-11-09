import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDiscounts } from '../src/discounts.mjs';

const pct = (value, extra = {}) => ({ kind: 'percent', value, ...extra });
const fix = (value, extra = {}) => ({ kind: 'fixed', value, ...extra });

test('percentage rounds to the nearest cent', () => {
  assert.deepEqual(applyDiscounts(1005, [pct(15)]), { total: 854, applied: [{ index: 0, amount: 151 }] });
});
test('half a cent rounds up', () => {
  assert.deepEqual(applyDiscounts(1010, [pct(15)]), { total: 858, applied: [{ index: 0, amount: 152 }] });
});
test('percentages before fixed ones, regardless of order', () => {
  assert.deepEqual(applyDiscounts(10000, [fix(500), pct(10)]), {
    total: 8500,
    applied: [{ index: 1, amount: 1000 }, { index: 0, amount: 500 }],
  });
});
test('percentages are compounded', () => {
  assert.deepEqual(applyDiscounts(10000, [pct(10), pct(10)]).total, 8100);
});
test('minSubtotal evaluates the current amount (>=)', () => {
  assert.deepEqual(applyDiscounts(10000, [pct(20), fix(1000, { minSubtotal: 9000 })]), {
    total: 8000,
    applied: [{ index: 0, amount: 2000 }],
  });
  assert.equal(applyDiscounts(5000, [fix(500, { minSubtotal: 5000 })]).total, 4500);
});
test('total never negative', () => {
  assert.deepEqual(applyDiscounts(300, [fix(500)]), { total: 0, applied: [{ index: 0, amount: 300 }] });
});
test('invalid inputs', () => {
  assert.throws(() => applyDiscounts(100, [{ kind: 'bogus', value: 1 }]), TypeError);
  assert.throws(() => applyDiscounts(-1, []), RangeError);
});
test('chained rounding', () => {
  assert.equal(applyDiscounts(999, [pct(33), pct(7)]).total, 622);
});
