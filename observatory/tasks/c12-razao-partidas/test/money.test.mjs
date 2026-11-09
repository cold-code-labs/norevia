import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount, formatAmount, roundDiv, parseRate, convert, allocate } from '../src/money.mjs';

test('parseAmount: valores dourados, sinal sobre o valor inteiro', () => {
  assert.equal(parseAmount('12.5'), 1250);
  assert.equal(parseAmount('3'), 300);
  assert.equal(parseAmount('0.07'), 7);
  assert.equal(parseAmount('-12.05'), -1205);
  assert.equal(parseAmount('-0.05'), -5);
  assert.equal(parseAmount('-123456.78'), -12345678);
  assert.ok(Object.is(parseAmount('-0'), 0));
  assert.ok(Object.is(parseAmount('-0.00'), 0));
  for (const bad of ['', '1.234', '+1', '1,50', ' 1', '.5', '1.', '--1', '12345678901234']) assert.throws(() => parseAmount(bad), RangeError, bad);
  assert.throws(() => parseAmount(5), TypeError);
  for (const v of [0, 1, -1, 99, -99, 100, -100, -1205, 12345678, -12345678]) assert.equal(parseAmount(formatAmount(v)), v);
});

test('formatAmount: duas casas e sinal', () => {
  assert.equal(formatAmount(-5), '-0.05');
  assert.equal(formatAmount(-1205), '-12.05');
  assert.equal(formatAmount(123456), '1234.56');
  assert.equal(formatAmount(0), '0.00');
  assert.equal(formatAmount(-100), '-1.00');
  assert.throws(() => formatAmount(1.5), RangeError);
});

test('roundDiv: arredondamento bancário simétrico', () => {
  const cases = [[5, 2, 2], [7, 2, 4], [-5, 2, -2], [-7, 2, -4], [-3, 2, -2], [-1, 2, 0], [1, 2, 0], [3, 2, 2],
    [10, 4, 2], [-10, 4, -2], [-11, 4, -3], [-6, 4, -2], [-9, 2, -4], [-11, 2, -6], [14, 4, 4], [-14, 4, -4], [-15, 10, -2], [-25, 10, -2]];
  for (const [n, d, q] of cases) assert.ok(Object.is(roundDiv(n, d), q), `roundDiv(${n}, ${d}) = ${roundDiv(n, d)}, esperado ${q}`);
  for (let n = -60; n <= 60; n++) for (const d of [2, 3, 4, 10]) assert.ok(Object.is(roundDiv(-n, d), -roundDiv(n, d) || 0), `simetria ${n}/${d}`);
  assert.throws(() => roundDiv(1, 0), RangeError);
  assert.throws(() => roundDiv(1.5, 2), RangeError);
});

test('parseRate e convert', () => {
  assert.deepEqual(parseRate('5.4321'), { num: 54321, den: 10000 });
  assert.deepEqual(parseRate('2'), { num: 2, den: 1 });
  assert.throws(() => parseRate('0.000'), RangeError);
  assert.throws(() => parseRate('-1'), RangeError);
  assert.throws(() => parseRate(1), TypeError);
  assert.equal(convert(7, '0.5'), 4);
  assert.equal(convert(-7, '0.5'), -4);
  assert.equal(convert(-3, '0.5'), -2);
  assert.equal(convert(5, '0.5'), 2);
  assert.equal(convert(-5, '0.5'), -2);
  assert.equal(convert(1005, '5.4321'), 5459);
  assert.equal(convert(-1005, '5.4321'), -5459);
  assert.equal(convert(-35, '0.1'), -4);
  assert.equal(convert(-25, { num: 1, den: 10 }), -2);
});

test('allocate: maiores restos e simetria de sinal', () => {
  assert.deepEqual(allocate(1000, [1, 1, 1]), [334, 333, 333]);
  assert.deepEqual(allocate(-1000, [1, 1, 1]), [-334, -333, -333]);
  assert.deepEqual(allocate(-10, [2, 1]), [-7, -3]);
  assert.deepEqual(allocate(-5, [1, 2]), [-2, -3]);
  assert.deepEqual(allocate(100, [0, 3]), [0, 100]);
  assert.deepEqual(allocate(100, [1, 2]), [33, 67]);
  assert.deepEqual(allocate(-100, [1, 2]), [-33, -67]);
  assert.deepEqual(allocate(5, [1, 3, 1]), [1, 3, 1]);
  assert.deepEqual(allocate(7, [1, 3, 2]), [1, 4, 2]);
  assert.ok(Object.is(allocate(-3, [0, 1])[0], 0));
  assert.throws(() => allocate(10, [0, 0]), RangeError);
  assert.throws(() => allocate(10, []), RangeError);
});
