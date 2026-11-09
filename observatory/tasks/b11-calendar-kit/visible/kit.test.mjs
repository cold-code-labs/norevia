import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffMonths } from '../src/add.mjs';
import { expand } from '../src/recur.mjs';
import { adjust } from '../src/business.mjs';
import { isoWeek } from '../src/isoweek.mjs';

const D = (y, m, d) => ({ y, m, d });

test('diffMonths conta o mês completo que termina no fim de fevereiro', () => {
  assert.equal(diffMonths(D(2024, 1, 31), D(2024, 2, 29)), 1);
});
test('recorrência semanal em vários dias da semana', () => {
  assert.deepEqual(expand({ freq: 'weekly', start: D(2024, 1, 3), byWeekday: [3, 1], count: 3 }), [D(2024, 1, 3), D(2024, 1, 8), D(2024, 1, 10)]);
});
test('modifiedFollowing não atravessa o fim do mês', () => {
  assert.deepEqual(adjust(D(2024, 8, 31), 'modifiedFollowing'), D(2024, 8, 30));
});
test('semana ISO 53', () => {
  assert.deepEqual(isoWeek(D(2020, 12, 31)), { year: 2020, week: 53 });
});
