import { test } from 'node:test';
import assert from 'node:assert/strict';
import { next, nextN, normalize } from '../src/cron.mjs';

const T = (year, month, day, hour = 0, minute = 0) => ({ year, month, day, hour, minute });

test('next is strictly after from', () => {
  assert.deepEqual(next('*/15 * * * *', T(2025, 1, 1, 10, 7)), T(2025, 1, 1, 10, 15));
  assert.deepEqual(next('*/15 * * * *', T(2025, 1, 1, 10, 15)), T(2025, 1, 1, 10, 30));
});

test('restricted day of month and day of week combine by OR', () => {
  assert.deepEqual(nextN('0 0 13 * FRI', T(2025, 1, 1), 4), [
    T(2025, 1, 3), T(2025, 1, 10), T(2025, 1, 13), T(2025, 1, 17),
  ]);
});

test('normalize lists the values of fields with a step', () => {
  assert.equal(normalize('*/15 9-17 * * MON-FRI'), '0,15,30,45 9-17 * * 1-5');
});
