import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLeapYear, daysInMonth, isValidDate, assertDate, toOrdinal, fromOrdinal, dayOfWeek, addDays, compareDates, formatISODate, parseISODate } from '../src/civil.mjs';

const D = (y, m, d) => ({ y, m, d });

test('anos bissextos e dias por mês', () => {
  assert.equal(isLeapYear(2024), true);
  assert.equal(isLeapYear(1900), false);
  assert.equal(isLeapYear(2000), true);
  assert.equal(daysInMonth(2023, 2), 28);
  assert.equal(daysInMonth(2024, 2), 29);
  assert.throws(() => daysInMonth(2024, 13), RangeError);
});

test('validação de datas', () => {
  assert.equal(isValidDate(D(2023, 2, 29)), false);
  assert.equal(isValidDate(D(2024, 2, 29)), true);
  assert.equal(isValidDate(null), false);
  assert.throws(() => assertDate('2024-01-01'), TypeError);
  assert.throws(() => assertDate(D(2024, 4, 31)), RangeError);
});

test('ordinais e dia da semana', () => {
  assert.equal(toOrdinal(D(1970, 1, 1)), 0);
  assert.equal(toOrdinal(D(2000, 3, 1)), 11017);
  assert.equal(toOrdinal(D(1, 1, 1)), -719162);
  assert.deepEqual(fromOrdinal(11017), D(2000, 3, 1));
  assert.deepEqual(fromOrdinal(2932896), D(9999, 12, 31));
  assert.throws(() => fromOrdinal(2932897), RangeError);
  assert.equal(dayOfWeek(D(1970, 1, 1)), 4);
  assert.equal(dayOfWeek(D(2024, 3, 9)), 6);
  assert.deepEqual(addDays(D(2024, 12, 31), 1), D(2025, 1, 1));
  assert.equal(compareDates(D(2024, 1, 2), D(2024, 1, 1)), 1);
});

test('formato ISO', () => {
  assert.equal(formatISODate(D(33, 7, 4)), '0033-07-04');
  assert.deepEqual(parseISODate('2024-02-29'), D(2024, 2, 29));
  assert.throws(() => parseISODate('2024-2-29'), RangeError);
  assert.throws(() => parseISODate(20240229), TypeError);
});
