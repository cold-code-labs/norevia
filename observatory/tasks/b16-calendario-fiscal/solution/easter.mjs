/**
 * Páscoa gregoriana e festas móveis derivadas.
 */
import { toOrdinal, fromOrdinal } from './civil.mjs';

function assertYear(year) {
  if (!Number.isInteger(year) || year < 1583 || year > 9999) throw new RangeError(`ano fora do domínio gregoriano: ${year}`);
}

/** Domingo de Páscoa do ano `year` (computus gregoriano, método de Gauss). */
export function easterSunday(year) {
  assertYear(year);
  const a = year % 19;
  const b = year % 4;
  const c = year % 7;
  const k = Math.floor(year / 100);
  const p = Math.floor((13 + 8 * k) / 25);
  const q = Math.floor(k / 4);
  const M = (15 - p + k - q) % 30;
  const N = (4 + k - q) % 7;
  const d = (19 * a + M) % 30;
  const e = (2 * b + 4 * c + 6 * d + N) % 7;
  if (d === 29 && e === 6) return { y: year, m: 4, d: 19 };
  if (d === 28 && e === 6 && (11 * M + 11) % 30 < 19) return { y: year, m: 4, d: 18 };
  const day = 22 + d + e;
  return day > 31 ? { y: year, m: 4, d: day - 31 } : { y: year, m: 3, d: day };
}

/** Data a `offset` dias do domingo de Páscoa de `year`. */
export function easterOffset(year, offset) {
  if (!Number.isInteger(offset)) throw new RangeError(`offset inválido: ${offset}`);
  return fromOrdinal(toOrdinal(easterSunday(year)) + offset);
}

export const MOVABLE = Object.freeze({
  carnaval: -47,
  cinzas: -46,
  sextaSanta: -2,
  pascoa: 0,
  ascensao: 39,
  pentecostes: 49,
  corpusChristi: 60,
});

/** Festa móvel pelo nome (chave de MOVABLE). */
export function movableFeast(year, name) {
  if (!Object.prototype.hasOwnProperty.call(MOVABLE, name)) throw new RangeError(`festa desconhecida: ${name}`);
  return easterOffset(year, MOVABLE[name]);
}
