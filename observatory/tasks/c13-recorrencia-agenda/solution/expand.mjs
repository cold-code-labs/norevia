/**
 * Expansão de regras de recorrência em datas concretas.
 */
import { addDays, compareDates, daysInMonth, weekday, assertDate, parseDate } from './civil.mjs';
import { codeToIso, nthWeekdayOfMonth, weekdaysInMonth } from './weekdays.mjs';
import { parseRule } from './rrule.mjs';

const MAX_PERIODS = 50000;

export function toDate(value) {
  return typeof value === 'string' ? parseDate(value) : assertDate(value);
}

function monthCandidates(rule, start, y, m) {
  const dim = daysInMonth(y, m);
  const days = new Set();
  if (rule.bymonthday.length) {
    for (const md of rule.bymonthday) {
      const d = md > 0 ? md : dim + md + 1;
      if (d >= 1 && d <= dim) days.add(d);
    }
  } else if (rule.byday.length) {
    for (const { n, wd } of rule.byday) {
      if (n === 0) {
        for (const date of weekdaysInMonth(y, m, wd)) days.add(date.d);
      } else {
        const date = nthWeekdayOfMonth(y, m, wd, n);
        if (date) days.add(date.d);
      }
    }
  } else if (start.d <= dim) {
    days.add(start.d);
  }
  return [...days].sort((a, b) => a - b).map((d) => ({ y, m, d }));
}

/** Gera, período a período, as datas candidatas (em ordem cronológica). */
function* periods(rule, start) {
  if (rule.freq === 'DAILY') {
    for (let p = 0; ; p++) yield [addDays(start, p * rule.interval)];
  }
  if (rule.freq === 'WEEKLY') {
    const wanted = rule.byday.length ? rule.byday.map((b) => b.wd) : [weekday(start)];
    const anchor = addDays(start, -((weekday(start) - codeToIso(rule.wkst) + 7) % 7));
    for (let p = 0; ; p++) {
      const first = addDays(anchor, 7 * p * rule.interval);
      const batch = [];
      for (let i = 0; i < 7; i++) {
        const date = addDays(first, i);
        if (wanted.includes(weekday(date))) batch.push(date);
      }
      yield batch;
    }
  }
  const base = start.y * 12 + (start.m - 1);
  for (let p = 0; ; p++) {
    const idx = base + p * rule.interval;
    const y = Math.floor(idx / 12);
    if (y > 9999) return;
    yield monthCandidates(rule, start, y, (idx % 12) + 1);
  }
}

/**
 * Ocorrências da regra a partir de dtstart, dentro da janela [from, to).
 * COUNT conta desde dtstart (não desde from); UNTIL é inclusivo.
 */
export function occurrences(rule, dtstart, { from, to, limit } = {}) {
  const r = typeof rule === 'string' ? parseRule(rule) : rule;
  const start = toDate(dtstart);
  const lo = from === undefined ? start : toDate(from);
  const hi = to === undefined ? null : toDate(to);
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 0)) throw new RangeError(`limit inválido: ${limit}`);
  if (hi === null && limit === undefined && r.count === null && r.until === null) throw new RangeError('expansão sem fim');
  const out = [];
  if (limit === 0) return out;
  let seen = 0;
  let n = 0;
  for (const batch of periods(r, start)) {
    if (++n > MAX_PERIODS) break;
    for (const date of batch) {
      if (compareDates(date, start) < 0) continue;
      if (r.until !== null && compareDates(date, r.until) > 0) return out;
      if (hi !== null && compareDates(date, hi) >= 0) return out;
      seen++;
      if (r.count !== null && seen > r.count) return out;
      if (compareDates(date, lo) >= 0) {
        out.push(date);
        if (limit !== undefined && out.length >= limit) return out;
      }
    }
  }
  return out;
}
