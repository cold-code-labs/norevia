/**
 * Dias úteis com calendário de feriados fixos, móveis (relativos à Páscoa) e avulsos.
 */
import { assertDate, daysInMonth, toOrdinal, fromOrdinal, dayOfWeek } from './civil.mjs';
import { easterOffset } from './easter.mjs';

const EMPTY = Object.freeze({ fixed: [], easter: [], dates: [] });

function normCalendar(cal) {
  if (cal === undefined) return EMPTY;
  if (cal === null || typeof cal !== 'object') throw new TypeError('calendário deve ser objeto');
  return { fixed: cal.fixed ?? [], easter: cal.easter ?? [], dates: cal.dates ?? [] };
}

/** Ordinais dos feriados do ano civil `y`. */
export function holidaysInYear(y, cal) {
  const c = normCalendar(cal);
  const out = new Set();
  for (const { m, d } of c.fixed) if (d <= daysInMonth(y, m)) out.add(toOrdinal({ y, m, d }));
  if (y >= 1583) for (const off of c.easter) out.add(toOrdinal(easterOffset(y, off)));
  for (const h of c.dates) if (h.y === y) out.add(toOrdinal(h));
  return [...out].sort((p, q) => p - q).map(fromOrdinal);
}

function checker(cal) {
  const c = normCalendar(cal);
  const cache = new Map();
  return (ord) => {
    const { y } = fromOrdinal(ord);
    let set = cache.get(y);
    if (!set) {
      set = new Set(holidaysInYear(y, c).map(toOrdinal));
      cache.set(y, set);
    }
    const wd = (((ord + 3) % 7) + 7) % 7 + 1;
    return wd <= 5 && !set.has(ord);
  };
}

export function isHoliday(date, cal) {
  assertDate(date);
  return holidaysInYear(date.y, cal).some((h) => h.m === date.m && h.d === date.d);
}

export function isBusinessDay(date, cal) {
  return dayOfWeek(date) <= 5 && !isHoliday(date, cal);
}

function step(ord, dir, isBD) {
  let o = ord + dir;
  while (!isBD(o)) o += dir;
  return o;
}

export function nextBusinessDay(date, cal) {
  return fromOrdinal(step(toOrdinal(date), 1, checker(cal)));
}

export function previousBusinessDay(date, cal) {
  return fromOrdinal(step(toOrdinal(date), -1, checker(cal)));
}

export function adjust(date, convention = 'following', cal) {
  const ord = toOrdinal(date);
  const isBD = checker(cal);
  const conventions = ['none', 'following', 'preceding', 'modifiedFollowing', 'modifiedPreceding'];
  if (!conventions.includes(convention)) throw new RangeError(`convenção desconhecida: ${convention}`);
  if (convention === 'none' || isBD(ord)) return { ...date };
  const f = fromOrdinal(step(ord, 1, isBD));
  const p = fromOrdinal(step(ord, -1, isBD));
  switch (convention) {
    case 'following': return f;
    case 'preceding': return p;
    case 'modifiedFollowing': return f.m === date.m && f.y === date.y ? f : p;
    default: return p.m === date.m && p.y === date.y ? p : f;
  }
}

export function addBusinessDays(date, n, cal) {
  if (!Number.isInteger(n)) throw new RangeError(`n inválido: ${n}`);
  const isBD = checker(cal);
  let o = toOrdinal(date);
  const dir = n < 0 ? -1 : 1;
  for (let i = 0; i < Math.abs(n); i++) o = step(o, dir, isBD);
  return fromOrdinal(o);
}

export function businessDaysBetween(a, b, cal) {
  const isBD = checker(cal);
  const A = toOrdinal(a);
  const B = toOrdinal(b);
  const sign = B < A ? -1 : 1;
  let n = 0;
  for (let o = Math.min(A, B); o < Math.max(A, B); o++) if (isBD(o)) n++;
  return sign * n;
}
