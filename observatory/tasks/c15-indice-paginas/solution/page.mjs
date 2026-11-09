/**
 * Operações sobre uma página (array de entradas ordenadas por posição).
 */
import { comparePos } from './keys.mjs';

export function lowerBound(entries, pos) {
  let lo = 0;
  let hi = entries.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (comparePos(entries[mid], pos) < 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function upperBound(entries, pos) {
  let lo = 0;
  let hi = entries.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (comparePos(entries[mid], pos) <= 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function insertEntry(entries, entry) {
  const at = upperBound(entries, entry);
  entries.splice(at, 0, entry);
  return at;
}

export function splitPoint(entries) {
  return Math.ceil(entries.length / 2);
}

export function splitPage(entries) {
  const mid = splitPoint(entries);
  return [entries.slice(0, mid), entries.slice(mid)];
}

export function isSorted(entries) {
  for (let i = 1; i < entries.length; i++) if (comparePos(entries[i - 1], entries[i]) >= 0) return false;
  return true;
}
