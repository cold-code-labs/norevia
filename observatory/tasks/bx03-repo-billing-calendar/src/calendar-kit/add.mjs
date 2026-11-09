/**
 * Aritmética de datas `{ y, m, d }`: dias, meses (com ajuste ao fim do mês) e diferenças.
 */
import { assertDate, daysInMonth, toOrdinal, fromOrdinal, compareDates } from './civil.mjs';

function assertInt(n, name) {
  if (!Number.isInteger(n)) throw new RangeError(`${name} deve ser inteiro`);
}

/** Soma `n` dias (n pode ser negativo). */
export function addDays(date, n) {
  assertInt(n, 'n');
  return fromOrdinal(toOrdinal(date) + n);
}

/**
 * Soma `n` meses. Se o dia não existir no mês de destino, usa o último dia desse mês
 * (31/jan + 1 mês = 29/fev em ano bissexto). Ano de destino fora de 1–9999 -> RangeError.
 */
export function addMonths(date, n) {
  assertDate(date);
  assertInt(n, 'n');
  const total = date.y * 12 + (date.m - 1) + n;
  const y = Math.floor(total / 12);
  const m = total - y * 12 + 1;
  if (y < 1 || y > 9999) throw new RangeError('resultado fora do domínio');
  return { y, m, d: Math.min(date.d, daysInMonth(y, m)) };
}

/** Soma `n` anos = addMonths(date, 12 * n) (29/fev + 1 ano = 28/fev). */
export function addYears(date, n) {
  assertInt(n, 'n');
  return addMonths(date, 12 * n);
}

/** Nº de dias de `a` até `b` (negativo se `b` vem antes). */
export function diffDays(a, b) {
  return toOrdinal(b) - toOrdinal(a);
}

/**
 * Meses completos de `a` até `b`: para b >= a, o maior k >= 0 tal que
 * addMonths(a, k) <= b; para b < a, -diffMonths(b, a).
 */
export function diffMonths(a, b) {
  assertDate(a);
  assertDate(b);
  if (compareDates(b, a) < 0) return -diffMonths(b, a);
  let k = (b.y - a.y) * 12 + (b.m - a.m);
  if (a.d > b.d) k--;
  return k;
}

/** Primeiro dia do mês de `date`. */
export function startOfMonth(date) {
  assertDate(date);
  return { y: date.y, m: date.m, d: 1 };
}

/** Último dia do mês de `date`. */
export function endOfMonth(date) {
  assertDate(date);
  return { y: date.y, m: date.m, d: daysInMonth(date.y, date.m) };
}

/** Todas as datas de `a` até `b`, inclusive, em ordem crescente; [] se b < a. */
export function eachDay(a, b) {
  const out = [];
  for (let n = toOrdinal(a), end = toOrdinal(b); n <= end; n++) out.push(fromOrdinal(n));
  return out;
}
