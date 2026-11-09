/**
 * Semanas ISO 8601: começam na segunda-feira; a semana 1 de um ano ISO é a primeira
 * semana com pelo menos quatro dias nesse ano.
 */
import { assertDate, isLeapYear, toOrdinal, fromOrdinal, dayOfWeek } from './civil.mjs';

function assertYear(year) {
  if (!Number.isInteger(year) || year < 1 || year > 9999) throw new RangeError(`ano inválido: ${year}`);
}

export function isoWeeksInYear(year) {
  assertYear(year);
  const jan1 = dayOfWeek({ y: year, m: 1, d: 1 });
  return jan1 === 4 || (jan1 === 3 && isLeapYear(year)) ? 53 : 52;
}

/** Ordinal da segunda-feira da semana 1 do ano ISO `year`. */
function mondayOfWeek1(year) {
  const jan1 = { y: year, m: 1, d: 1 };
  const wd = dayOfWeek(jan1);
  return toOrdinal(jan1) - (wd - 1) + (wd > 4 ? 7 : 0);
}

export function isoWeek(date) {
  assertDate(date);
  const doy = toOrdinal(date) - toOrdinal({ y: date.y, m: 1, d: 1 }) + 1;
  const week = Math.floor((doy - dayOfWeek(date) + 10) / 7);
  if (week < 1) return { year: date.y - 1, week: isoWeeksInYear(date.y - 1) };
  if (week > isoWeeksInYear(date.y + 1)) return { year: date.y + 1, week: 1 };
  return { year: date.y, week };
}

export function fromIsoWeek(year, week, weekday = 1) {
  assertYear(year);
  if (!Number.isInteger(week) || week < 1 || week > isoWeeksInYear(year)) throw new RangeError(`semana inválida: ${week}`);
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) throw new RangeError(`dia inválido: ${weekday}`);
  return fromOrdinal(mondayOfWeek1(year) + 7 * (week - 1) + (weekday - 1));
}

export function isoWeekRange(year, week) {
  return { start: fromIsoWeek(year, week, 1), end: fromIsoWeek(year, week, 7) };
}

export function formatIsoWeek({ year, week }, weekday) {
  assertYear(year);
  const base = `${String(year).padStart(4, '0')}-W${String(week).padStart(2, '0')}`;
  return weekday === undefined ? base : `${base}-${weekday}`;
}

export function parseIsoWeek(text) {
  if (typeof text !== 'string') throw new TypeError('parseIsoWeek espera string');
  const m = /^(\d{4})-W(\d{2})(?:-([1-7]))?$/.exec(text);
  if (!m) throw new RangeError(`formato inválido: ${text}`);
  const year = Number(m[1]);
  const week = Number(m[2]);
  assertYear(year);
  if (week < 1 || week > isoWeeksInYear(year)) throw new RangeError(`semana inválida: ${text}`);
  return m[3] === undefined ? { year, week } : { year, week, weekday: Number(m[3]) };
}
