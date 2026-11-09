/**
 * Pagination of in-memory lists.
 *
 * Pages are numbered starting at 1. An empty list has exactly one
 * (empty) page. Requesting a page beyond the last one returns `items: []`, but the
 * metadata (total, totalPages, hasPrev, hasNext) remain valid.
 */

function assertPositiveInt(name, value) {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive integer, got ${value}`);
  }
}

/**
 * Total number of pages for `total` items with `pageSize` items per page.
 * Never returns less than 1.
 */
export function countPages(total, pageSize) {
  assertPositiveInt('pageSize', pageSize);
  return Math.max(1, Math.ceil(total / pageSize));
}

/**
 * Page (1-based) on which the item with index `index` (0-based) appears.
 */
export function pageForIndex(index, pageSize) {
  assertPositiveInt('pageSize', pageSize);
  if (!Number.isInteger(index) || index < 0) throw new RangeError('index must be a non-negative integer');
  return Math.floor(index / pageSize) + 1;
}

/**
 * paginate(items, page = 1, pageSize = 10)
 * -> { items, page, pageSize, total, totalPages, hasPrev, hasNext }
 * Does not modify `items`.
 */
export function paginate(items, page = 1, pageSize = 10) {
  if (!Array.isArray(items)) throw new TypeError('items must be an array');
  assertPositiveInt('page', page);
  const total = items.length;
  const totalPages = countPages(total, pageSize);
  const start = (page - 1) * pageSize;
  const pageItems = page <= totalPages ? items.slice(start, start + pageSize) : [];
  return {
    items: pageItems,
    page,
    pageSize,
    total,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}
