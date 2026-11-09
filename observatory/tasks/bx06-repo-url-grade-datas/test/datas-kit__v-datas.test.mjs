import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLeapYear } from '../src/datas-kit/dates.mjs';
import { parseDuration } from '../src/datas-kit/duration.mjs';
import { addBusinessDays } from '../src/datas-kit/business.mjs';

test('2000 foi bissexto', () => {
  assert.equal(isLeapYear(2000), true);
});
test('timeout de 250ms', () => {
  assert.equal(parseDuration('250ms'), 250);
});
test('sexta + 1 dia útil = segunda', () => {
  assert.equal(addBusinessDays('2024-06-07', 1), '2024-06-10');
});
