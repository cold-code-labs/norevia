/**
 * Codificação canônica do estado de uma réplica (texto JSON) e leitura de carimbos.
 */
import { assertReplicaId, makeStamp, formatStamp, compareStamps } from './clock.mjs';
import { createMap, assertKey, assertValue } from './lww.mjs';
import { createSet, assertElem } from './orset.mjs';

export function parseStamp(text) {
  if (typeof text !== 'string') throw new TypeError('carimbo deve ser string');
  const i = text.indexOf('@');
  if (i < 0) throw new RangeError(`carimbo sem '@': ${JSON.stringify(text)}`);
  const counter = text.slice(0, i);
  const replica = text.slice(i + 1);
  if (!/^[1-9]\d*$/.test(counter)) throw new RangeError(`contador inválido em ${JSON.stringify(text)}`);
  return makeStamp(Number(counter), replica);
}

function obj(pairs) {
  return '{' + pairs.map(([k, v]) => JSON.stringify(k) + ':' + v).join(',') + '}';
}

function tagList(b) {
  return JSON.stringify([...b.values()].sort(compareStamps).map(formatStamp));
}

function buckets(m) {
  return [...m.keys()].sort().filter((e) => m.get(e).size > 0).map((e) => [e, tagList(m.get(e))]);
}

export function encodeState({ vv, map, set }) {
  const m = [...map.keys()].sort().map((k) => {
    const e = map.get(k);
    return [k, JSON.stringify(e.deleted ? [formatStamp(e.stamp)] : [formatStamp(e.stamp), e.value])];
  });
  const v = Object.keys(vv).sort().map((r) => [r, String(vv[r])]);
  return obj([['map', obj(m)], ['set', obj(buckets(set.adds))], ['tombs', obj(buckets(set.tombs))], ['vv', obj(v)]]);
}

function isPlain(x) {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function readBuckets(raw, target) {
  if (!isPlain(raw)) throw new TypeError('seção de conjunto inválida');
  for (const [elem, tags] of Object.entries(raw)) {
    assertElem(elem);
    if (!Array.isArray(tags)) throw new TypeError(`etiquetas de ${elem} devem ser lista`);
    const b = new Map();
    for (const t of tags) {
      const s = parseStamp(t);
      b.set(formatStamp(s), s);
    }
    if (b.size > 0) target.set(elem, b);
  }
}

export function decodeState(text) {
  if (typeof text !== 'string') throw new TypeError('estado deve ser texto');
  const raw = JSON.parse(text);
  if (!isPlain(raw) || !isPlain(raw.map) || !isPlain(raw.vv)) throw new TypeError('estado malformado');
  const map = createMap();
  for (const [k, arr] of Object.entries(raw.map)) {
    assertKey(k);
    if (!Array.isArray(arr) || arr.length < 1 || arr.length > 2) throw new TypeError(`entrada inválida para ${k}`);
    const stamp = parseStamp(arr[0]);
    if (arr.length === 1) map.set(k, { stamp, deleted: true });
    else map.set(k, { stamp, value: assertValue(arr[1]) });
  }
  const set = createSet();
  readBuckets(raw.set ?? {}, set.adds);
  readBuckets(raw.tombs ?? {}, set.tombs);
  const vv = {};
  for (const r of Object.keys(raw.vv).sort()) {
    assertReplicaId(r);
    const c = raw.vv[r];
    if (!Number.isSafeInteger(c) || c < 1) throw new RangeError(`contador inválido no vetor: ${r}`);
    vv[r] = c;
  }
  return { vv, map, set };
}
