/**
 * Codificação canônica do estado de uma réplica (texto JSON) e leitura de carimbos.
 */
import { assertReplicaId, makeStamp, formatStamp, compareStamps } from './clock.mjs';
import { createMap, assertKey, assertValue } from './lww.mjs';
import { createSet, assertElem } from './orset.mjs';

export function parseStamp(text) {
  if (typeof text !== 'string') throw new TypeError('carimbo deve ser string');
  const i = text.lastIndexOf('@');
  if (i < 0) throw new RangeError(`carimbo sem '@': ${JSON.stringify(text)}`);
  const replica = text.slice(0, i);
  const counter = text.slice(i + 1);
  if (!/^[1-9]\d*$/.test(counter)) throw new RangeError(`contador inválido em ${JSON.stringify(text)}`);
  return makeStamp(Number(counter), replica);
}

function sortedObject(entries) {
  return Object.fromEntries([...entries].sort(([x], [y]) => (x < y ? -1 : x > y ? 1 : 0)));
}

function tagList(b) {
  return [...b.values()].sort(compareStamps).map(formatStamp);
}

function buckets(m) {
  return sortedObject([...m].filter(([, b]) => b.size > 0).map(([e, b]) => [e, tagList(b)]));
}

export function encodeState({ vv, map, set }) {
  const m = sortedObject([...map].map(([k, e]) => [k, e.deleted ? [formatStamp(e.stamp)] : [formatStamp(e.stamp), e.value]]));
  return JSON.stringify({ map: m, set: buckets(set.adds), tombs: buckets(set.tombs), vv: sortedObject(Object.entries(vv)) });
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
