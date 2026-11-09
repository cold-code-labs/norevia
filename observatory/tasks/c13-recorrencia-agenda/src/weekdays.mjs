/**
 * Códigos de dia da semana, início de semana, n-ésimo dia da semana no mês e semana ISO.
 */
import { addDays, daysInMonth, weekday, dayOfYear, assertDate } from './civil.mjs';

export const WEEKDAY_CODES = Object.freeze(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']);

const ISO = Object.freeze({ SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 });

export function codeToIso(code) {
  if (!Object.hasOwn(ISO, code)) throw new RangeError(`código de dia inválido: ${code}`);
  return ISO[code];
}

export function isoToCode(n) {
  const code = WEEKDAY_CODES.find((c) => ISO[c] === n);
  if (code === undefined) throw new RangeError(`dia da semana inválido: ${n}`);
  return code;
}

/** Data mais recente <= date cujo dia da semana é `wkst`. */
export function startOfWeek(date, wkst = 'MO') {
  const back = (weekday(date) - codeToIso(wkst) + 7) % 7;
  return addDays(date, -back);
}

/** Todas as datas do mês (y, m) com dia da semana ISO `iso`, em ordem. */
export function weekdaysInMonth(y, m, iso) {
  const first = weekday({ y, m, d: 1 });
  const out = [];
  for (let d = 1 + ((iso - first + 7) % 7); d <= daysInMonth(y, m); d += 7) out.push({ y, m, d });
  return out;
}

/** n-ésima ocorrência (n > 0) ou n-ésima a partir do fim (n < 0) do dia `iso` no mês; null se não existe. */
export function nthWeekdayOfMonth(y, m, iso, n) {
  if (!Number.isInteger(n) || n === 0 || n < -5 || n > 5) throw new RangeError(`n inválido: ${n}`);
  const dim = daysInMonth(y, m);
  if (n > 0) {
    const first = weekday({ y, m, d: 1 });
    const d = 1 + ((iso - first + 7) % 7) + (n - 1) * 7;
    return d <= dim ? { y, m, d } : null;
  }
  const last = weekday({ y, m, d: dim });
  const d = dim - ((last - iso + 7) % 7) + (n + 1) * 7;
  return d >= 1 ? { y, m, d } : null;
}

/** Semana ISO 8601: { year, week }. */
export function isoWeek(date) {
  assertDate(date);
  const thursday = addDays(date, 4 - weekday(date));
  return { year: thursday.y, week: Math.floor((dayOfYear(thursday) - 1) / 7) + 1 };
}
