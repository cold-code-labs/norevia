import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expandMonthly, nthWeekdayOfMonth } from '../src/recur.mjs';

const D = (y, m, d) => ({ y, m, d });

test('padrão: dia de start; meses sem o dia são pulados', () => {
  assert.deepEqual(expandMonthly({ start: D(2024, 1, 31), count: 4 }), [D(2024, 1, 31), D(2024, 3, 31), D(2024, 5, 31), D(2024, 7, 31)]);
  assert.deepEqual(expandMonthly({ start: D(2024, 11, 15), interval: 2, count: 3 }), [D(2024, 11, 15), D(2025, 1, 15), D(2025, 3, 15)]);
  assert.deepEqual(expandMonthly({ start: D(2024, 1, 15), until: D(2024, 3, 15) }), [D(2024, 1, 15), D(2024, 2, 15), D(2024, 3, 15)]);
  assert.deepEqual(expandMonthly({ start: D(2024, 1, 15), count: 0 }), []);
});

test('byMonthDay com valores negativos e múltiplos', () => {
  assert.deepEqual(expandMonthly({ start: D(2024, 1, 1), byMonthDay: [-1, 15], count: 4 }), [D(2024, 1, 15), D(2024, 1, 31), D(2024, 2, 15), D(2024, 2, 29)]);
});

test('bySetPos quando start é o primeiro candidato do mês', () => {
  assert.deepEqual(expandMonthly({ start: D(2024, 1, 31), byWeekday: [1, 2, 3, 4, 5], bySetPos: [-1], count: 3 }), [D(2024, 1, 31), D(2024, 2, 29), D(2024, 3, 29)]);
  assert.deepEqual(expandMonthly({ start: D(2024, 1, 1), byWeekday: [2], bySetPos: [2], count: 2 }), [D(2024, 1, 9), D(2024, 2, 13)]);
});

test('bySetPos é aplicado ao mês inteiro antes de descartar datas anteriores a start', () => {
  assert.deepEqual(expandMonthly({ start: D(2024, 1, 10), byWeekday: [1, 2, 3, 4, 5], bySetPos: [1], count: 3 }), [D(2024, 2, 1), D(2024, 3, 1), D(2024, 4, 1)]);
  assert.deepEqual(expandMonthly({ start: D(2024, 1, 20), byWeekday: [2], bySetPos: [2], count: 2 }), [D(2024, 2, 13), D(2024, 3, 12)]);
  assert.deepEqual(expandMonthly({ start: D(2024, 1, 10), byWeekday: [6, 7], bySetPos: [1, -1], count: 3 }), [D(2024, 1, 28), D(2024, 2, 3), D(2024, 2, 25)]);
});

test('validação e nthWeekdayOfMonth', () => {
  assert.throws(() => expandMonthly({ start: D(2024, 1, 1) }), RangeError);
  assert.throws(() => expandMonthly({ start: D(2024, 1, 1), count: 1, bySetPos: [0] }), RangeError);
  assert.throws(() => expandMonthly(null), TypeError);
  assert.equal(nthWeekdayOfMonth(2024, 2, -1, 4), 29);
  assert.equal(nthWeekdayOfMonth(2024, 2, 5, 1), null);
  assert.equal(nthWeekdayOfMonth(2024, 5, 2, 2), 14);
  assert.equal(nthWeekdayOfMonth(2025, 11, 4, 4), 27);
  assert.equal(nthWeekdayOfMonth(2024, 2, 5, 4), 29);
  assert.throws(() => nthWeekdayOfMonth(2024, 2, 0, 4), RangeError);
});

test('nthWeekdayOfMonth contando do fim', () => {
  assert.equal(nthWeekdayOfMonth(2024, 2, -1, 1), 26);
  assert.equal(nthWeekdayOfMonth(2024, 3, -1, 5), 29);
  assert.equal(nthWeekdayOfMonth(2024, 3, -2, 7), 24);
  assert.equal(nthWeekdayOfMonth(2024, 12, -1, 2), 31);
  assert.equal(nthWeekdayOfMonth(2024, 2, -5, 4), 1);
  assert.equal(nthWeekdayOfMonth(2024, 2, -5, 1), null);
});
