/**
 * Datas de calendário como strings ISO 'YYYY-MM-DD' (calendário gregoriano, sem fuso).
 */
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export function isLeapYear(y) {
  return y % 4 === 0 && y % 100 !== 0;
}

/** Dias do mês `m` (1-12) do ano `y`; mês inválido → RangeError. */
export function daysInMonth(y, m) {
  if (!Number.isInteger(m) || m < 1 || m > 12) throw new RangeError(`invalid month: ${m}`);
  return [31, isLeapYear(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}

/**
 * 'YYYY-MM-DD' → { year, month, day }. Formato errado → SyntaxError;
 * mês ou dia inexistente (ex.: '2023-02-29') → RangeError.
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

/** Soma `n` dias (n inteiro, pode ser negativo). */
export function addDays(s, n) {
  return fromEpochDays(toEpochDays(s) + n);
}

/** Dias de `a` até `b` (positivo se b é posterior). */
export function daysBetween(a, b) {
  return toEpochDays(b) - toEpochDays(a);
}

/**
 * Soma `n` meses; se o dia não existir no mês de destino, usa o último dia desse mês
 * ('2023-01-31' + 1 → '2023-02-28').
 */
export function addMonths(s, n) {
  const { year, month, day } = parseISODate(s);
  const total = year * 12 + (month - 1) + n;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return formatISODate({ year: y, month: m, day: Math.min(day, daysInMonth(y, m)) });
}

/** Posição do dia no ano (1 = 1º de janeiro). */
export function dayOfYear(s) {
  const { year, month, day } = parseISODate(s);
  let n = day;
  for (let m = 1; m < month; m++) n += daysInMonth(year, m);
  return n;
}
