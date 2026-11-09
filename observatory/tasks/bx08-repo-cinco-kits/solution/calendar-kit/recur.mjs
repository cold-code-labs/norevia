/**
 * Expansão de regras de recorrência (diária, semanal, mensal) sobre datas `{ y, m, d }`.
 */
import { assertDate, daysInMonth, toOrdinal, fromOrdinal, dayOfWeek } from './civil.mjs';

const FREQS = new Set(['daily', 'weekly', 'monthly']);
const MAX_ORDINAL = toOrdinal({ y: 9999, m: 12, d: 31 });

function isWeekday(v) {
  return Number.isInteger(v) && v >= 1 && v <= 7;
}

function validate(rule) {
  if (rule === null || typeof rule !== 'object') throw new TypeError('regra deve ser um objeto');
  const { freq, start, interval = 1, count, until, byWeekday, byMonthDay, byNthWeekday } = rule;
  if (!FREQS.has(freq)) throw new RangeError(`freq inválida: ${freq}`);
  assertDate(start);
  if (!Number.isInteger(interval) || interval < 1) throw new RangeError('interval deve ser inteiro >= 1');
  if (count === undefined && until === undefined) throw new RangeError('informe count ou until');
  if (count !== undefined && (!Number.isInteger(count) || count < 0)) throw new RangeError('count deve ser inteiro >= 0');
  if (until !== undefined) assertDate(until);
  if (byWeekday !== undefined) {
    if (freq !== 'weekly') throw new RangeError('byWeekday só vale para weekly');
    if (!Array.isArray(byWeekday) || byWeekday.length === 0 || !byWeekday.every(isWeekday)) {
      throw new RangeError('byWeekday deve ser lista não-vazia de 1..7');
    }
  }
  if (byMonthDay !== undefined || byNthWeekday !== undefined) {
    if (freq !== 'monthly') throw new RangeError('byMonthDay/byNthWeekday só valem para monthly');
    if (byMonthDay !== undefined && byNthWeekday !== undefined) throw new RangeError('use byMonthDay ou byNthWeekday');
  }
  if (byMonthDay !== undefined && (!Number.isInteger(byMonthDay) || byMonthDay === 0 || Math.abs(byMonthDay) > 31)) {
    throw new RangeError('byMonthDay deve estar em 1..31 ou -31..-1');
  }
  if (byNthWeekday !== undefined) {
    const { n, weekday } = byNthWeekday;
    if (!Number.isInteger(n) || n === 0 || Math.abs(n) > 5 || !isWeekday(weekday)) {
      throw new RangeError('byNthWeekday inválido');
    }
  }
  return { freq, start, interval, count, until, byWeekday, byMonthDay, byNthWeekday };
}

/** Dia do mês da n-ésima ocorrência de `weekday` (n negativo conta do fim); null se não existir. */
export function nthWeekdayOfMonth(y, m, n, weekday) {
  const dim = daysInMonth(y, m);
  if (n > 0) {
    const first = dayOfWeek({ y, m, d: 1 });
    const d = 1 + ((weekday - first + 7) % 7) + 7 * (n - 1);
    return d <= dim ? d : null;
  }
  const last = dayOfWeek({ y, m, d: dim });
  const d = dim - ((last - weekday + 7) % 7) - 7 * (-n - 1);
  return d >= 1 ? d : null;
}

function monthDay(y, m, byMonthDay) {
  const dim = daysInMonth(y, m);
  const d = byMonthDay > 0 ? byMonthDay : dim + 1 + byMonthDay;
  return d >= 1 && d <= dim ? d : null;
}

/**
 * Expande a regra em ordem crescente de datas. Ver contrato no enunciado.
 * @returns {{y:number,m:number,d:number}[]}
 */
export function expand(rule) {
  const r = validate(rule);
  const out = [];
  const startOrd = toOrdinal(r.start);
  const untilOrd = r.until === undefined ? MAX_ORDINAL : Math.min(MAX_ORDINAL, toOrdinal(r.until));
  const limit = r.count === undefined ? Infinity : r.count;
  // false = parar a expansão
  const emit = (ord) => {
    if (ord < startOrd) return true;
    if (ord > untilOrd || out.length >= limit) return false;
    out.push(fromOrdinal(ord));
    return true;
  };

  if (r.freq === 'daily') {
    for (let ord = startOrd; emit(ord); ord += r.interval);
    return out;
  }

  if (r.freq === 'weekly') {
    const days = new Set(r.byWeekday ?? [dayOfWeek(r.start)]);
    const monday0 = startOrd - (dayOfWeek(r.start) - 1);
    for (let ord = startOrd; ; ord++) {
      const weekday = ((ord - monday0) % 7) + 1;
      const week = Math.floor((ord - monday0) / 7);
      if (week % r.interval === 0 && days.has(weekday) && !emit(ord)) return out;
    }
  }

  const base = r.start.y * 12 + (r.start.m - 1);
  for (let k = 0; ; k++) {
    const total = base + k * r.interval;
    const y = Math.floor(total / 12);
    const m = total - y * 12 + 1;
    if (y > 9999 || toOrdinal({ y, m, d: 1 }) > untilOrd || out.length >= limit) return out;
    const d = r.byNthWeekday
      ? nthWeekdayOfMonth(y, m, r.byNthWeekday.n, r.byNthWeekday.weekday)
      : monthDay(y, m, r.byMonthDay ?? r.start.d);
    if (d !== null && !emit(toOrdinal({ y, m, d }))) return out;
  }
}
