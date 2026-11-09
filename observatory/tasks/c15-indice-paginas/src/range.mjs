/**
 * Consultas por intervalo, nos dois sentidos.
 */
import { comparePos, maxPos, minPos, LOW_ID, HIGH_ID } from './keys.mjs';
import { lowerBound, upperBound } from './page.mjs';

export function bounds({ gt, gte, lt, lte, after, before } = {}) {
  let lower = null;
  let upper = null;
  if (gte !== undefined) lower = maxPos(lower, { key: gte, id: LOW_ID });
  if (gt !== undefined) lower = maxPos(lower, { key: gt, id: HIGH_ID });
  if (after !== undefined && after !== null) lower = maxPos(lower, after);
  if (lte !== undefined) upper = minPos(upper, { key: lte, id: HIGH_ID });
  if (lt !== undefined) upper = minPos(upper, { key: lt, id: LOW_ID });
  if (before !== undefined && before !== null) upper = minPos(upper, before);
  return { lower, upper };
}

function firstAbove(index, lower) {
  if (index.pages.length === 0) return null;
  if (lower === null) return { p: 0, slot: 0 };
  let p = index.locate(lower, false);
  let slot = upperBound(index.pages[p], lower);
  if (slot >= index.pages[p].length) {
    p++;
    slot = 0;
  }
  return p < index.pages.length ? { p, slot } : null;
}

function lastBelow(index, upper) {
  if (index.pages.length === 0) return null;
  if (upper === null) {
    const p = index.pages.length - 1;
    return { p, slot: index.pages[p].length - 1 };
  }
  let p = index.locate(upper, true);
  let slot = lowerBound(index.pages[p], upper) - 1;
  if (slot < 0) {
    p--;
    if (p < 0) return null;
    slot = index.pages[p].length - 1;
  }
  return { p, slot };
}

export function range(index, options = {}) {
  const { reverse = false, limit = Infinity } = options;
  if (!(limit === Infinity || (Number.isInteger(limit) && limit >= 0))) throw new RangeError(`limit inválido: ${limit}`);
  const { lower, upper } = bounds(options);
  const out = [];
  if (lower !== null && upper !== null && comparePos(lower, upper) >= 0) return out;
  if (!reverse) {
    let at = firstAbove(index, lower);
    while (at && out.length < limit) {
      const e = index.entry(at.p, at.slot);
      if (upper !== null && comparePos(e, upper) >= 0) break;
      out.push(e);
      at.slot++;
      if (at.slot >= index.pages[at.p].length) at = at.p + 1 < index.pages.length ? { p: at.p + 1, slot: 0 } : null;
    }
  } else {
    let at = lastBelow(index, upper);
    while (at && out.length < limit) {
      const e = index.entry(at.p, at.slot);
      if (lower !== null && comparePos(e, lower) <= 0) break;
      out.push(e);
      at.slot--;
      if (at.slot < 0) at = at.p > 0 ? { p: at.p - 1, slot: index.pages[at.p - 1].length - 1 } : null;
    }
  }
  return out;
}

export function count(index, options = {}) {
  return range(index, { ...options, limit: Infinity }).length;
}

export function distinctKeys(index, options = {}) {
  const out = [];
  for (const e of range(index, { ...options, limit: Infinity })) {
    if (out.length === 0 || out[out.length - 1] !== e.key) out.push(e.key);
  }
  return out;
}
