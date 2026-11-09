import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isoWeeksInYear, isoWeek, fromIsoWeek, isoWeekRange, formatIsoWeek, parseIsoWeek } from '../src/isoweek.mjs';

const D = (y, m, d) => ({ y, m, d });

test('isoWeeksInYear', () => {
  for (const [y, n] of [[2020, 53], [2015, 53], [2026, 53], [2004, 53], [2021, 52], [2024, 52], [2025, 52]]) assert.equal(isoWeeksInYear(y), n, String(y));
  assert.throws(() => isoWeeksInYear(0), RangeError);
});

test('isoWeek nas viradas de ano', () => {
  assert.deepEqual(isoWeek(D(2024, 12, 30)), { year: 2025, week: 1 });
  assert.deepEqual(isoWeek(D(2021, 1, 3)), { year: 2020, week: 53 });
  assert.deepEqual(isoWeek(D(2026, 1, 1)), { year: 2026, week: 1 });
  assert.deepEqual(isoWeek(D(2025, 12, 29)), { year: 2026, week: 1 });
  assert.deepEqual(isoWeek(D(2027, 1, 1)), { year: 2026, week: 53 });
});

test('fromIsoWeek quando 1º de janeiro não é quinta-feira', () => {
  assert.deepEqual(fromIsoWeek(2025, 1), D(2024, 12, 30));
  assert.deepEqual(fromIsoWeek(2021, 1), D(2021, 1, 4));
  assert.deepEqual(fromIsoWeek(2020, 53, 4), D(2020, 12, 31));
  assert.deepEqual(fromIsoWeek(2027, 1, 7), D(2027, 1, 10));
  assert.throws(() => fromIsoWeek(2021, 53), RangeError);
  assert.throws(() => fromIsoWeek(2024, 1, 0), RangeError);
});

test('fromIsoWeek quando 1º de janeiro é quinta-feira', () => {
  assert.deepEqual(fromIsoWeek(2026, 1), D(2025, 12, 29));
  assert.deepEqual(fromIsoWeek(2015, 1, 4), D(2015, 1, 1));
  assert.deepEqual(fromIsoWeek(2026, 53, 7), D(2027, 1, 3));
  assert.deepEqual(isoWeekRange(2009, 1), { start: D(2008, 12, 29), end: D(2009, 1, 4) });
});

test('isoWeek e fromIsoWeek são inversos', () => {
  for (let y = 2013; y <= 2028; y++) {
    for (const [m, d] of [[1, 1], [1, 3], [1, 5], [6, 15], [12, 28], [12, 31]]) {
      const date = D(y, m, d);
      const { year, week } = isoWeek(date);
      const wd = ((new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7) + 1;
      assert.deepEqual(fromIsoWeek(year, week, wd), date, `${y}-${m}-${d}`);
    }
  }
});

test('formatIsoWeek e parseIsoWeek', () => {
  assert.equal(formatIsoWeek({ year: 2020, week: 3 }), '2020-W03');
  assert.equal(formatIsoWeek({ year: 2020, week: 53 }, 7), '2020-W53-7');
  assert.deepEqual(parseIsoWeek('2026-W53-4'), { year: 2026, week: 53, weekday: 4 });
  assert.throws(() => parseIsoWeek('2021-W53'), RangeError);
  assert.throws(() => parseIsoWeek(5), TypeError);
});

test('isoWeek no fim de dezembro', () => {
  assert.deepEqual(isoWeek(D(2019, 12, 30)), { year: 2020, week: 1 });
  assert.deepEqual(isoWeek(D(2015, 12, 31)), { year: 2015, week: 53 });
  assert.deepEqual(isoWeek(D(2020, 12, 31)), { year: 2020, week: 53 });
  assert.deepEqual(isoWeek(D(2031, 12, 29)), { year: 2032, week: 1 });
  assert.deepEqual(isoWeek(D(2030, 12, 30)), { year: 2031, week: 1 });
});
