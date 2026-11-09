/**
 * Calendário fiscal 4-4-5 (52/53 semanas).
 */
import { assertDate, toOrdinal, fromOrdinal, dayOfWeek } from './civil.mjs';

const PATTERN = [4, 4, 5, 4, 4, 5, 4, 4, 5, 4, 4, 5];

function assertFiscalYear(fy) {
  if (!Number.isInteger(fy) || fy < 2 || fy > 9998) throw new RangeError(`ano fiscal inválido: ${fy}`);
}

function yearEndOrdinal(fy) {
  const dec31 = { y: fy, m: 12, d: 31 };
  const ord = toOrdinal(dec31);
  const ahead = (6 - dayOfWeek(dec31) + 7) % 7;
  return ahead <= 3 ? ord + ahead : ord + ahead - 7;
}

export function fiscalYearEnd(fy) {
  assertFiscalYear(fy);
  return fromOrdinal(yearEndOrdinal(fy));
}

export function fiscalYearStart(fy) {
  assertFiscalYear(fy);
  return fromOrdinal(yearEndOrdinal(fy - 1) + 1);
}

export function weeksInFiscalYear(fy) {
  assertFiscalYear(fy);
  return (yearEndOrdinal(fy) - yearEndOrdinal(fy - 1)) / 7;
}

/** Semanas de cada um dos 12 períodos do ano fiscal. */
export function periodWeeks(fy) {
  const weeks = PATTERN.slice();
  if (weeksInFiscalYear(fy) === 53) weeks[11] += 1;
  return weeks;
}

export function periodRange(fy, period) {
  if (!Number.isInteger(period) || period < 1 || period > 12) throw new RangeError(`período inválido: ${period}`);
  const weeks = periodWeeks(fy);
  let start = yearEndOrdinal(fy - 1) + 1;
  for (let p = 1; p < period; p++) start += 7 * weeks[p - 1];
  return { start: fromOrdinal(start), end: fromOrdinal(start + 7 * weeks[period - 1] - 1) };
}

/** `{ year, quarter, period, week }` da data `date`. */
export function fiscalInfo(date) {
  assertDate(date);
  const ord = toOrdinal(date);
  const saturday = ord + (6 - dayOfWeek(date) + 7) % 7;
  const fy = fromOrdinal(saturday - 4).y;
  assertFiscalYear(fy);
  const week = Math.floor((ord - yearEndOrdinal(fy - 1) - 1) / 7) + 1;
  const weeks = periodWeeks(fy);
  let period = 1;
  let acc = weeks[0];
  while (week > acc) acc += weeks[period++];
  return { year: fy, quarter: Math.ceil(period / 3), period, week };
}
