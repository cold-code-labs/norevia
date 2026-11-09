import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fiscalYearEnd, fiscalYearStart, weeksInFiscalYear, periodWeeks, periodRange, fiscalInfo } from '../src/fiscal.mjs';

const D = (y, m, d) => ({ y, m, d });

test('fim do ano fiscal quando 31/12 não é quarta-feira', () => {
  assert.deepEqual(fiscalYearEnd(2024), D(2024, 12, 28));
  assert.deepEqual(fiscalYearEnd(2023), D(2023, 12, 30));
  assert.deepEqual(fiscalYearEnd(2026), D(2027, 1, 2));
  assert.deepEqual(fiscalYearEnd(2020), D(2021, 1, 2));
  assert.deepEqual(fiscalYearStart(2025), D(2024, 12, 29));
  assert.throws(() => fiscalYearEnd(1), RangeError);
});

test('fim do ano fiscal quando 31/12 é quarta-feira', () => {
  assert.deepEqual(fiscalYearEnd(2025), D(2026, 1, 3));
  assert.deepEqual(fiscalYearEnd(2014), D(2015, 1, 3));
  assert.deepEqual(fiscalYearStart(2026), D(2026, 1, 4));
});

test('anos de 52 e 53 semanas', () => {
  assert.equal(weeksInFiscalYear(2024), 52);
  assert.equal(weeksInFiscalYear(2020), 53);
  assert.equal(weeksInFiscalYear(2025), 53);
  assert.equal(weeksInFiscalYear(2026), 52);
  assert.deepEqual(periodWeeks(2025), [4, 4, 5, 4, 4, 5, 4, 4, 5, 4, 4, 6]);
  assert.deepEqual(periodWeeks(2024), [4, 4, 5, 4, 4, 5, 4, 4, 5, 4, 4, 5]);
});

test('intervalos de períodos', () => {
  assert.deepEqual(periodRange(2024, 1), { start: D(2023, 12, 31), end: D(2024, 1, 27) });
  assert.deepEqual(periodRange(2024, 3), { start: D(2024, 2, 25), end: D(2024, 3, 30) });
  assert.deepEqual(periodRange(2025, 12), { start: D(2025, 11, 23), end: D(2026, 1, 3) });
  assert.throws(() => periodRange(2024, 13), RangeError);
});

test('fiscalInfo', () => {
  assert.deepEqual(fiscalInfo(D(2024, 3, 30)), { year: 2024, quarter: 1, period: 3, week: 13 });
  assert.deepEqual(fiscalInfo(D(2024, 12, 29)), { year: 2025, quarter: 1, period: 1, week: 1 });
  assert.deepEqual(fiscalInfo(D(2023, 12, 30)), { year: 2023, quarter: 4, period: 12, week: 52 });
});

test('fiscalInfo na semana 53', () => {
  assert.deepEqual(fiscalInfo(D(2026, 1, 2)), { year: 2025, quarter: 4, period: 12, week: 53 });
  assert.deepEqual(fiscalInfo(D(2026, 1, 4)), { year: 2026, quarter: 1, period: 1, week: 1 });
});

test('fiscalInfo na primeira semana do ano fiscal', () => {
  assert.deepEqual(fiscalInfo(D(2025, 1, 4)), { year: 2025, quarter: 1, period: 1, week: 1 });
  assert.deepEqual(fiscalInfo(D(2025, 1, 5)), { year: 2025, quarter: 1, period: 1, week: 2 });
  assert.deepEqual(fiscalInfo(D(2019, 12, 29)), { year: 2020, quarter: 1, period: 1, week: 1 });
  assert.deepEqual(fiscalInfo(D(2031, 1, 1)), { year: 2031, quarter: 1, period: 1, week: 1 });
});
