import { test } from 'node:test';
import assert from 'node:assert/strict';
import { holidaysInYear, isHoliday, isBusinessDay, nextBusinessDay, previousBusinessDay, adjust, addBusinessDays, businessDaysBetween } from '../src/business.mjs';

const D = (y, m, d) => ({ y, m, d });
const CAL = { fixed: [{ m: 1, d: 1 }, { m: 4, d: 21 }, { m: 12, d: 25 }], easter: [-2, 60], dates: [{ y: 2024, m: 11, d: 20 }] };

test('feriados do ano', () => {
  assert.deepEqual(holidaysInYear(2024, CAL), [D(2024, 1, 1), D(2024, 3, 29), D(2024, 4, 21), D(2024, 5, 30), D(2024, 11, 20), D(2024, 12, 25)]);
  assert.deepEqual(holidaysInYear(2023, { fixed: [{ m: 2, d: 29 }] }), []);
  assert.equal(isHoliday(D(2025, 4, 18), CAL), true);
  assert.equal(isHoliday(D(2025, 11, 20), CAL), false);
  assert.equal(isBusinessDay(D(2024, 3, 29), CAL), false);
  assert.equal(isBusinessDay(D(2024, 3, 28), CAL), true);
  assert.throws(() => isHoliday(D(2024, 1, 1), 5), TypeError);
});

test('próximo e anterior na virada do ano', () => {
  assert.deepEqual(nextBusinessDay(D(2024, 12, 31), CAL), D(2025, 1, 2));
  assert.deepEqual(previousBusinessDay(D(2025, 1, 2), CAL), D(2024, 12, 31));
  assert.deepEqual(nextBusinessDay(D(2024, 3, 28), CAL), D(2024, 4, 1));
});

test('convenções de ajuste', () => {
  assert.deepEqual(adjust(D(2024, 8, 31), 'modifiedFollowing'), D(2024, 8, 30));
  assert.deepEqual(adjust(D(2024, 6, 1), 'modifiedPreceding'), D(2024, 6, 3));
  assert.deepEqual(adjust(D(2022, 1, 1), 'modifiedPreceding', CAL), D(2022, 1, 3));
  assert.deepEqual(adjust(D(2022, 1, 1), 'preceding', CAL), D(2021, 12, 31));
  assert.deepEqual(adjust(D(2022, 1, 1), 'none', CAL), D(2022, 1, 1));
  assert.deepEqual(adjust(D(2024, 3, 5), 'following', CAL), D(2024, 3, 5));
  assert.throws(() => adjust(D(2024, 3, 5), 'nearest'), RangeError);
});

test('addBusinessDays', () => {
  assert.deepEqual(addBusinessDays(D(2024, 3, 2), 1), D(2024, 3, 4));
  assert.deepEqual(addBusinessDays(D(2024, 12, 24), 3, CAL), D(2024, 12, 30));
  assert.deepEqual(addBusinessDays(D(2025, 1, 2), -2, CAL), D(2024, 12, 30));
  assert.deepEqual(addBusinessDays(D(2024, 3, 2), 0), D(2024, 3, 2));
  assert.throws(() => addBusinessDays(D(2024, 3, 2), 1.5), RangeError);
});

test('businessDaysBetween no sentido direto', () => {
  assert.equal(businessDaysBetween(D(2024, 3, 4), D(2024, 3, 11)), 5);
  assert.equal(businessDaysBetween(D(2024, 12, 24), D(2025, 1, 3), CAL), 6);
  assert.equal(businessDaysBetween(D(2024, 3, 4), D(2024, 3, 4)), 0);
});

test('businessDaysBetween invertido é o oposto do direto', () => {
  assert.equal(businessDaysBetween(D(2024, 3, 11), D(2024, 3, 4)), -5);
  assert.equal(businessDaysBetween(D(2024, 3, 29), D(2024, 3, 25), CAL), -4);
  assert.equal(businessDaysBetween(D(2025, 1, 3), D(2024, 12, 24), CAL), -6);
  assert.equal(businessDaysBetween(D(2024, 3, 10), D(2024, 3, 8)), -1);
});
