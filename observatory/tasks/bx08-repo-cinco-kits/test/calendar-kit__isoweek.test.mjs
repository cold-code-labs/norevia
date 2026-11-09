import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isoWeeksInYear, isoWeek, fromIsoWeek, formatIsoWeek, parseIsoWeek } from '../src/calendar-kit/isoweek.mjs';

const D = (y, m, d) => ({ y, m, d });

test('isoWeeksInYear', () => {
  for (const [y, n] of [[2020, 53], [2015, 53], [2026, 53], [2009, 53], [1992, 53], [2021, 52], [2024, 52], [2019, 52], [2025, 52]]) assert.equal(isoWeeksInYear(y), n, String(y));
  assert.throws(() => isoWeeksInYear(0), RangeError);
});

test('isoWeek no meio e no fim do ano', () => {
  assert.deepEqual(isoWeek(D(2024, 1, 1)), { year: 2024, week: 1 });
  assert.deepEqual(isoWeek(D(2024, 6, 15)), { year: 2024, week: 24 });
  assert.deepEqual(isoWeek(D(2024, 12, 30)), { year: 2025, week: 1 });
  assert.deepEqual(isoWeek(D(2020, 12, 31)), { year: 2020, week: 53 });
  assert.deepEqual(isoWeek(D(2026, 12, 31)), { year: 2026, week: 53 });
  assert.deepEqual(isoWeek(D(2025, 12, 28)), { year: 2025, week: 52 });
});

test('isoWeek no início de janeiro pertence ao ano ISO anterior', () => {
  assert.deepEqual(isoWeek(D(2021, 1, 1)), { year: 2020, week: 53 });
  assert.deepEqual(isoWeek(D(2021, 1, 3)), { year: 2020, week: 53 });
  assert.deepEqual(isoWeek(D(2021, 1, 4)), { year: 2021, week: 1 });
  assert.deepEqual(isoWeek(D(2016, 1, 1)), { year: 2015, week: 53 });
  assert.deepEqual(isoWeek(D(2010, 1, 3)), { year: 2009, week: 53 });
  assert.deepEqual(isoWeek(D(2023, 1, 1)), { year: 2022, week: 52 });
  assert.deepEqual(isoWeek(D(2027, 1, 1)), { year: 2026, week: 53 });
});

test('fromIsoWeek', () => {
  assert.deepEqual(fromIsoWeek(2020, 53, 4), D(2020, 12, 31));
  assert.deepEqual(fromIsoWeek(2021, 1), D(2021, 1, 4));
  assert.deepEqual(fromIsoWeek(2025, 1, 1), D(2024, 12, 30));
  assert.deepEqual(fromIsoWeek(2026, 53, 7), D(2027, 1, 3));
  assert.throws(() => fromIsoWeek(2021, 53), RangeError);
  assert.throws(() => fromIsoWeek(2024, 0), RangeError);
  assert.throws(() => fromIsoWeek(2024, 1, 8), RangeError);
});

test('isoWeek e fromIsoWeek são inversos em todas as datas de 2014 a 2028', () => {
  for (let y = 2014; y <= 2028; y++) {
    for (let m = 1; m <= 12; m++) {
      for (const d of [1, 2, 3, 4, 28]) {
        const { year, week } = isoWeek(D(y, m, d));
        const back = fromIsoWeek(year, week, ((new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7) + 1);
        assert.deepEqual(back, D(y, m, d), `${y}-${m}-${d}`);
      }
    }
  }
});

test('formatIsoWeek e parseIsoWeek', () => {
  assert.equal(formatIsoWeek({ year: 2020, week: 3 }), '2020-W03');
  assert.equal(formatIsoWeek({ year: 2020, week: 53 }, 7), '2020-W53-7');
  assert.deepEqual(parseIsoWeek('2020-W53-4'), { year: 2020, week: 53, weekday: 4 });
  assert.deepEqual(parseIsoWeek('2024-W01'), { year: 2024, week: 1 });
  assert.throws(() => parseIsoWeek('2021-W53'), RangeError);
  assert.throws(() => parseIsoWeek('2021-W5'), RangeError);
  assert.throws(() => parseIsoWeek('2021-W01-8'), RangeError);
  assert.throws(() => parseIsoWeek(5), TypeError);
});
