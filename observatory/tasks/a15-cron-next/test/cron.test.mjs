import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, matches, next, prev, nextN, between, normalize, CronError } from '../src/cron.mjs';

const T = (year, month, day, hour = 0, minute = 0) => ({ year, month, day, hour, minute });

test('parse: lists, ranges, steps, names and 7 = Sunday', () => {
  assert.deepEqual(parse('10-50/20 * * * *').minute.values, [10, 30, 50]);
  assert.deepEqual(parse('5/20 * * * *').minute.values, [5, 25, 45]);
  assert.deepEqual(parse('* * * JAN,mar *').month.values, [1, 3]);
  assert.deepEqual(parse('* * * * 5-7').dayOfWeek.values, [0, 5, 6]);
  assert.deepEqual(parse('* * * * MON-FRI/2').dayOfWeek.values, [1, 3, 5]);
  assert.deepEqual(parse('* * * * */2').dayOfWeek.values, [0, 2, 4, 6]);
  assert.deepEqual(parse('* * * * 1/2').dayOfWeek.values, [1, 3, 5]);
  assert.deepEqual(parse('  0   0\t1 * *  ').hour.values, [0]);
});

test('parse: field is unrestricted only when the text is exactly *', () => {
  const p = parse('*/1 * 1-31 * */1');
  assert.equal(p.minute.restricted, true);
  assert.equal(p.hour.restricted, false);
  assert.equal(p.dayOfMonth.restricted, true);
  assert.equal(p.month.restricted, false);
  assert.equal(p.dayOfWeek.restricted, true);
});

test('parse: validation errors', () => {
  const bad = [
    ['60 * * * *', 'minute'], ['* 24 * * *', 'hour'], ['* * 0 * *', 'dayOfMonth'],
    ['* * * 13 *', 'month'], ['* * * * 8', 'dayOfWeek'], ['5-1 * * * *', 'minute'],
    ['*/0 * * * *', 'minute'], ['1,,2 * * * *', 'minute'], ['* * * MON *', 'month'],
    ['* * * * JAN', 'dayOfWeek'], ['* * * * 7/1', 'dayOfWeek'], ['1-2-3 * * * *', 'minute'],
    ['* * * *', null], ['* * * * * *', null], ['', null],
  ];
  for (const [expr, field] of bad) {
    assert.throws(() => parse(expr), (e) => e instanceof CronError && e.field === field, expr);
  }
  assert.throws(() => parse(42), TypeError);
});

test('next: rollovers of hour, day and year', () => {
  assert.deepEqual(next('10-50/20 * * * *', T(2025, 1, 1, 0, 30)), T(2025, 1, 1, 0, 50));
  assert.deepEqual(next('10-50/20 * * * *', T(2025, 1, 1, 0, 50)), T(2025, 1, 1, 1, 10));
  assert.deepEqual(next('* * * * *', T(2025, 12, 31, 23, 59)), T(2026, 1, 1, 0, 0));
  assert.deepEqual(next('59 23 31 12 *', T(2025, 12, 31, 23, 59)), T(2026, 12, 31, 23, 59));
});

test('day 31 skips short months; impossible dates return null', () => {
  assert.deepEqual(nextN('0 0 31 * *', T(2025, 1, 31), 3), [T(2025, 3, 31), T(2025, 5, 31), T(2025, 7, 31)]);
  assert.equal(next('0 0 30 2 *', T(2025, 1, 1)), null);
  assert.equal(prev('0 0 30 2 *', T(2025, 1, 1)), null);
  assert.equal(next('0 0 31 4,6,9,11 *', T(2025, 1, 1)), null);
  assert.deepEqual(nextN('0 0 30 2 *', T(2025, 1, 1), 3), []);
});

test('February 29 follows the Gregorian rule', () => {
  assert.deepEqual(next('0 0 29 2 *', T(2025, 3, 1)), T(2028, 2, 29));
  assert.deepEqual(next('0 0 29 2 *', T(2028, 2, 29)), T(2032, 2, 29));
  assert.deepEqual(next('0 0 29 2 *', T(1999, 6, 15)), T(2000, 2, 29));
  assert.deepEqual(next('0 0 29 2 *', T(2096, 3, 1)), T(2104, 2, 29));
  assert.deepEqual(prev('0 0 29 2 *', T(2100, 3, 1)), T(2096, 2, 29));
});

test('day of month with a step and restricted day of week: OR', () => {
  assert.deepEqual(nextN('30 8 */10 * MON', T(2025, 1, 1), 5), [
    T(2025, 1, 1, 8, 30), T(2025, 1, 6, 8, 30), T(2025, 1, 11, 8, 30), T(2025, 1, 13, 8, 30), T(2025, 1, 20, 8, 30),
  ]);
  assert.deepEqual(nextN('0 12 1 * */1', T(2025, 1, 1, 12), 3), [T(2025, 1, 2, 12), T(2025, 1, 3, 12), T(2025, 1, 4, 12)]);
});

test('only one of the day fields restricted: only it counts', () => {
  assert.deepEqual(nextN('0 12 1 * *', T(2025, 1, 1, 12), 2), [T(2025, 2, 1, 12), T(2025, 3, 1, 12)]);
  assert.deepEqual(nextN('0 12 * * SUN', T(2025, 1, 1), 2), [T(2025, 1, 5, 12), T(2025, 1, 12, 12)]);
  assert.deepEqual(nextN('0 0 * * 5-7', T(2025, 1, 1), 3), [T(2025, 1, 3), T(2025, 1, 4), T(2025, 1, 5)]);
});

test('matches applies the day of month / day of week rule', () => {
  assert.equal(matches('* * */2 * MON', T(2025, 1, 6, 3, 4)), true);
  assert.equal(matches('* * */2 * MON', T(2025, 1, 7, 3, 4)), true);
  assert.equal(matches('* * */2 * MON', T(2025, 1, 8, 3, 4)), false);
  assert.equal(matches('* * 6 * *', T(2025, 1, 6)), true);
  assert.equal(matches('* * 7 * *', T(2025, 1, 6)), false);
  assert.equal(matches('0 0 * * 7', T(2025, 1, 5)), true);
});

test('prev is strictly before from', () => {
  assert.deepEqual(prev('*/15 * * * *', T(2025, 1, 1, 0, 0)), T(2024, 12, 31, 23, 45));
  assert.deepEqual(prev('0 0 31 * *', T(2025, 3, 1)), T(2025, 1, 31));
  assert.deepEqual(prev('0 0 31 * *', T(2025, 3, 31)), T(2025, 1, 31));
  assert.deepEqual(prev('0 9 * * MON-FRI', T(2025, 1, 6, 9, 0)), T(2025, 1, 3, 9, 0));
});

test('between: interval (from, to] and limit', () => {
  assert.deepEqual(between('0 * * * *', T(2025, 1, 1, 0), T(2025, 1, 1, 3)), [T(2025, 1, 1, 1), T(2025, 1, 1, 2), T(2025, 1, 1, 3)]);
  assert.deepEqual(between('0 * * * *', T(2025, 1, 1, 0), T(2025, 1, 1, 3), 2), [T(2025, 1, 1, 1), T(2025, 1, 1, 2)]);
  assert.deepEqual(between('0 * * * *', T(2025, 1, 1, 3), T(2025, 1, 1, 3)), []);
});

test('normalize', () => {
  assert.equal(normalize('0 0 * * 7'), '0 0 * * 0');
  assert.equal(normalize('1,2,3,5,6 * */1 JAN,FEB *'), '1-3,5,6 * 1-31 1,2 *');
  assert.equal(normalize('0 0 * * 5-7'), '0 0 * * 0,5,6');
  assert.equal(normalize('*/20 */6 * * */3'), '0,20,40 0,6,12,18 * * 0,3,6');
});

test('validation of instants and of n; input is not changed', () => {
  assert.throws(() => next('* * * * *', T(2025, 2, 29)), RangeError);
  assert.throws(() => next('* * * * *', T(2025, 1, 1, 24, 0)), RangeError);
  assert.throws(() => nextN('* * * * *', T(2025, 1, 1), -1), RangeError);
  assert.deepEqual(nextN('* * * * *', T(2025, 1, 1), 0), []);
  const from = Object.freeze(T(2025, 1, 1, 10, 7));
  assert.deepEqual(nextN('*/30 * * * *', from, 2), [T(2025, 1, 1, 10, 30), T(2025, 1, 1, 11, 0)]);
  assert.deepEqual(from, T(2025, 1, 1, 10, 7));
});
