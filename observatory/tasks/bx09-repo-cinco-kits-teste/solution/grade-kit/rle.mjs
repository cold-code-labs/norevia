/**
 * Codificação run-length de linhas de grade: "aaabcc" ↔ "3ab2c".
 * Corridas de tamanho 1 não levam número; contagens podem ter vários dígitos.
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

/** Inverso de encodeRow. Contagem sem caractere no final → SyntaxError. */
export function decodeRow(s) {
  let out = '';
  let count = '';
  for (const ch of s) {
    if (ch >= '0' && ch <= '9') count += ch;
    else {
      out += ch.repeat(count === '' ? 1 : Number(count));
      count = '';
    }
  }
  if (count !== '') throw new SyntaxError('dangling count');
  return out;
}

/** Codifica uma grade (array de linhas) linha a linha. */
export const encodeGrid = (rows) => rows.map(encodeRow);
export const decodeGrid = (rows) => rows.map(decodeRow);
