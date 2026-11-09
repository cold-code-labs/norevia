import { test } from 'node:test';
import assert from 'node:assert/strict';
import { businessDaysBetween } from '../src/business.mjs';
import { isoWeek } from '../src/isoweek.mjs';

const D = (y, m, d) => ({ y, m, d });

test('dias úteis entre segunda e sábado', () => {
  assert.equal(businessDaysBetween(D(2024, 3, 4), D(2024, 3, 9)), 5);
});
test('dias úteis com intervalo invertido', () => {
  assert.equal(businessDaysBetween(D(2024, 3, 9), D(2024, 3, 4)), -5);
});
test('semana ISO na virada do ano', () => {
  assert.deepEqual(isoWeek(D(2024, 12, 30)), { year: 2025, week: 1 });
});
