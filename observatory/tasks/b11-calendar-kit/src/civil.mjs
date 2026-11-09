/**
 * Calendário civil gregoriano proléptico, sem fuso horário.
 * Uma data é um objeto `{ y, m, d }` de inteiros: ano 1–9999, mês 1–12, dia válido.
 */

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const CUMULATIVE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

/** Bissexto: divisível por 4, exceto séculos não divisíveis por 400. */
export function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** Nº de dias do mês `m` (1–12) do ano `y`; mês inválido -> RangeError. */
export function daysInMonth(y, m) {
  if (!Number.isInteger(m) || m < 1 || m > 12) throw new RangeError(`mês inválido: ${m}`);
  return m === 2 && isLeapYear(y) ? 29 : MONTH_DAYS[m - 1];
}

/** true se `date` é um objeto { y, m, d } válido dentro do domínio. */
export function isValidDate(date) {
  if (date === null || typeof date !== 'object') return false;
  const { y, m, d } = date;
  if (![y, m, d].every(Number.isInteger)) return false;
  if (y < 1 || y > 9999 || m < 1 || m > 12) return false;
  return d >= 1 && d <= daysInMonth(y, m);
}

/** Não-objeto -> TypeError; objeto inválido -> RangeError; senão devolve a própria data. */
export function assertDate(date) {
  if (date === null || typeof date !== 'object') throw new TypeError('data deve ser um objeto { y, m, d }');
  if (!isValidDate(date)) throw new RangeError(`data inválida: ${JSON.stringify(date)}`);
  return date;
}

/** Nº de dias desde 1970-01-01 (que tem ordinal 0); datas anteriores são negativas. */
export function toOrdinal(date) {
  assertDate(date);
  const { m, d } = date;
  const y = date.y - (m <= 2 ? 1 : 0);
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const mp = (m + 9) % 12;
  const doy = Math.floor((153 * mp + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

/** Inverso de toOrdinal; resultado fora de 0001-01-01..9999-12-31 -> RangeError. */
export function fromOrdinal(n) {
  if (!Number.isInteger(n)) throw new RangeError(`ordinal inválido: ${n}`);
  const z = n + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  const y = yoe + era * 400 + (m <= 2 ? 1 : 0);
  if (y < 1 || y > 9999) throw new RangeError(`ordinal fora do domínio: ${n}`);
  return { y, m, d };
}

/** Dia da semana ISO: 1 = segunda … 7 = domingo. */
export function dayOfWeek(date) {
  return (((toOrdinal(date) + 3) % 7) + 7) % 7 + 1;
}

/** Dia do ano, 1 (1º de janeiro) a 365/366. */
export function dayOfYear(date) {
  assertDate(date);
  const { y, m, d } = date;
  return CUMULATIVE[m - 1] + d + (m >= 2 && isLeapYear(y) ? 1 : 0);
}

/** -1, 0 ou 1 conforme `a` seja anterior, igual ou posterior a `b`. */
export function compareDates(a, b) {
  const x = toOrdinal(a);
  const z = toOrdinal(b);
  return x < z ? -1 : x > z ? 1 : 0;
}

/** 'AAAA-MM-DD' estrito -> data. Não-string -> TypeError; formato/data inválidos -> RangeError. */
export function parseISODate(text) {
  if (typeof text !== 'string') throw new TypeError('parseISODate espera string');
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!m) throw new RangeError(`formato inválido: ${text}`);
  const date = { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
  return assertDate(date);
}

/** Data -> 'AAAA-MM-DD' (ano com 4 dígitos, zeros à esquerda). */
export function formatISODate(date) {
  assertDate(date);
  const p = (v, n) => String(v).padStart(n, '0');
  return `${p(date.y, 4)}-${p(date.m, 2)}-${p(date.d, 2)}`;
}
