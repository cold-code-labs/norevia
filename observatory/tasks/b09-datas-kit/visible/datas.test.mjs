import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLeapYear } from '../src/dates.mjs';
import { parseDuration } from '../src/duration.mjs';
import { addBusinessDays } from '../src/business.mjs';

test('2000 was a leap year', () => {
  assert.equal(isLeapYear(2000), true);
});
test('250ms timeout', () => {
  assert.equal(parseDuration('250ms'), 250);
});
test('Friday + 1 business day = Monday', () => {
  assert.equal(addBusinessDays('2024-06-07', 1), '2024-06-10');
});
