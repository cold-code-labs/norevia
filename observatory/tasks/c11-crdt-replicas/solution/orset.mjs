/**
 * OR-set (observed-remove set) com etiquetas únicas por adição.
 * Estado: { adds, tombs }, ambos Map<elemento, Map<etiqueta, carimbo>>.
 */
import { compareStamps, formatStamp } from './clock.mjs';

export function assertElem(elem) {
  if (typeof elem !== 'string') throw new TypeError('elemento deve ser string');
  if (elem.length === 0) throw new RangeError('elemento vazio');
  return elem;
}

export function createSet() {
  return { adds: new Map(), tombs: new Map() };
}

function cloneBuckets(m) {
  const out = new Map();
  for (const [e, b] of m) out.set(e, new Map(b));
  return out;
}

export function orClone(set) {
  return { adds: cloneBuckets(set.adds), tombs: cloneBuckets(set.tombs) };
}

function bucket(m, elem) {
  let b = m.get(elem);
  if (b === undefined) {
    b = new Map();
    m.set(elem, b);
  }
  return b;
}

function sortedTags(b) {
  return [...b.values()].sort(compareStamps).map(formatStamp);
}

/** Incorpora uma etiqueta (local ou remota); etiquetas já enterradas são ignoradas. */
export function orAddTag(set, elem, stamp) {
  const tag = formatStamp(stamp);
  if (set.tombs.get(elem)?.has(tag)) return false;
  const b = bucket(set.adds, elem);
  if (b.has(tag)) return false;
  b.set(tag, stamp);
  return true;
}

/** Adição local com etiqueta nova. */
export function orAdd(set, elem, stamp) {
  assertElem(elem);
  const tag = formatStamp(stamp);
  bucket(set.adds, elem).set(tag, stamp);
  return tag;
}

/** Enterra uma etiqueta (local ou remota). */
export function orApplyTomb(set, elem, stamp) {
  const tag = formatStamp(stamp);
  bucket(set.tombs, elem).set(tag, stamp);
  const b = set.adds.get(elem);
  if (b !== undefined) {
    b.delete(tag);
    if (b.size === 0) set.adds.delete(elem);
  }
}

/** Remoção local: enterra todas as etiquetas observadas do elemento. */
export function orRemove(set, elem) {
  assertElem(elem);
  const b = set.adds.get(elem);
  if (b === undefined) return [];
  const tags = sortedTags(b);
  for (const s of [...b.values()]) orApplyTomb(set, elem, s);
  return tags;
}

export function orHas(set, elem) {
  return (set.adds.get(elem)?.size ?? 0) > 0;
}

export function orValues(set) {
  return [...set.adds].filter(([, b]) => b.size > 0).map(([e]) => e).sort();
}

export function orTags(set, elem) {
  const b = set.adds.get(elem);
  return b === undefined ? [] : sortedTags(b);
}

export function orTombTags(set, elem) {
  const b = set.tombs.get(elem);
  return b === undefined ? [] : sortedTags(b);
}

export function orMerge(a, b) {
  const out = orClone(a);
  for (const [elem, t] of b.tombs) for (const s of t.values()) orApplyTomb(out, elem, s);
  for (const [elem, t] of b.adds) for (const s of t.values()) orAddTag(out, elem, s);
  return out;
}
