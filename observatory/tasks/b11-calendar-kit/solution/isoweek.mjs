/**
 * Semanas ISO 8601: semanas começam na segunda-feira e a semana 1 de um ano é a que
 * contém a primeira quinta-feira (equivalentemente, o dia 4 de janeiro).
 */
import { assertDate, isLeapYear, toOrdinal, fromOrdinal, dayOfWeek } from './civil.mjs';

function assertYear(year) {
  if (!Number.isInteger(year) || year < 1 || year > 9999) throw new RangeError(`ano inválido: ${year}`);
}

/** 53 se 1º de janeiro é quinta, ou se o ano é bissexto e 1º de janeiro é quarta; senão 52. */
export function isoWeeksInYear(year) {
  assertYear(year);
  const jan1 = dayOfWeek({ y: year, m: 1, d: 1 });
  return jan1 === 4 || (jan1 === 3 && isLeapYear(year)) ? 53 : 52;
}

/** Semana ISO de `date`: `{ year, week }` (o ano ISO pode diferir do ano civil). */
export function isoWeek(date) {
  assertDate(date);
  const doy = toOrdinal(date) - toOrdinal({ y: date.y, m: 1, d: 1 }) + 1;
  const week = Math.floor((doy - dayOfWeek(date) + 10) / 7);
  if (week < 1) return { year: date.y - 1, week: isoWeeksInYear(date.y - 1) };
  if (week > isoWeeksInYear(date.y)) return { year: date.y + 1, week: 1 };
  return { year: date.y, week };
}

/** Data do dia `weekday` (1 = segunda … 7 = domingo) da semana ISO `week` de `year`. */
export function fromIsoWeek(year, week, weekday = 1) {
  assertYear(year);
  if (!Number.isInteger(week) || week < 1 || week > isoWeeksInYear(year)) throw new RangeError(`semana inválida: ${week}`);
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) throw new RangeError(`dia inválido: ${weekday}`);
  const jan4 = { y: year, m: 1, d: 4 };
  const monday1 = toOrdinal(jan4) - (dayOfWeek(jan4) - 1);
  return fromOrdinal(monday1 + 7 * (week - 1) + weekday - 1);
}

/** `{ year, week }` -> 'AAAA-Www', ou 'AAAA-Www-D' se `weekday` for dado. */
export function formatIsoWeek({ year, week }, weekday) {
  assertYear(year);
  const base = `${String(year).padStart(4, '0')}-W${String(week).padStart(2, '0')}`;
  return weekday === undefined ? base : `${base}-${weekday}`;
}

/** 'AAAA-Www' ou 'AAAA-Www-D' -> `{ year, week }` ou `{ year, week, weekday }`. */
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
