/**
 * Day-based proration with civil dates 'YYYY-MM-DD' (proleptic Gregorian
 * calendar, without time zone). All intervals are half-open [start, end).
 */
import { divRound } from './money.mjs';

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const CUMULATIVE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

export function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(y, m) {
  return m === 2 && isLeapYear(y) ? 29 : MONTH_DAYS[m - 1];
}

/** 'YYYY-MM-DD' → { y, m, d }; nonexistent date or invalid format → RangeError. */
export function parseDate(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!m) throw new RangeError(`invalid date: ${text}`);
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo)) throw new RangeError(`invalid date: ${text}`);
  return { y, m: mo, d };
}

function pad(n, w) {
  return String(n).padStart(w, '0');
}

export function formatDate({ y, m, d }) {
  return `${pad(y, 4)}-${pad(m, 2)}-${pad(d, 2)}`;
}

function leapsBefore(y) {
  const p = y - 1;
  return Math.floor(p / 4) - Math.floor(p / 100) + Math.floor(p / 400);
}

function yearStart(y) {
  return 365 * (y - 1970) + leapsBefore(y) - leapsBefore(1970);
}

/** Days since 1970-01-01 (negative before that). */
export function dayNumber(text) {
  const { y, m, d } = parseDate(text);
  return yearStart(y) + CUMULATIVE[m - 1] + (m > 2 && isLeapYear(y) ? 1 : 0) + d - 1;
}

export function fromDayNumber(n) {
  let y = 1970 + Math.floor(n / 365.2425);
  while (yearStart(y) > n) y--;
  while (yearStart(y + 1) <= n) y++;
  let rest = n - yearStart(y);
  let m = 1;
  while (rest >= daysInMonth(y, m)) {
    rest -= daysInMonth(y, m);
    m++;
  }
  return formatDate({ y, m, d: rest + 1 });
}

export function addDays(text, days) {
  return fromDayNumber(dayNumber(text) + days);
}

/** Number of days from a to b (b exclusive); negative if b < a. */
export function daysBetween(a, b) {
  return dayNumber(b) - dayNumber(a);
}

/**
 * prorate(amountCents, period, usage): part of `amountCents` proportional to the
 * days of `usage` that fall within `period` (both { start, end }, half-open).
 * Result = divRound(amount × overlappingDays, periodDays) (half-even).
 * Empty/inverted period or inverted usage → RangeError.
 */
export function prorate(amountCents, period, usage) {
  const ps = dayNumber(period.start);
  const pe = dayNumber(period.end);
  if (pe <= ps) throw new RangeError('empty period');
  const us = dayNumber(usage.start);
  const ue = dayNumber(usage.end);
  if (ue < us) throw new RangeError('inverted usage');
  const overlap = Math.max(0, Math.min(pe, ue) - Math.max(ps, us));
  return divRound(amountCents * overlap, pe - ps);
}

/**
 * splitByMonth(start, end): splits [start, end) into segments by calendar month:
 * [{ month: 'YYYY-MM', start, end, days }]. start === end → [].
 */
export function splitByMonth(start, end) {
  let cur = dayNumber(start);
  const last = dayNumber(end);
  if (last < cur) throw new RangeError('inverted interval');
  const out = [];
  while (cur < last) {
    const { y, m } = parseDate(fromDayNumber(cur));
    const nextMonth = m === 12 ? yearStart(y + 1) : dayNumber(formatDate({ y, m: m + 1, d: 1 }));
    const segEnd = Math.min(nextMonth, last);
    out.push({ month: `${pad(y, 4)}-${pad(m, 2)}`, start: fromDayNumber(cur), end: fromDayNumber(segEnd), days: segEnd - cur });
    cur = segEnd;
  }
  return out;
}

/**
 * monthlyCharges(monthlyCents, start, end): charges a monthly plan for [start, end):
 * each segment of splitByMonth pays divRound(monthlyCents × days, daysInMonth).
 */
export function monthlyCharges(monthlyCents, start, end) {
  return splitByMonth(start, end).map((s) => {
    const [y, m] = s.month.split('-').map(Number);
    return { month: s.month, days: s.days, cents: divRound(monthlyCents * s.days, daysInMonth(y, m)) };
  });
}
