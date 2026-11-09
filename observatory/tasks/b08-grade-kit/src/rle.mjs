/**
 * Run-length encoding of grid rows: "aaabcc" ↔ "3ab2c".
 * Runs of length 1 get no number; counts may have several digits.
 */

export function encodeRow(s) {
  if (/\d/.test(s)) throw new RangeError('digits cannot be run-length encoded');
  let out = '';
  for (let i = 0; i < s.length; ) {
    let j = i;
    while (j < s.length && s[j] === s[i]) j++;
    const n = j - i;
    out += (n > 1 ? n : '') + s[i];
    i = j;
  }
  return out;
}

/** Inverse of encodeRow. Count without a character at the end → SyntaxError. */
export function decodeRow(s) {
  let out = '';
  let count = '';
  for (const ch of s) {
    if (ch >= '0' && ch <= '9') count = ch;
    else {
      out += ch.repeat(count === '' ? 1 : Number(count));
      count = '';
    }
  }
  if (count !== '') throw new SyntaxError('dangling count');
  return out;
}

/** Encodes a grid (array of rows) row by row. */
export const encodeGrid = (rows) => rows.map(encodeRow);
export const decodeGrid = (rows) => rows.map(decodeRow);
