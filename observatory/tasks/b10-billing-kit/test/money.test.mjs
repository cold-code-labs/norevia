import { test } from 'node:test';
import assert from 'node:assert/strict';
import { divRound, applyRate, sumCents, fromDecimal, toDecimal, ROUNDING_MODES } from '../src/money.mjs';

test('divRound half-even with positives', () => {
  assert.deepEqual([[25, 10], [35, 10], [26, 10], [24, 10], [5, 10], [15, 10]].map(([n, d]) => divRound(n, d)), [2, 4, 3, 2, 0, 2]);
});

test('divRound half-even with negatives is symmetric and never -0', () => {
  assert.equal(divRound(-25, 10), -2);
  assert.equal(divRound(-26, 10), -3);
  assert.equal(divRound(-35, 10), -4);
  assert.equal(divRound(25, -10), -2);
  assert.equal(divRound(-1, 4), 0);
  assert.equal(divRound(-30, 10), -3);
});

test('divRound: other modes', () => {
  assert.deepEqual(ROUNDING_MODES, ['half-even', 'half-up', 'floor', 'ceil', 'trunc']);
  assert.equal(divRound(-25, 10, 'floor'), -3);
  assert.equal(divRound(-25, 10, 'ceil'), -2);
  assert.equal(divRound(-25, 10, 'trunc'), -2);
  assert.equal(divRound(-25, 10, 'half-up'), -3);
  assert.equal(divRound(25, 10, 'half-up'), 3);
  assert.equal(divRound(25, 10, 'floor'), 2);
  assert.equal(divRound(21, 10, 'ceil'), 3);
  assert.equal(divRound(29, 10, 'trunc'), 2);
  assert.equal(divRound(-1, 3, 'ceil'), 0);
});

test('divRound: errors', () => {
  assert.throws(() => divRound(1, 0), RangeError);
  assert.throws(() => divRound(1, 2, 'bankers'), RangeError);
  assert.throws(() => divRound(1.5, 2), RangeError);
});

test('applyRate', () => {
  assert.equal(applyRate(1050, 250), 26);
  assert.equal(applyRate(5, 5000), 2);
  assert.equal(applyRate(3, 5000), 2);
  assert.equal(applyRate(-3, 5000), -2);
  assert.equal(applyRate(-5, 5000, 'half-up'), -3);
  assert.throws(() => applyRate(2 ** 52, 10000), RangeError);
});

test('fromDecimal / toDecimal', () => {
  assert.equal(fromDecimal('12.5'), 1250);
  assert.equal(fromDecimal('7'), 700);
  assert.equal(fromDecimal('0.125'), 12);
  assert.equal(fromDecimal('0.135'), 14);
  assert.equal(fromDecimal('-0.125'), -12);
  assert.equal(fromDecimal('-0.135'), -14);
  assert.equal(fromDecimal('-0.121', 'floor'), -13);
  assert.equal(fromDecimal('-0'), 0);
  assert.throws(() => fromDecimal('1,5'), SyntaxError);
  assert.equal(toDecimal(-5), '-0.05');
  assert.equal(toDecimal(0), '0.00');
  assert.equal(toDecimal(123456), '1234.56');
});

test('sumCents', () => {
  assert.equal(sumCents([1, 2, -3]), 0);
  assert.equal(sumCents([]), 0);
  assert.throws(() => sumCents([1.5]), RangeError);
});
