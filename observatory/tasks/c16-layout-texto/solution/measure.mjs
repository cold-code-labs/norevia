/**
 * Medidas de texto em colunas.
 *
 * Unidade: ponto de código (code point). O hífen suave (U+00AD) é invisível
 * e ocupa 0 colunas.
 */

export const SHY = '­';

function assertString(s) {
  if (typeof s !== 'string') throw new TypeError('texto deve ser string');
  return s;
}

export function codePoints(s) {
  return Array.from(assertString(s));
}

export function width(s) {
  assertString(s);
  let n = 0;
  for (const ch of s) if (ch !== SHY) n++;
  return n;
}

/** Como String.prototype.slice, mas com índices em pontos de código (>= 0). */
export function cpSlice(s, start, end = Infinity) {
  const cps = codePoints(s);
  if (!Number.isInteger(start) || start < 0) throw new RangeError(`início inválido: ${start}`);
  if (end !== Infinity && (!Number.isInteger(end) || end < 0)) throw new RangeError(`fim inválido: ${end}`);
  return cps.slice(start, end).join('');
}

/** Converte um índice em unidades UTF-16 para índice em pontos de código. */
export function toCpIndex(s, unitIndex) {
  assertString(s);
  let cp = 0;
  let u = 0;
  while (u < unitIndex && u < s.length) {
    const code = s.codePointAt(u);
    u += code > 0xffff ? 2 : 1;
    cp++;
  }
  return cp;
}

export function stripShy(s) {
  return assertString(s).split(SHY).join('');
}

/** Converte um índice em pontos de código para índice em unidades UTF-16. */
export function toUnitIndex(s, cpIndex) {
  assertString(s);
  if (!Number.isInteger(cpIndex) || cpIndex < 0) throw new RangeError(`índice inválido: ${cpIndex}`);
  let u = 0;
  for (let cp = 0; cp < cpIndex && u < s.length; cp++) u += s.codePointAt(u) > 0xffff ? 2 : 1;
  return u;
}
