import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weekday, parseDate, toOrdinal, addDays } from '../src/civil.mjs';
import { codeToIso, isoToCode, startOfWeek, isoWeek, nthWeekdayOfMonth } from '../src/weekdays.mjs';
import { parseRule, formatRule, RuleError } from '../src/rrule.mjs';
import { occurrences } from '../src/expand.mjs';
import { between, nextAfter, byIsoWeek, firstN, agenda, conflicts } from '../src/query.mjs';

const D = parseDate;
const fmt = (list) => list.map((d) => `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`);

test('civil: dia da semana ISO (1 = segunda … 7 = domingo)', () => {
  assert.deepEqual(['1970-01-01', '2000-01-01', '2025-01-05', '2024-12-29', '2025-03-02', '2025-03-03', '0001-01-07'].map((s) => weekday(D(s))), [4, 6, 7, 7, 7, 1, 7]);
  for (let i = 0; i < 14; i++) assert.equal(weekday(addDays(D('2025-06-02'), i)), (i % 7) + 1);
  assert.equal(toOrdinal(D('2000-03-01')), 11017);
});

test('weekdays: códigos, início de semana e n-ésimo dia', () => {
  assert.deepEqual(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map(codeToIso), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map(isoToCode), ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']);
  assert.throws(() => isoToCode(0), RangeError);
  assert.throws(() => codeToIso('XX'), RangeError);
  assert.deepEqual(startOfWeek(D('2025-03-02')), D('2025-02-24'));
  assert.deepEqual(startOfWeek(D('2025-03-02'), 'SU'), D('2025-03-02'));
  assert.deepEqual(startOfWeek(D('2025-03-04'), 'WE'), D('2025-02-26'));
  assert.deepEqual(nthWeekdayOfMonth(2025, 3, 7, 1), D('2025-03-02'));
  assert.deepEqual(nthWeekdayOfMonth(2025, 3, 7, -1), D('2025-03-30'));
  assert.deepEqual(nthWeekdayOfMonth(2025, 3, 5, -1), D('2025-03-28'));
  assert.equal(nthWeekdayOfMonth(2025, 2, 7, 5), null);
});

test('isoWeek: viradas de ano', () => {
  const cases = { '2024-12-29': [2024, 52], '2024-12-30': [2025, 1], '2021-01-03': [2020, 53], '2020-12-31': [2020, 53], '2026-01-04': [2026, 1], '2027-01-03': [2026, 53], '2025-06-15': [2025, 24], '2025-06-16': [2025, 25] };
  for (const [s, [year, week]] of Object.entries(cases)) assert.deepEqual(isoWeek(D(s)), { year, week }, s);
});

test('parseRule: valores como escritos', () => {
  assert.deepEqual(parseRule('FREQ=MONTHLY;BYDAY=-1FR,2SU;COUNT=4'), { freq: 'MONTHLY', interval: 1, count: 4, until: null, byday: [{ n: -1, wd: 5 }, { n: 2, wd: 7 }], bymonthday: [], wkst: 'MO' });
  assert.deepEqual(parseRule('FREQ=MONTHLY;INTERVAL=2;BYMONTHDAY=-1,15;UNTIL=20251231'), { freq: 'MONTHLY', interval: 2, count: null, until: { y: 2025, m: 12, d: 31 }, byday: [], bymonthday: [-1, 15], wkst: 'MO' });
  assert.deepEqual(parseRule('FREQ=WEEKLY;BYDAY=SU,SA;WKST=SU').byday, [{ n: 0, wd: 7 }, { n: 0, wd: 6 }]);
  assert.deepEqual(parseRule('FREQ=MONTHLY;BYMONTHDAY=-31,31,-2').bymonthday, [-31, 31, -2]);
});

test('formatRule: forma canônica e ida e volta', () => {
  assert.equal(formatRule(parseRule('BYMONTHDAY=-2,31;COUNT=3;WKST=SU;FREQ=MONTHLY')), 'FREQ=MONTHLY;BYMONTHDAY=-2,31;WKST=SU;COUNT=3');
  assert.equal(formatRule(parseRule('FREQ=WEEKLY;INTERVAL=1;BYDAY=SU,+2MO'.replace(',+2MO', ',MO'))), 'FREQ=WEEKLY;BYDAY=SU,MO');
  assert.equal(formatRule(parseRule('FREQ=MONTHLY;BYDAY=+2SU,-1SU;UNTIL=20260105')), 'FREQ=MONTHLY;BYDAY=2SU,-1SU;UNTIL=20260105');
  assert.equal(formatRule({ freq: 'MONTHLY', interval: 1, count: null, until: null, byday: [], bymonthday: [-1], wkst: 'MO' }), 'FREQ=MONTHLY;BYMONTHDAY=-1');
  for (const t of ['FREQ=MONTHLY;BYMONTHDAY=-1,-7,30', 'FREQ=WEEKLY;INTERVAL=3;BYDAY=SU;WKST=SU;COUNT=9']) {
    assert.deepEqual(parseRule(formatRule(parseRule(t))), parseRule(t));
    assert.equal(formatRule(parseRule(t)), t);
  }
});

test('parseRule: erros', () => {
  for (const t of ['', 'FREQ=YEARLY', 'FREQ=DAILY;BYDAY=MO', 'FREQ=WEEKLY;BYDAY=1MO', 'FREQ=MONTHLY;BYMONTHDAY=0', 'FREQ=MONTHLY;BYMONTHDAY=32',
    'FREQ=DAILY;COUNT=2;UNTIL=20250101', 'FREQ=DAILY;FREQ=DAILY', 'FREQ=DAILY;UNTIL=20250230', 'FREQ=MONTHLY;BYDAY=MO;BYMONTHDAY=1', 'FREQ=DAILY;INTERVAL=0', 'FREQ=WEEKLY;WKST=XX']) {
    assert.throws(() => parseRule(t), RuleError, t);
  }
  assert.throws(() => parseRule(null), TypeError);
});

test('mensal: dias inexistentes são ignorados; negativos contam do fim', () => {
  assert.deepEqual(between('FREQ=MONTHLY;BYMONTHDAY=31', '2025-01-01', '2025-01-01', '2025-08-31'), ['2025-01-31', '2025-03-31', '2025-05-31', '2025-07-31', '2025-08-31']);
  assert.deepEqual(between('FREQ=MONTHLY;BYMONTHDAY=-2,1', '2024-01-15', '2024-01-01', '2024-05-01'), ['2024-01-30', '2024-02-01', '2024-02-28', '2024-03-01', '2024-03-30', '2024-04-01', '2024-04-29', '2024-05-01']);
  assert.deepEqual(between('FREQ=MONTHLY;BYMONTHDAY=30,-31', '2025-01-01', '2025-01-01', '2025-04-30'), ['2025-01-01', '2025-01-30', '2025-03-01', '2025-03-30', '2025-04-30']);
  assert.deepEqual(between('FREQ=MONTHLY;INTERVAL=3', '2025-01-31', '2025-01-01', '2025-12-31'), ['2025-01-31', '2025-07-31', '2025-10-31']);
});

test('semanal: semanas contadas a partir da semana de dtstart, conforme WKST', () => {
  assert.deepEqual(between('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR', '2025-03-05', '2025-03-01', '2025-04-15'), ['2025-03-07', '2025-03-17', '2025-03-21', '2025-03-31', '2025-04-04', '2025-04-14']);
  assert.deepEqual(between('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,SA;WKST=SU', '2025-03-04', '2025-03-01', '2025-04-15'), ['2025-03-08', '2025-03-17', '2025-03-22', '2025-03-31', '2025-04-05', '2025-04-14']);
  assert.deepEqual(between('FREQ=WEEKLY;INTERVAL=2;BYDAY=SU,WE', '2025-03-02', '2025-03-01', '2025-03-31'), ['2025-03-02', '2025-03-12', '2025-03-16', '2025-03-26', '2025-03-30']);
  assert.deepEqual(between('FREQ=WEEKLY;INTERVAL=3;BYDAY=TU,TH;WKST=WE', '2025-03-03', '2025-03-01', '2025-04-10'), ['2025-03-04', '2025-03-20', '2025-03-25', '2025-04-10']);
  assert.deepEqual(between('FREQ=WEEKLY;INTERVAL=2;WKST=SU', '2024-12-29', '2024-12-01', '2025-02-01'), ['2024-12-29', '2025-01-12', '2025-01-26']);
});

test('COUNT conta desde dtstart; UNTIL inclusivo; janela semiaberta de occurrences', () => {
  assert.deepEqual(between('FREQ=WEEKLY;BYDAY=TU,TH;COUNT=5', '2025-03-04', '2025-03-10', '2025-12-31'), ['2025-03-11', '2025-03-13', '2025-03-18']);
  assert.deepEqual(between('FREQ=DAILY;INTERVAL=7;UNTIL=20250131', '2025-01-03', '2025-01-01', '2025-12-31'), ['2025-01-03', '2025-01-10', '2025-01-17', '2025-01-24', '2025-01-31']);
  assert.deepEqual(fmt(occurrences('FREQ=DAILY', '2025-01-30', { from: '2025-01-31', to: '2025-02-02' })), ['2025-01-31', '2025-02-01']);
  assert.deepEqual(fmt(occurrences('FREQ=MONTHLY;BYDAY=SU;COUNT=4', '2024-12-25')), ['2024-12-29', '2025-01-05', '2025-01-12', '2025-01-19']);
  assert.throws(() => occurrences('FREQ=DAILY', '2025-01-01'), RangeError);
});

test('consultas: exdates, nextAfter, firstN', () => {
  assert.deepEqual(between('FREQ=WEEKLY;BYDAY=SU;COUNT=4', '2025-03-02', '2025-03-01', '2025-12-31', { exdates: ['2025-03-09'] }), ['2025-03-02', '2025-03-16', '2025-03-23']);
  assert.equal(nextAfter('FREQ=WEEKLY;BYDAY=SU,WE', '2025-03-02', '2025-03-02'), '2025-03-05');
  assert.equal(nextAfter('FREQ=WEEKLY;BYDAY=SU,WE', '2025-03-02', '2025-03-05', { exdates: ['2025-03-09'] }), '2025-03-12');
  assert.equal(nextAfter('FREQ=DAILY;COUNT=3', '2025-01-01', '2025-01-03'), null);
  assert.equal(nextAfter('FREQ=MONTHLY;BYMONTHDAY=31', '2025-01-31', '2025-03-31'), '2025-05-31');
  assert.deepEqual(firstN('FREQ=MONTHLY;BYDAY=1SU,-1SA', '2025-01-01', 4), ['2025-01-05', '2025-01-25', '2025-02-02', '2025-02-22']);
  assert.throws(() => between('FREQ=DAILY', '2025-01-01', '2025-02-01', '2025-01-01'), RangeError);
});

test('byIsoWeek e agenda na virada do ano', () => {
  assert.deepEqual(byIsoWeek('FREQ=WEEKLY;BYDAY=SU,TH', '2024-12-01', '2024-12-20', '2025-01-10'), { '2024-W51': ['2024-12-22'], '2024-W52': ['2024-12-26', '2024-12-29'], '2025-W01': ['2025-01-02', '2025-01-05'], '2025-W02': ['2025-01-09'] });
  assert.deepEqual(byIsoWeek('FREQ=WEEKLY;INTERVAL=2;BYDAY=SA,SU;WKST=SA', '2020-12-26', '2020-12-26', '2021-01-24'), { '2020-W52': ['2020-12-26', '2020-12-27'], '2021-W01': ['2021-01-09', '2021-01-10'], '2021-W03': ['2021-01-23', '2021-01-24'] });
  const events = [
    { name: 'plantao', rule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=SU,WE', dtstart: '2025-03-02' },
    { name: 'backup', rule: 'FREQ=MONTHLY;BYMONTHDAY=-20,12', dtstart: '2025-03-01' },
    { name: 'revisao', rule: 'FREQ=MONTHLY;BYDAY=2SU', dtstart: '2025-01-01', exdates: ['2025-04-13'] },
  ];
  assert.deepEqual(conflicts(events, '2025-03-01', '2025-04-30'), { '2025-03-12': ['backup', 'plantao'], '2025-03-09': undefined }['2025-03-12'] && { '2025-03-12': ['backup', 'plantao'] });
  assert.deepEqual(agenda(events, '2025-03-01', '2025-03-16').map((e) => `${e.date}:${e.name}`), ['2025-03-02:plantao', '2025-03-09:revisao', '2025-03-12:backup', '2025-03-12:plantao', '2025-03-16:plantao']);
});
