import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, addMonths, addYears, diffDays, diffMonths, startOfMonth, endOfMonth, eachDay } from '../src/calendar-kit/add.mjs';

const D = (y, m, d) => ({ y, m, d });

test('addDays', () => {
  assert.deepEqual(addDays(D(2024, 2, 28), 1), D(2024, 2, 29));
  assert.deepEqual(addDays(D(2024, 2, 28), 2), D(2024, 3, 1));
  assert.deepEqual(addDays(D(2024, 1, 1), -1), D(2023, 12, 31));
  assert.deepEqual(addDays(D(2024, 1, 1), 0), D(2024, 1, 1));
  assert.throws(() => addDays(D(2024, 1, 1), 1.5), RangeError);
  assert.throws(() => addDays(D(9999, 12, 31), 1), RangeError);
});

test('addMonths ajusta ao último dia do mês', () => {
  assert.deepEqual(addMonths(D(2024, 1, 31), 1), D(2024, 2, 29));
  assert.deepEqual(addMonths(D(2023, 1, 31), 1), D(2023, 2, 28));
  assert.deepEqual(addMonths(D(2024, 3, 31), -1), D(2024, 2, 29));
  assert.deepEqual(addMonths(D(2024, 10, 31), 4), D(2025, 2, 28));
  assert.deepEqual(addMonths(D(2024, 12, 15), 1), D(2025, 1, 15));
  assert.deepEqual(addMonths(D(2025, 1, 15), -13), D(2023, 12, 15));
  assert.deepEqual(addMonths(D(2024, 1, 31), 2), D(2024, 3, 31));
  assert.throws(() => addMonths(D(9999, 12, 1), 1), RangeError);
  assert.throws(() => addMonths(D(1, 1, 1), -1), RangeError);
});

test('addYears em 29 de fevereiro', () => {
  assert.deepEqual(addYears(D(2024, 2, 29), 1), D(2025, 2, 28));
  assert.deepEqual(addYears(D(2024, 2, 29), 4), D(2028, 2, 29));
  assert.deepEqual(addYears(D(2024, 2, 29), -100), D(1924, 2, 29));
  assert.deepEqual(addYears(D(2000, 2, 29), 100), D(2100, 2, 28));
});

test('diffDays', () => {
  assert.equal(diffDays(D(2024, 1, 1), D(2024, 12, 31)), 365);
  assert.equal(diffDays(D(2024, 12, 31), D(2024, 1, 1)), -365);
  assert.equal(diffDays(D(1970, 1, 1), D(2000, 3, 1)), 11017);
});

test('diffMonths em datas comuns', () => {
  assert.equal(diffMonths(D(2024, 1, 15), D(2024, 3, 14)), 1);
  assert.equal(diffMonths(D(2024, 1, 15), D(2024, 3, 15)), 2);
  assert.equal(diffMonths(D(2024, 1, 15), D(2024, 1, 15)), 0);
  assert.equal(diffMonths(D(2024, 3, 15), D(2024, 1, 15)), -2);
  assert.equal(diffMonths(D(2023, 12, 31), D(2024, 1, 1)), 0);
  assert.equal(diffMonths(D(2020, 6, 10), D(2024, 6, 9)), 47);
});

test('diffMonths quando o dia de origem não existe no mês de destino', () => {
  assert.equal(diffMonths(D(2024, 1, 31), D(2024, 2, 29)), 1);
  assert.equal(diffMonths(D(2023, 1, 31), D(2023, 2, 28)), 1);
  assert.equal(diffMonths(D(2023, 1, 31), D(2023, 2, 27)), 0);
  assert.equal(diffMonths(D(2024, 1, 31), D(2024, 4, 30)), 3);
  assert.equal(diffMonths(D(2024, 3, 31), D(2024, 4, 30)), 1);
  assert.equal(diffMonths(D(2024, 2, 29), D(2024, 1, 31)), -1);
  assert.equal(diffMonths(D(2024, 2, 29), D(2025, 2, 28)), 12);
});

test('startOfMonth, endOfMonth e eachDay', () => {
  assert.deepEqual(startOfMonth(D(2024, 2, 10)), D(2024, 2, 1));
  assert.deepEqual(endOfMonth(D(1900, 2, 10)), D(1900, 2, 28));
  assert.deepEqual(endOfMonth(D(2000, 2, 1)), D(2000, 2, 29));
  assert.deepEqual(eachDay(D(2024, 2, 27), D(2024, 3, 1)), [D(2024, 2, 27), D(2024, 2, 28), D(2024, 2, 29), D(2024, 3, 1)]);
  assert.deepEqual(eachDay(D(2024, 3, 1), D(2024, 2, 27)), []);
});
