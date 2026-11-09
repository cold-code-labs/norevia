/**
 * Calendar dates as ISO 'YYYY-MM-DD' strings (Gregorian calendar, no time zone).
 */
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export function isLeapYear(y) {
  return y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
}

/** Days of month `m` (1-12) of year `y`; invalid month → RangeError. */
export function daysInMonth(y, m) {
  if (!Number.isInteger(m) || m < 1 || m > 12) throw new RangeError(`invalid month: ${m}`);
  return [31, isLeapYear(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}

/**
 * 'YYYY-MM-DD' → { year, month, day }. Wrong format → SyntaxError;
 * nonexistent month or day (e.g.: '2023-02-29') → RangeError.
 */
export function parseISODate(s) {
  const m = ISO.exec(s);
  if (!m) throw new SyntaxError(`invalid date: ${s}`);
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (day < 1 || day > daysInMonth(year, month)) throw new RangeError(`invalid date: ${s}`);
  return { year, month, day };
}

export function formatISODate({ year, month, day }) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function toEpochDays(s) {
  const { year, month, day } = parseISODate(s);
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

function fromEpochDays(n) {
  const d = new Date(n * MS_PER_DAY);
  return formatISODate({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() });
}

/** Adds `n` days (n integer, may be negative). */
export function addDays(s, n) {
  return fromEpochDays(toEpochDays(s) + n);
}

/** Days from `a` to `b` (positive if b is later). */
export function daysBetween(a, b) {
  return toEpochDays(b) - toEpochDays(a);
}

/**
 * Adds `n` months; if the day does not exist in the target month, uses the last day of that month
 * ('2023-01-31' + 1 → '2023-02-28').
 */
export function addMonths(s, n) {
  const { year, month, day } = parseISODate(s);
  const total = year * 12 + (month - 1) + n;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return formatISODate({ year: y, month: m, day: Math.min(day, daysInMonth(y, m)) });
}

/** Position of the day in the year (1 = January 1st). */
export function dayOfYear(s) {
  const { year, month, day } = parseISODate(s);
  let n = day;
  for (let m = 1; m < month; m++) n += daysInMonth(year, m);
  return n;
}
