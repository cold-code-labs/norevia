import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLeapYear, daysInMonth, parseDate, dayNumber, addDays, daysBetween, prorate, splitByMonth, monthlyCharges } from '../src/proration.mjs';

test('Gregorian leap years', () => {
  assert.deepEqual([2000, 1900, 2024, 2023, 2100, 2400].map(isLeapYear), [true, false, true, false, false, true]);
  assert.equal(daysInMonth(2000, 2), 29);
  assert.equal(daysInMonth(1900, 2), 28);
  assert.equal(daysInMonth(2023, 4), 30);
});

test('parseDate and dayNumber', () => {
  assert.deepEqual(parseDate('2024-02-29'), { y: 2024, m: 2, d: 29 });
  for (const s of ['2023-02-29', '2024-13-01', '2024-1-01', '2024-04-31']) assert.throws(() => parseDate(s), RangeError, s);
  assert.equal(dayNumber('1970-01-01'), 0);
  assert.equal(dayNumber('1969-12-31'), -1);
  assert.equal(dayNumber('2000-03-01'), 11017);
  assert.equal(dayNumber('2001-01-01'), 11323);
});

test('daysBetween and addDays across years', () => {
  assert.equal(daysBetween('1999-01-01', '2001-01-01'), 731);
  assert.equal(daysBetween('2000-12-31', '2001-01-01'), 1);
  assert.equal(daysBetween('2024-03-10', '2024-03-01'), -9);
  assert.equal(addDays('2000-12-31', 1), '2001-01-01');
  assert.equal(addDays('2001-01-01', -1), '2000-12-31');
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addDays('1970-01-01', -1), '1969-12-31');
});

test('prorate: proportion, half-even tie-break and no overlap', () => {
  assert.equal(prorate(1000, { start: '2024-02-01', end: '2024-03-01' }, { start: '2024-02-10', end: '2024-02-11' }), 34);
  assert.equal(prorate(5, { start: '2024-01-01', end: '2024-01-03' }, { start: '2024-01-01', end: '2024-01-02' }), 2);
  assert.equal(prorate(7, { start: '2024-01-01', end: '2024-01-03' }, { start: '2024-01-02', end: '2024-01-09' }), 4);
  assert.equal(prorate(900, { start: '2024-01-01', end: '2024-02-01' }, { start: '2024-03-01', end: '2024-04-01' }), 0);
  assert.equal(prorate(900, { start: '2024-01-01', end: '2024-02-01' }, { start: '2024-01-05', end: '2024-01-05' }), 0);
});

test('prorate: yearly period crossing the 2000 rollover', () => {
  assert.equal(prorate(36600, { start: '2000-01-01', end: '2001-01-01' }, { start: '2000-12-01', end: '2001-02-01' }), 3100);
});

test('prorate: errors', () => {
  assert.throws(() => prorate(100, { start: '2024-01-02', end: '2024-01-02' }, { start: '2024-01-01', end: '2024-01-02' }), RangeError);
  assert.throws(() => prorate(100, { start: '2024-01-01', end: '2024-02-01' }, { start: '2024-01-05', end: '2024-01-04' }), RangeError);
});

test('splitByMonth', () => {
  assert.deepEqual(splitByMonth('2024-01-30', '2024-03-02'), [
    { month: '2024-01', start: '2024-01-30', end: '2024-02-01', days: 2 },
    { month: '2024-02', start: '2024-02-01', end: '2024-03-01', days: 29 },
    { month: '2024-03', start: '2024-03-01', end: '2024-03-02', days: 1 },
  ]);
  assert.deepEqual(splitByMonth('2024-05-05', '2024-05-05'), []);
  assert.deepEqual(splitByMonth('2023-12-31', '2024-01-02').map((s) => [s.month, s.days]), [['2023-12', 1], ['2024-01', 1]]);
});

test('monthlyCharges', () => {
  assert.deepEqual(monthlyCharges(3100, '2024-01-15', '2024-03-01'), [
    { month: '2024-01', days: 17, cents: 1700 },
    { month: '2024-02', days: 29, cents: 3100 },
  ]);
  assert.deepEqual(monthlyCharges(3100, '2000-12-16', '2001-01-01'), [{ month: '2000-12', days: 16, cents: 1600 }]);
});
