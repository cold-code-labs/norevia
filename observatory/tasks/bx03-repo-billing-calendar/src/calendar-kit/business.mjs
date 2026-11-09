/**
 * Dias úteis: segunda a sexta que não sejam feriado.
 * `holidays` é uma lista de feriados: `{ y, m, d }` (data única) ou `{ m, d }` (anual).
 */
import { assertDate, toOrdinal, fromOrdinal, dayOfWeek } from './civil.mjs';

const CONVENTIONS = new Set(['none', 'following', 'preceding', 'modifiedFollowing', 'modifiedPreceding']);

function holidayKeys(holidays) {
  if (!Array.isArray(holidays)) throw new TypeError('holidays deve ser um array');
  const keys = new Set();
  for (const h of holidays) {
    if (h === null || typeof h !== 'object') throw new TypeError('feriado inválido');
    keys.add(h.y === undefined ? `*-${h.m}-${h.d}` : `${h.y}-${h.m}-${h.d}`);
  }
  return keys;
}

function isBusiness(date, keys) {
  if (dayOfWeek(date) > 5) return false;
  return !keys.has(`${date.y}-${date.m}-${date.d}`) && !keys.has(`*-${date.m}-${date.d}`);
}

function step(date, dir, keys) {
  let ord = toOrdinal(date);
  let cur;
  do {
    ord += dir;
    cur = fromOrdinal(ord);
  } while (!isBusiness(cur, keys));
  return cur;
}

/** true se `date` é feriado (único ou anual). */
export function isHoliday(date, holidays = []) {
  assertDate(date);
  const keys = holidayKeys(holidays);
  return keys.has(`${date.y}-${date.m}-${date.d}`) || keys.has(`*-${date.m}-${date.d}`);
}

/** true se `date` é segunda–sexta e não é feriado. */
export function isBusinessDay(date, holidays = []) {
  assertDate(date);
  return isBusiness(date, holidayKeys(holidays));
}

/** Primeiro dia útil estritamente posterior a `date`. */
export function nextBusinessDay(date, holidays = []) {
  assertDate(date);
  return step(date, +1, holidayKeys(holidays));
}

/** Último dia útil estritamente anterior a `date`. */
export function previousBusinessDay(date, holidays = []) {
  assertDate(date);
  return step(date, -1, holidayKeys(holidays));
}

/**
 * Ajusta `date` a um dia útil conforme a convenção. Dia útil é devolvido inalterado.
 * modifiedFollowing: following, salvo se mudar de mês -> preceding.
 * modifiedPreceding: preceding, salvo se mudar de mês -> following.
 */
export function adjust(date, convention = 'following', holidays = []) {
  assertDate(date);
  if (!CONVENTIONS.has(convention)) throw new RangeError(`convenção inválida: ${convention}`);
  const keys = holidayKeys(holidays);
  if (convention === 'none' || isBusiness(date, keys)) return { ...date };
  if (convention === 'following') return step(date, +1, keys);
  if (convention === 'preceding') return step(date, -1, keys);
  if (convention === 'modifiedFollowing') {
    const f = step(date, +1, keys);
    return f.m > date.m ? step(date, -1, keys) : f;
  }
  const p = step(date, -1, keys);
  return p.m !== date.m ? step(date, +1, keys) : p;
}

/** Avança (n > 0) ou recua (n < 0) |n| dias úteis; n = 0 devolve cópia de `date`. */
export function addBusinessDays(date, n, holidays = []) {
  assertDate(date);
  if (!Number.isInteger(n)) throw new RangeError('n deve ser inteiro');
  const keys = holidayKeys(holidays);
  let cur = { ...date };
  for (let i = 0; i < Math.abs(n); i++) cur = step(cur, Math.sign(n), keys);
  return cur;
}

/** Dias úteis no intervalo semiaberto [a, b); se b < a, -businessDaysBetween(b, a). */
export function businessDaysBetween(a, b, holidays = []) {
  const keys = holidayKeys(holidays);
  const x = toOrdinal(a);
  const z = toOrdinal(b);
  if (z < x) return -businessDaysBetween(b, a, holidays);
  let count = 0;
  for (let ord = x; ord < z; ord++) if (isBusiness(fromOrdinal(ord), keys)) count++;
  return count;
}
