/**
 * Text truncation for display (titles, notifications, previews).
 *
 * All lengths are measured in Unicode code points, not in UTF-16
 * units: an emoji such as '😀' counts 1. (Composite grapheme clusters, such as
 * flags or ZWJ sequences, receive no special treatment.)
 */

/** Number of code points of `s`. */
export function codePointLength(s) {
  let n = 0;
  for (const _ of s) n++;
  return n;
}

/**
 * truncate(text, maxLength, ellipsis = '…')
 *
 * - If `text` fits in `maxLength` code points, it is returned unchanged.
 * - Otherwise, keeps the first (maxLength - length(ellipsis)) code points,
 *   removes trailing whitespace from that excerpt and appends `ellipsis`.
 * - If `maxLength` cannot hold even the ellipsis plus one character
 *   (maxLength <= length(ellipsis)), returns only the first
 *   `maxLength` code points of `text`, without ellipsis.
 */
export function truncate(text, maxLength, ellipsis = '…') {
  if (typeof text !== 'string' || typeof ellipsis !== 'string') {
    throw new TypeError('text and ellipsis must be strings');
  }
  if (!Number.isInteger(maxLength) || maxLength < 0) {
    throw new RangeError('maxLength must be a non-negative integer');
  }
  const chars = Array.from(text);
  if (chars.length <= maxLength) return text;

  const ellipsisLength = codePointLength(ellipsis);
  if (maxLength <= ellipsisLength) return chars.slice(0, maxLength).join('');

  const keep = maxLength - ellipsisLength;
  return chars.slice(0, keep).join('').trimEnd() + ellipsis;
}

/**
 * Applies `truncate` to each string field of `record` listed in `limits`, returning a
 * new object (the original is not modified).
 */
export function truncateFields(record, limits, ellipsis = '…') {
  const out = { ...record };
  for (const [field, max] of Object.entries(limits)) {
    if (typeof out[field] === 'string') out[field] = truncate(out[field], max, ellipsis);
  }
  return out;
}
