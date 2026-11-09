/**
 * Registradores e mapas "last-writer-wins". Uma escrita é `{ value, ts, replica }` com
 * `ts` inteiro >= 0 e `replica` string não vazia; um registrador nunca escrito é `null`.
 */

function checkWrite(w) {
  if (w === null || typeof w !== 'object') throw new TypeError('escrita deve ser objeto');
  if (!Number.isInteger(w.ts) || w.ts < 0) throw new RangeError(`ts inválido: ${w.ts}`);
  if (typeof w.replica !== 'string' || w.replica === '') throw new RangeError('replica inválida');
}

export function compareWrites(x, y) {
  if (x.ts !== y.ts) return x.ts < y.ts ? -1 : 1;
  if (x.replica !== y.replica) return x.replica < y.replica ? 1 : -1;
  return 0;
}

export function merge(a, b) {
  if (a === null) return b;
  if (b === null) return a;
  checkWrite(a);
  checkWrite(b);
  return compareWrites(b, a) > 0 ? b : a;
}

export function set(reg, value, ts, replica) {
  const w = { value, ts, replica };
  checkWrite(w);
  return merge(reg, w);
}

export function get(reg) {
  return reg === null ? undefined : reg.value;
}

export function createMap() {
  return new Map();
}

export function mapSet(map, key, value, ts, replica) {
  const out = new Map(map);
  out.set(key, set(map.get(key) ?? null, value, ts, replica));
  return out;
}

export function mapDelete(map, key, ts, replica) {
  const tomb = { value: undefined, ts, replica, deleted: true };
  checkWrite(tomb);
  const out = new Map(map);
  out.set(key, merge(map.get(key) ?? null, tomb));
  return out;
}

export function mapGet(map, key) {
  const w = map.get(key);
  return w && !w.deleted ? w.value : undefined;
}

export function mapHas(map, key) {
  const w = map.get(key);
  return Boolean(w && !w.deleted);
}

export function mapKeys(map) {
  return [...map.keys()].filter((k) => mapHas(map, k)).sort();
}

export function mapMerge(a, b) {
  const out = new Map(a);
  for (const [k, w] of b) out.set(k, merge(a.get(k) ?? null, w));
  return out;
}

export function mapToObject(map) {
  const obj = {};
  for (const k of mapKeys(map)) obj[k] = map.get(k).value;
  return obj;
}
