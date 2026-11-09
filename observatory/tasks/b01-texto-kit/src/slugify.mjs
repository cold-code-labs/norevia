/**
 * Slug generation for URLs.
 *
 * slugify(input, { separator = '-', maxLength = Infinity }):
 *  1. normalizes to NFD and removes the diacritical marks (ç → c, ã → a);
 *  2. converts to lowercase;
 *  3. each sequence of characters outside [a-z0-9] becomes ONE separator;
 *  4. removes separators from the start and the end;
 *  5. if the result has more than maxLength characters, it is cut at maxLength
 *     and the final slug never ends with a separator.
 */
export function slugify(input, { separator = '-', maxLength = Infinity } = {}) {
  if (typeof input !== 'string') throw new TypeError('input must be a string');
  if (!(maxLength >= 0)) throw new RangeError('maxLength must be >= 0');
  let s = input.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  s = s.replace(/[^a-z0-9]+/g, separator);
  s = trimSeparator(s, separator);
  if (s.length > maxLength) s = s.slice(0, maxLength);
  return s;
}

function trimSeparator(s, sep) {
  if (!sep) return s;
  while (s.startsWith(sep)) s = s.slice(sep.length);
  while (s.endsWith(sep)) s = s.slice(0, -sep.length);
  return s;
}

/**
 * Slug that does not collide with any of `taken` (Set or array of existing slugs).
 * If slugify(input) already exists, appends separator + 2, 3, ... until it finds a free one.
 */
export function uniqueSlug(input, taken, options = {}) {
  const used = taken instanceof Set ? taken : new Set(taken);
  const base = slugify(input, options);
  if (!used.has(base)) return base;
  const sep = options.separator ?? '-';
  for (let i = 2; ; i++) {
    const candidate = `${base}${sep}${i}`;
    if (!used.has(candidate)) return candidate;
  }
}
