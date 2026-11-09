/**
 * Chaves, posições e cursores do índice.
 */

export const LOW_ID = 0;
export const HIGH_ID = Infinity;

function assertKey(key, who) {
  if (typeof key !== 'string') throw new TypeError(`${who}: chave deve ser string`);
}

export function compareKeys(a, b) {
  assertKey(a, 'compareKeys');
  assertKey(b, 'compareKeys');
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function compareIds(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function comparePos(a, b) {
  return compareKeys(a.key, b.key) || compareIds(a.id, b.id);
}

export function maxPos(a, b) {
  if (a === null) return b;
  if (b === null) return a;
  return comparePos(a, b) >= 0 ? a : b;
}

export function minPos(a, b) {
  if (a === null) return b;
  if (b === null) return a;
  return comparePos(a, b) <= 0 ? a : b;
}

export function formatPos(pos) {
  return `${pos.key}#${pos.id}`;
}

export function isValidId(id) {
  return Number.isSafeInteger(id) && id >= 1;
}

export function encodeCursor(pos) {
  if (!pos || !isValidId(pos.id)) throw new RangeError('encodeCursor: id inválido');
  assertKey(pos.key, 'encodeCursor');
  return `${pos.key}.${pos.id}`;
}

export function decodeCursor(token) {
  if (typeof token !== 'string') throw new TypeError('decodeCursor: cursor deve ser string');
  const dot = token.lastIndexOf('.');
  if (dot < 0) throw new RangeError(`cursor inválido: ${JSON.stringify(token)}`);
  const digits = token.slice(dot + 1);
  if (!/^[1-9]\d*$/.test(digits)) throw new RangeError(`cursor inválido: ${JSON.stringify(token)}`);
  const id = Number(digits);
  if (!isValidId(id)) throw new RangeError(`cursor inválido: ${JSON.stringify(token)}`);
  return { key: token.slice(0, dot), id };
}
