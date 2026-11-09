import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isBusinessDay, addBusinessDays, businessDaysBetween } from '../src/datas-kit/business.mjs';

const xmas = ['2024-12-25'];

test('fins de semana não são úteis', () => {
  assert.equal(isBusinessDay('2024-06-07'), true);
  assert.equal(isBusinessDay('2024-06-08'), false);
  assert.equal(isBusinessDay('2024-06-09'), false);
});
test('feriados não são úteis', () => {
  assert.equal(isBusinessDay('2024-12-25', xmas), false);
  assert.equal(isBusinessDay('2024-12-26', xmas), true);
  assert.equal(isBusinessDay(new Date(Date.UTC(2024, 11, 25)), xmas), false);
});
test('addBusinessDays sem feriados', () => {
  assert.equal(addBusinessDays('2024-06-07', 1), '2024-06-10');
  assert.equal(addBusinessDays('2024-06-10', -1), '2024-06-07');
  assert.equal(addBusinessDays('2024-06-08', 0), '2024-06-08');
  assert.equal(addBusinessDays('2024-06-05', 5), '2024-06-12');
});
test('addBusinessDays pula feriados', () => {
  assert.equal(addBusinessDays('2024-12-24', 1, xmas), '2024-12-26');
  assert.equal(addBusinessDays('2024-12-20', 3, xmas), '2024-12-26');
  assert.equal(addBusinessDays('2024-12-26', -1, xmas), '2024-12-24');
});
test('businessDaysBetween', () => {
  assert.equal(businessDaysBetween('2024-06-07', '2024-06-14'), 5);
  assert.equal(businessDaysBetween('2024-06-14', '2024-06-07'), -5);
  assert.equal(businessDaysBetween('2024-06-07', '2024-06-07'), 0);
});
test('businessDaysBetween com feriados', () => {
  assert.equal(businessDaysBetween('2024-06-07', '2024-06-14', ['2024-06-12']), 4);
  assert.equal(businessDaysBetween('2024-12-20', '2024-12-31', xmas), 6);
});
test('entrada Date não é alterada; erros', () => {
  const d = new Date(Date.UTC(2024, 5, 7));
  assert.equal(addBusinessDays(d, 1), '2024-06-10');
  assert.equal(d.toISOString(), '2024-06-07T00:00:00.000Z');
  assert.throws(() => addBusinessDays('2024-06-07', 1.5), RangeError);
  assert.throws(() => isBusinessDay('not-a-date'), RangeError);
});
