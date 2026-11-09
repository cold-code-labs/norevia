/**
 * Pró-rata por dias com datas civis 'YYYY-MM-DD' (calendário gregoriano
 * proléptico, sem fuso horário). Todos os intervalos são semiabertos [início, fim).
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

/** 'YYYY-MM-DD' → { y, m, d }; data inexistente ou formato inválido → RangeError. */
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

/** Dias desde 1970-01-01 (negativo antes disso). */
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

/** Número de dias de a até b (b exclusivo); negativo se b < a. */
export function daysBetween(a, b) {
  return dayNumber(b) - dayNumber(a);
}

/**
 * prorate(amountCents, period, usage): parte de `amountCents` proporcional aos
 * dias de `usage` que caem dentro de `period` (ambos { start, end }, semiabertos).
 * Resultado = divRound(amount × diasSobrepostos, diasDoPeríodo) (half-even).
 * Período vazio/invertido ou uso invertido → RangeError.
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
 * splitByMonth(start, end): divide [start, end) em segmentos por mês civil:
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
 * monthlyCharges(monthlyCents, start, end): cobra um plano mensal de [start, end):
 * cada segmento de splitByMonth paga divRound(monthlyCents × days, diasDoMês).
 */
export function monthlyCharges(monthlyCents, start, end) {
  return splitByMonth(start, end).map((s) => {
    const [y, m] = s.month.split('-').map(Number);
    return { month: s.month, days: s.days, cents: divRound(monthlyCents * s.days, daysInMonth(y, m)) };
  });
}
