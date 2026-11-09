/**
 * Mapa LWW (last-writer-wins) por chave, com lápides para remoções.
 * Entrada: { stamp, value } (viva) ou { stamp, deleted: true } (lápide).
 */
import { compareStamps } from './clock.mjs';

export function assertKey(key) {
  if (typeof key !== 'string') throw new TypeError('chave deve ser string');
  if (key.length === 0) throw new RangeError('chave vazia');
  return key;
}

export function assertValue(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  throw new TypeError(`valor não suportado: ${String(value)}`);
}

export function createMap() {
  return new Map();
}

export function lwwClone(map) {
  return new Map(map);
}

/** Aplica `entry` se seu carimbo for estritamente maior que o atual. */
export function lwwApply(map, key, entry) {
  const cur = map.get(key);
  if (cur !== undefined && compareStamps(entry.stamp, cur.stamp) <= 0) return false;
  map.set(key, entry);
  return true;
}

export function lwwSet(map, key, value, stamp) {
  assertKey(key);
  assertValue(value);
  return lwwApply(map, key, { stamp, value });
}

export function lwwDelete(map, key, stamp) {
  assertKey(key);
  return lwwApply(map, key, { stamp, deleted: true });
}

export function lwwGet(map, key) {
  const e = map.get(key);
  return e === undefined || e.deleted ? undefined : e.value;
}

export function lwwHas(map, key) {
  const e = map.get(key);
  return e !== undefined && !e.deleted;
}

export function lwwKeys(map) {
  return [...map].filter(([, e]) => !e.deleted).map(([k]) => k).sort();
}

export function lwwEntries(map) {
  return [...map.keys()].sort().map((k) => [k, map.get(k)]);
}

export function lwwMerge(a, b) {
  const out = lwwClone(a);
  for (const [k, e] of b) lwwApply(out, k, e);
  return out;
}
