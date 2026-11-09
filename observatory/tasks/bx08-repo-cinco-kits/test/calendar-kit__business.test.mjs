import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isHoliday, isBusinessDay, nextBusinessDay, previousBusinessDay, adjust, addBusinessDays, businessDaysBetween } from '../src/calendar-kit/business.mjs';

const D = (y, m, d) => ({ y, m, d });
const XMAS = { m: 12, d: 25 };

test('isBusinessDay e isHoliday com feriados únicos e anuais', () => {
  assert.equal(isBusinessDay(D(2024, 3, 2)), false);
  assert.equal(isBusinessDay(D(2024, 3, 4)), true);
  assert.equal(isBusinessDay(D(2024, 12, 25), [XMAS]), false);
  const once = [{ y: 2024, m: 11, d: 20 }];
  assert.equal(isBusinessDay(D(2024, 11, 20), once), false);
  assert.equal(isBusinessDay(D(2025, 11, 20), once), true);
  assert.equal(isHoliday(D(2025, 11, 20), once), false);
  assert.equal(isHoliday(D(2030, 12, 25), [XMAS]), true);
  assert.throws(() => isBusinessDay(D(2024, 3, 4), 'x'), TypeError);
});

test('nextBusinessDay e previousBusinessDay são estritos', () => {
  assert.deepEqual(nextBusinessDay(D(2024, 3, 1)), D(2024, 3, 4));
  assert.deepEqual(nextBusinessDay(D(2024, 3, 1), [{ y: 2024, m: 3, d: 4 }]), D(2024, 3, 5));
  assert.deepEqual(nextBusinessDay(D(2024, 3, 5)), D(2024, 3, 6));
  assert.deepEqual(previousBusinessDay(D(2024, 3, 4)), D(2024, 3, 1));
});

test('adjust: none, following, preceding e dia útil inalterado', () => {
  const sat = D(2024, 3, 2);
  assert.deepEqual(adjust(sat, 'none'), sat);
  assert.deepEqual(adjust(sat), D(2024, 3, 4));
  assert.deepEqual(adjust(sat, 'preceding'), D(2024, 3, 1));
  const mon = D(2024, 3, 4);
  const r = adjust(mon, 'modifiedFollowing');
  assert.deepEqual(r, mon);
  assert.notEqual(r, mon);
  assert.throws(() => adjust(sat, 'nearest'), RangeError);
});

test('adjust modificado dentro do ano', () => {
  assert.deepEqual(adjust(D(2024, 8, 31), 'modifiedFollowing'), D(2024, 8, 30));
  assert.deepEqual(adjust(D(2024, 3, 2), 'modifiedFollowing'), D(2024, 3, 4));
  assert.deepEqual(adjust(D(2024, 6, 1), 'modifiedPreceding'), D(2024, 6, 3));
  assert.deepEqual(adjust(D(2024, 6, 15), 'modifiedPreceding'), D(2024, 6, 14));
});

test('adjust modificado na virada do ano', () => {
  assert.deepEqual(adjust(D(2022, 12, 31), 'modifiedFollowing'), D(2022, 12, 30));
  assert.deepEqual(adjust(D(2024, 12, 31), 'modifiedFollowing', [{ m: 12, d: 31 }, { m: 1, d: 1 }]), D(2024, 12, 30));
  assert.deepEqual(adjust(D(2023, 1, 1), 'modifiedPreceding'), D(2023, 1, 2));
  assert.deepEqual(adjust(D(2022, 12, 31), 'following'), D(2023, 1, 2));
});

test('addBusinessDays', () => {
  assert.deepEqual(addBusinessDays(D(2024, 3, 1), 1), D(2024, 3, 4));
  assert.deepEqual(addBusinessDays(D(2024, 3, 2), 1), D(2024, 3, 4));
  assert.deepEqual(addBusinessDays(D(2024, 3, 4), -1), D(2024, 3, 1));
  assert.deepEqual(addBusinessDays(D(2024, 12, 18), 5, [XMAS]), D(2024, 12, 26));
  const sat = D(2024, 3, 2);
  const z = addBusinessDays(sat, 0);
  assert.deepEqual(z, sat);
  assert.notEqual(z, sat);
  assert.throws(() => addBusinessDays(sat, 1.5), RangeError);
});

test('businessDaysBetween é semiaberto e antissimétrico', () => {
  assert.equal(businessDaysBetween(D(2024, 3, 4), D(2024, 3, 11)), 5);
  assert.equal(businessDaysBetween(D(2024, 3, 11), D(2024, 3, 4)), -5);
  assert.equal(businessDaysBetween(D(2024, 3, 4), D(2024, 3, 4)), 0);
  assert.equal(businessDaysBetween(D(2024, 3, 4), D(2024, 3, 11), [{ y: 2024, m: 3, d: 6 }]), 4);
  assert.equal(businessDaysBetween(D(2024, 3, 2), D(2024, 3, 4)), 0);
});
