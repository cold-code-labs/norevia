/**
 * Monetary amounts in reais, represented as integer cents.
 */

/**
 * formatBRL(cents): "R$ 1.234,56". Thousands separated by a dot, always two decimal
 * places after the comma; negatives get '-' before "R$".
 * @param {number} cents integer
 */
export function formatBRL(cents) {
  if (!Number.isInteger(cents)) throw new TypeError('cents must be an integer');
  const neg = cents < 0;
  const abs = Math.abs(cents);
  const reais = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const frac = String(abs % 100).padStart(2, '0');
  return `${neg ? '-' : ''}R$ ${reais},${frac}`;
}

/**
 * parseBRL(text): tolerant inverse of formatBRL. Accepts optional "R$" prefix,
 * optional '-' sign at the start, thousands with a dot (optional) and 0 to 2 decimal
 * places after the comma ("12,5" = 1250 cents). Invalid format → SyntaxError.
 */
export function parseBRL(text) {
  const m = /^\s*(-)?\s*(?:R\$\s*)?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?\s*$/.exec(text);
  if (!m) throw new SyntaxError(`invalid amount: ${text}`);
  const int = Number(m[2].replaceAll('.', ''));
  const frac = m[3] ? Number(m[3].padEnd(2, '0')) : 0;
  const value = int * 100 + frac;
  return m[1] && value !== 0 ? -value : value;
}

/**
 * splitEvenly(cents, n): splits a non-negative amount into n integer installments whose
 * sum is exactly `cents`. The installments differ by at most 1 cent and the
 * cents left over from the division go to the FIRST installments.
 * @returns {number[]}
 */
export function splitEvenly(cents, n) {
  if (!Number.isInteger(cents) || cents < 0) throw new RangeError('cents must be a non-negative integer');
  if (!Number.isInteger(n) || n < 1) throw new RangeError('n must be a positive integer');
  const base = Math.floor(cents / n);
  const rem = cents - base * n;
  const parts = [];
  for (let i = 0; i < n; i++) parts.push(base + (i >= n - rem ? 1 : 0));
  return parts;
}
