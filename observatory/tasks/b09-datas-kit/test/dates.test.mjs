import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLeapYear, daysInMonth, parseISODate, formatISODate, addDays, daysBetween, addMonths, dayOfYear } from '../src/dates.mjs';

test('isLeapYear: rules of 4, 100 and 400', () => {
  assert.equal(isLeapYear(2024), true);
  assert.equal(isLeapYear(2023), false);
  assert.equal(isLeapYear(1900), false);
  assert.equal(isLeapYear(2000), true);
  assert.equal(isLeapYear(2400), true);
});
test('daysInMonth', () => {
  assert.deepEqual([daysInMonth(2024, 2), daysInMonth(2023, 2), daysInMonth(2000, 2), daysInMonth(1900, 2)], [29, 28, 29, 28]);
  assert.equal(daysInMonth(2023, 4), 30);
  assert.throws(() => daysInMonth(2023, 13), RangeError);
});
test('parseISODate and formatISODate', () => {
  assert.deepEqual(parseISODate('2024-03-05'), { year: 2024, month: 3, day: 5 });
  assert.deepEqual(parseISODate('2000-02-29'), { year: 2000, month: 2, day: 29 });
  assert.throws(() => parseISODate('2024-3-5'), SyntaxError);
  assert.throws(() => parseISODate('2023-02-29'), RangeError);
  assert.throws(() => parseISODate('2024-13-01'), RangeError);
  assert.equal(formatISODate({ year: 987, month: 1, day: 2 }), '0987-01-02');
});
test('addDays and daysBetween', () => {
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addDays('2024-03-01', -1), '2024-02-29');
  assert.equal(addDays('2023-12-31', 1), '2024-01-01');
  assert.equal(daysBetween('2024-01-01', '2024-12-31'), 365);
  assert.equal(daysBetween('2024-12-31', '2024-01-01'), -365);
});
test('addMonths clamps to the last day of the month', () => {
  assert.equal(addMonths('2023-01-31', 1), '2023-02-28');
  assert.equal(addMonths('2024-01-31', 1), '2024-02-29');
  assert.equal(addMonths('2024-05-15', -6), '2023-11-15');
  assert.equal(addMonths('2024-12-10', 1), '2025-01-10');
});
test('addMonths in a leap century year', () => {
  assert.equal(addMonths('2000-01-31', 1), '2000-02-29');
  assert.equal(addMonths('1900-01-31', 1), '1900-02-28');
});
test('dayOfYear', () => {
  assert.equal(dayOfYear('2024-12-31'), 366);
  assert.equal(dayOfYear('2023-12-31'), 365);
  assert.equal(dayOfYear('2000-03-01'), 61);
});
