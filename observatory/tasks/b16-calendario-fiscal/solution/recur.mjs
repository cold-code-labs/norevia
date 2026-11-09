/**
 * Recorrência mensal no estilo RRULE (FREQ=MONTHLY com BYMONTHDAY, BYDAY e BYSETPOS).
 */
import { assertDate, daysInMonth, toOrdinal, dayOfWeek } from './civil.mjs';

function intList(v, name, ok) {
  if (!Array.isArray(v) || v.length === 0 || !v.every((x) => Number.isInteger(x) && ok(x))) {
    throw new RangeError(`${name} inválido`);
  }
  return v;
}

function validate(rule) {
  if (rule === null || typeof rule !== 'object') throw new TypeError('regra deve ser objeto');
  assertDate(rule.start);
  const interval = rule.interval ?? 1;
  if (!Number.isInteger(interval) || interval < 1) throw new RangeError('interval inválido');
  if (rule.count === undefined && rule.until === undefined) throw new RangeError('count ou until obrigatório');
  if (rule.count !== undefined && (!Number.isInteger(rule.count) || rule.count < 0)) throw new RangeError('count inválido');
  if (rule.until !== undefined) assertDate(rule.until);
  const byMonthDay = rule.byMonthDay === undefined ? null : intList(rule.byMonthDay, 'byMonthDay', (x) => x !== 0 && x >= -31 && x <= 31);
  const byWeekday = rule.byWeekday === undefined ? null : intList(rule.byWeekday, 'byWeekday', (x) => x >= 1 && x <= 7);
  const bySetPos = rule.bySetPos === undefined ? null : intList(rule.bySetPos, 'bySetPos', (x) => x !== 0 && x >= -31 && x <= 31);
  return { interval, byMonthDay, byWeekday, bySetPos };
}

/** Dias (1..31) do mês que satisfazem os filtros, em ordem crescente. */
function monthCandidates(y, m, byMonthDay, byWeekday) {
  const dim = daysInMonth(y, m);
  const days = [];
  for (let d = 1; d <= dim; d++) {
    if (byMonthDay && !byMonthDay.some((v) => (v > 0 ? v : dim + 1 + v) === d)) continue;
    if (byWeekday && !byWeekday.includes(dayOfWeek({ y, m, d }))) continue;
    days.push(d);
  }
  return days;
}

function applySetPos(days, bySetPos) {
  const picked = new Set();
  for (const p of bySetPos) {
    const i = p > 0 ? p - 1 : days.length + p;
    if (i >= 0 && i < days.length) picked.add(days[i]);
  }
  return [...picked].sort((a, b) => a - b);
}

export function expandMonthly(rule) {
  const { interval, byMonthDay, byWeekday, bySetPos } = validate(rule);
  const { start } = rule;
  const startOrd = toOrdinal(start);
  const untilOrd = rule.until === undefined ? Infinity : toOrdinal(rule.until);
  const count = rule.count ?? Infinity;
  const md = byMonthDay ?? (byWeekday ? null : [start.d]);
  const out = [];
  for (let k = 0; out.length < count; k += interval) {
    const idx = start.m - 1 + k;
    const y = start.y + Math.floor(idx / 12);
    const m = (idx % 12) + 1;
    if (y > 9999) break;
    if (toOrdinal({ y, m, d: 1 }) > untilOrd) break;
    let days = monthCandidates(y, m, md, byWeekday);
    if (bySetPos) days = applySetPos(days, bySetPos);
    for (const d of days) {
      const ord = toOrdinal({ y, m, d });
      if (ord < startOrd) continue;
      if (ord > untilOrd || out.length >= count) break;
      out.push({ y, m, d });
    }
  }
  return out;
}

/** Dia do mês da `n`-ésima ocorrência de `weekday` (n < 0 conta do fim) ou null. */
export function nthWeekdayOfMonth(y, m, n, weekday) {
  if (!Number.isInteger(n) || n === 0 || n < -5 || n > 5) throw new RangeError(`n inválido: ${n}`);
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) throw new RangeError(`weekday inválido: ${weekday}`);
  const dim = daysInMonth(y, m);
  let day;
  if (n > 0) {
    const first = 1 + ((weekday - dayOfWeek({ y, m, d: 1 }) + 7) % 7);
    day = first + 7 * (n - 1);
  } else {
    const last = dim - ((dayOfWeek({ y, m, d: dim }) - weekday + 7) % 7);
    day = last + 7 * (n + 1);
  }
  return day >= 1 && day <= dim ? day : null;
}
