/**
 * Datas civis `{ y, m, d }` no calendário gregoriano proléptico (anos 1–9999).
 * Ordinal = nº de dias desde 1970-01-01 (que vale 0).
 */

const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MIN_ORD = -719162; // 0001-01-01
const MAX_ORD = 2932896; // 9999-12-31

export function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(y, m) {
  if (!Number.isInteger(m) || m < 1 || m > 12) throw new RangeError(`mês inválido: ${m}`);
  return m === 2 && isLeapYear(y) ? 29 : DAYS[m - 1];
}

export function isValidDate(date) {
  if (date === null || typeof date !== 'object') return false;
  const { y, m, d } = date;
  if (![y, m, d].every(Number.isInteger)) return false;
  if (y < 1 || y > 9999 || m < 1 || m > 12) return false;
  return d >= 1 && d <= daysInMonth(y, m);
}

export function assertDate(date) {
  if (date === null || typeof date !== 'object') throw new TypeError('data deve ser objeto { y, m, d }');
  if (!isValidDate(date)) throw new RangeError(`data inválida: ${JSON.stringify(date)}`);
  return date;
}

export function toOrdinal(date) {
  assertDate(date);
  const { m, d } = date;
  const y = m <= 2 ? date.y - 1 : date.y;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const mp = (m + 9) % 12;
  const doy = Math.floor((153 * mp + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

export function fromOrdinal(n) {
  if (!Number.isInteger(n) || n < MIN_ORD || n > MAX_ORD) throw new RangeError(`ordinal fora do domínio: ${n}`);
  const z = n + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  return { y: yoe + era * 400 + (m <= 2 ? 1 : 0), m, d };
}

/** 1 = segunda … 7 = domingo. */
export function dayOfWeek(date) {
  const n = toOrdinal(date);
  return (((n + 3) % 7) + 7) % 7 + 1;
}

export function addDays(date, n) {
  if (!Number.isInteger(n)) throw new RangeError(`n inválido: ${n}`);
  return fromOrdinal(toOrdinal(date) + n);
}

export function compareDates(a, b) {
  const x = toOrdinal(a);
  const y = toOrdinal(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

export function formatISODate(date) {
  assertDate(date);
  return `${String(date.y).padStart(4, '0')}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
}

export function parseISODate(text) {
  if (typeof text !== 'string') throw new TypeError('parseISODate espera string');
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!m) throw new RangeError(`formato inválido: ${text}`);
  return assertDate({ y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) });
}
