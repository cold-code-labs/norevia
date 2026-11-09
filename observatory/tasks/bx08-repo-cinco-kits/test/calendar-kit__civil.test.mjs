import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLeapYear, daysInMonth, isValidDate, assertDate, toOrdinal, fromOrdinal, dayOfWeek, dayOfYear, compareDates, parseISODate, formatISODate } from '../src/calendar-kit/civil.mjs';

const D = (y, m, d) => ({ y, m, d });

test('isLeapYear e daysInMonth seguem a regra dos séculos', () => {
  for (const [y, v] of [[2000, true], [1900, false], [2024, true], [2023, false], [2100, false], [2400, true]]) assert.equal(isLeapYear(y), v, String(y));
  assert.equal(daysInMonth(2024, 2), 29);
  assert.equal(daysInMonth(1900, 2), 28);
  assert.equal(daysInMonth(2023, 4), 30);
  assert.equal(daysInMonth(2023, 12), 31);
  assert.throws(() => daysInMonth(2023, 13), RangeError);
  assert.throws(() => daysInMonth(2023, 0), RangeError);
});

test('isValidDate e assertDate', () => {
  assert.equal(isValidDate(D(2024, 2, 29)), true);
  assert.equal(isValidDate(D(2023, 2, 29)), false);
  assert.equal(isValidDate(D(0, 1, 1)), false);
  assert.equal(isValidDate(D(10000, 1, 1)), false);
  assert.equal(isValidDate(D(2024, 1, 1.5)), false);
  assert.equal(isValidDate(null), false);
  assert.throws(() => assertDate(null), TypeError);
  assert.throws(() => assertDate('2024-01-01'), TypeError);
  assert.throws(() => assertDate(D(2023, 2, 29)), RangeError);
  const x = D(2024, 5, 6);
  assert.equal(assertDate(x), x);
});

test('toOrdinal / fromOrdinal', () => {
  assert.equal(toOrdinal(D(1970, 1, 1)), 0);
  assert.equal(toOrdinal(D(1969, 12, 31)), -1);
  assert.equal(toOrdinal(D(2000, 3, 1)), 11017);
  assert.equal(toOrdinal(D(1, 1, 1)), -719162);
  assert.equal(toOrdinal(D(9999, 12, 31)), 2932896);
  assert.deepEqual(fromOrdinal(11017), D(2000, 3, 1));
  assert.deepEqual(fromOrdinal(-719162), D(1, 1, 1));
  for (let n = -800; n <= 800; n += 37) assert.equal(toOrdinal(fromOrdinal(n * 53)), n * 53);
  assert.throws(() => fromOrdinal(-719163), RangeError);
  assert.throws(() => fromOrdinal(2932897), RangeError);
  assert.throws(() => fromOrdinal(1.5), RangeError);
});

test('dayOfWeek ISO (1 = segunda, 7 = domingo)', () => {
  assert.equal(dayOfWeek(D(1970, 1, 1)), 4);
  assert.equal(dayOfWeek(D(2024, 2, 29)), 4);
  assert.equal(dayOfWeek(D(2000, 1, 1)), 6);
  assert.equal(dayOfWeek(D(2023, 12, 31)), 7);
  assert.equal(dayOfWeek(D(1, 1, 1)), 1);
  assert.equal(dayOfWeek(D(1969, 12, 29)), 1);
});

test('dayOfYear em anos bissextos e comuns', () => {
  assert.equal(dayOfYear(D(2024, 1, 1)), 1);
  assert.equal(dayOfYear(D(2024, 1, 31)), 31);
  assert.equal(dayOfYear(D(2024, 2, 1)), 32);
  assert.equal(dayOfYear(D(2024, 2, 29)), 60);
  assert.equal(dayOfYear(D(2024, 3, 1)), 61);
  assert.equal(dayOfYear(D(2023, 3, 1)), 60);
  assert.equal(dayOfYear(D(1900, 3, 1)), 60);
  assert.equal(dayOfYear(D(2024, 12, 31)), 366);
  assert.throws(() => dayOfYear(D(2023, 2, 29)), RangeError);
});

test('compareDates, parseISODate e formatISODate', () => {
  assert.equal(compareDates(D(2024, 1, 31), D(2024, 2, 1)), -1);
  assert.equal(compareDates(D(2024, 2, 1), D(2024, 2, 1)), 0);
  assert.equal(compareDates(D(2025, 1, 1), D(2024, 12, 31)), 1);
  assert.deepEqual(parseISODate('2024-02-29'), D(2024, 2, 29));
  assert.throws(() => parseISODate('2023-02-29'), RangeError);
  assert.throws(() => parseISODate('2024-2-29'), RangeError);
  assert.throws(() => parseISODate('0000-01-01'), RangeError);
  assert.throws(() => parseISODate(20240229), TypeError);
  assert.equal(formatISODate(D(33, 7, 4)), '0033-07-04');
  assert.equal(formatISODate(D(2024, 12, 31)), '2024-12-31');
});
