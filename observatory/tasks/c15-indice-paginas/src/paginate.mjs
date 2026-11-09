/**
 * Paginação por cursor sobre `range`.
 */
import { encodeCursor, decodeCursor } from './keys.mjs';
import { range } from './range.mjs';

export function paginate(index, options = {}) {
  const { pageSize = 10, cursor = null, reverse = false, ...rest } = options;
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 1000) throw new RangeError(`pageSize inválido: ${pageSize}`);
  const query = { ...rest, reverse, limit: pageSize };
  delete query.after;
  delete query.before;
  if (cursor !== null) {
    const pos = decodeCursor(cursor);
    if (reverse) query.before = pos;
    else query.after = pos;
  }
  const found = range(index, query);
  const items = found.slice(0, pageSize).map(({ key, id, value }) => ({ key, id, value }));
  const next = found.length === pageSize ? encodeCursor(items[items.length - 1]) : null;
  return { items, next };
}

export function* pages(index, options = {}) {
  let cursor = null;
  do {
    const page = paginate(index, { ...options, cursor });
    yield page.items;
    cursor = page.next;
  } while (cursor !== null);
}

export function collect(index, options = {}) {
  const out = [];
  for (const items of pages(index, options)) out.push(...items);
  return out;
}
