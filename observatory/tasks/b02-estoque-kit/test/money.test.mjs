import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatBRL, parseBRL, splitEvenly } from '../src/money.mjs';

test('formatBRL: thousands and two decimal places', () => {
  assert.equal(formatBRL(123456), 'R$ 1.234,56');
  assert.equal(formatBRL(5), 'R$ 0,05');
  assert.equal(formatBRL(100000000), 'R$ 1.000.000,00');
});
test('formatBRL: negatives and non-integers', () => {
  assert.equal(formatBRL(-99), '-R$ 0,99');
  assert.throws(() => formatBRL(1.5), TypeError);
});
test('parseBRL: accepted formats', () => {
  assert.equal(parseBRL('R$ 1.234,56'), 123456);
  assert.equal(parseBRL('12,5'), 1250);
  assert.equal(parseBRL('-R$ 0,99'), -99);
  assert.equal(parseBRL('1234'), 123400);
});
test('parseBRL: invalid format', () => {
  assert.throws(() => parseBRL('1,234'), SyntaxError);
  assert.throws(() => parseBRL('abc'), SyntaxError);
});
test('splitEvenly: leftover goes to the first installments', () => {
  assert.deepEqual(splitEvenly(1000, 3), [334, 333, 333]);
  assert.deepEqual(splitEvenly(10, 4), [3, 3, 2, 2]);
  assert.deepEqual(splitEvenly(2, 5), [1, 1, 0, 0, 0]);
});
test('splitEvenly: exact division', () => {
  assert.deepEqual(splitEvenly(9, 3), [3, 3, 3]);
  assert.deepEqual(splitEvenly(0, 2), [0, 0]);
});
test('splitEvenly: invalid arguments', () => {
  assert.throws(() => splitEvenly(10, 0), RangeError);
  assert.throws(() => splitEvenly(-1, 2), RangeError);
});
