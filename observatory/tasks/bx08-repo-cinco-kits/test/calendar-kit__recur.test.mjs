import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expand, nthWeekdayOfMonth } from '../src/calendar-kit/recur.mjs';

const D = (y, m, d) => ({ y, m, d });

test('diária: interval, until inclusivo e count', () => {
  assert.deepEqual(expand({ freq: 'daily', start: D(2024, 2, 26), interval: 3, until: D(2024, 3, 4) }), [D(2024, 2, 26), D(2024, 2, 29), D(2024, 3, 3)]);
  assert.deepEqual(expand({ freq: 'daily', start: D(2024, 2, 26), interval: 3, until: D(2024, 3, 3) }), [D(2024, 2, 26), D(2024, 2, 29), D(2024, 3, 3)]);
  assert.deepEqual(expand({ freq: 'daily', start: D(2024, 12, 31), count: 2 }), [D(2024, 12, 31), D(2025, 1, 1)]);
  assert.deepEqual(expand({ freq: 'daily', start: D(2024, 1, 1), count: 0 }), []);
  assert.deepEqual(expand({ freq: 'daily', start: D(2024, 1, 1), count: 10, until: D(2024, 1, 2) }), [D(2024, 1, 1), D(2024, 1, 2)]);
  assert.deepEqual(expand({ freq: 'daily', start: D(2024, 1, 5), until: D(2024, 1, 4) }), []);
});

test('semanal: dia da semana do início por padrão', () => {
  assert.deepEqual(expand({ freq: 'weekly', start: D(2024, 1, 3), count: 3 }), [D(2024, 1, 3), D(2024, 1, 10), D(2024, 1, 17)]);
  assert.deepEqual(expand({ freq: 'weekly', start: D(2024, 1, 3), interval: 2, until: D(2024, 2, 1) }), [D(2024, 1, 3), D(2024, 1, 17), D(2024, 1, 31)]);
});

test('semanal quinzenal com vários dias: semanas começam na segunda', () => {
  assert.deepEqual(expand({ freq: 'weekly', start: D(2024, 1, 3), interval: 2, byWeekday: [5, 1], count: 5 }), [D(2024, 1, 5), D(2024, 1, 15), D(2024, 1, 19), D(2024, 1, 29), D(2024, 2, 2)]);
});

test('semanal com início no domingo e interval 3', () => {
  assert.deepEqual(expand({ freq: 'weekly', start: D(2024, 1, 7), interval: 3, byWeekday: [1, 7], count: 4 }), [D(2024, 1, 7), D(2024, 1, 22), D(2024, 1, 28), D(2024, 2, 12)]);
});

test('mensal por dia do mês: meses sem o dia são pulados', () => {
  assert.deepEqual(expand({ freq: 'monthly', start: D(2024, 1, 31), count: 4 }), [D(2024, 1, 31), D(2024, 3, 31), D(2024, 5, 31), D(2024, 7, 31)]);
  assert.deepEqual(expand({ freq: 'monthly', start: D(2024, 1, 15), byMonthDay: -1, count: 3 }), [D(2024, 1, 31), D(2024, 2, 29), D(2024, 3, 31)]);
  assert.deepEqual(expand({ freq: 'monthly', start: D(2024, 1, 20), byMonthDay: 5, count: 2 }), [D(2024, 2, 5), D(2024, 3, 5)]);
  assert.deepEqual(expand({ freq: 'monthly', start: D(2024, 11, 15), interval: 2, count: 3 }), [D(2024, 11, 15), D(2025, 1, 15), D(2025, 3, 15)]);
});

test('mensal por n-ésimo dia da semana', () => {
  assert.deepEqual(expand({ freq: 'monthly', start: D(2024, 1, 1), byNthWeekday: { n: 2, weekday: 2 }, count: 3 }), [D(2024, 1, 9), D(2024, 2, 13), D(2024, 3, 12)]);
  assert.deepEqual(expand({ freq: 'monthly', start: D(2024, 1, 1), byNthWeekday: { n: -1, weekday: 5 }, until: D(2024, 4, 30) }), [D(2024, 1, 26), D(2024, 2, 23), D(2024, 3, 29), D(2024, 4, 26)]);
  assert.deepEqual(expand({ freq: 'monthly', start: D(2024, 1, 1), byNthWeekday: { n: 5, weekday: 1 }, count: 2 }), [D(2024, 1, 29), D(2024, 4, 29)]);
  assert.deepEqual(expand({ freq: 'monthly', start: D(2024, 1, 10), byNthWeekday: { n: 2, weekday: 2 }, count: 2 }), [D(2024, 2, 13), D(2024, 3, 12)]);
  assert.equal(nthWeekdayOfMonth(2024, 2, -1, 4), 29);
  assert.equal(nthWeekdayOfMonth(2024, 2, 5, 4), 29);
  assert.equal(nthWeekdayOfMonth(2024, 2, 5, 5), null);
  assert.equal(nthWeekdayOfMonth(2024, 2, -5, 5), null);
});

test('validação da regra', () => {
  const s = D(2024, 1, 1);
  assert.throws(() => expand(null), TypeError);
  assert.throws(() => expand({ freq: 'yearly', start: s, count: 1 }), RangeError);
  assert.throws(() => expand({ freq: 'daily', start: s }), RangeError);
  assert.throws(() => expand({ freq: 'daily', start: s, count: 1, interval: 0 }), RangeError);
  assert.throws(() => expand({ freq: 'daily', start: s, count: 1, byWeekday: [1] }), RangeError);
  assert.throws(() => expand({ freq: 'weekly', start: s, count: 1, byWeekday: [0] }), RangeError);
  assert.throws(() => expand({ freq: 'monthly', start: s, count: 1, byMonthDay: 1, byNthWeekday: { n: 1, weekday: 1 } }), RangeError);
  assert.throws(() => expand({ freq: 'monthly', start: s, count: 1, byMonthDay: 0 }), RangeError);
  assert.throws(() => expand({ freq: 'monthly', start: s, count: 1, byNthWeekday: { n: 6, weekday: 1 } }), RangeError);
  assert.throws(() => expand({ freq: 'daily', start: D(2023, 2, 29), count: 1 }), RangeError);
});
