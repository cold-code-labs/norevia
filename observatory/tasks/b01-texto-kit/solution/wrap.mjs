/**
 * Line wrapping and truncation.
 */

/**
 * wrap(text, width): greedy line wrapping.
 *  - words are separated by any whitespace (including \n); whitespace is collapsed;
 *  - each line receives as many words as fit, separated by one space,
 *    without the line length exceeding `width`;
 *  - a word longer than `width` occupies a line by itself (it is not split);
 *  - returns the lines joined by '\n'; text without words returns ''.
 * `width` must be an integer >= 1 (otherwise RangeError).
 *
 * @param {string} text
 * @param {number} width
 * @returns {string}
 */
export function wrap(text, width) {
  if (!Number.isInteger(width) || width < 1) throw new RangeError('width must be a positive integer');
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    if (line === '') line = w;
    else if (line.length + 1 + w.length <= width) line += ' ' + w;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines.join('\n');
}

/**
 * truncate(text, max, ellipsis = '…'): if text.length <= max returns the text intact;
 * otherwise returns the first (max - ellipsis.length) characters followed by `ellipsis`,
 * so that the result has exactly `max` characters.
 */
export function truncate(text, max, ellipsis = '…') {
  if (text.length <= max) return text;
  if (max < ellipsis.length) throw new RangeError('max smaller than ellipsis');
  return text.slice(0, max - ellipsis.length) + ellipsis;
}
