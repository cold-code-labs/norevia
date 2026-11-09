/**
 * Tokenization of text into words.
 *
 * A word is a maximal sequence of Unicode letters or digits that may contain
 * single apostrophes (') or hyphens (-) BETWEEN two alphanumeric characters
 * ("d'água", "guarda-chuva"). Everything else is a separator. Tokens come out in lowercase.
 */
const WORD = /[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu;

/**
 * @param {string} text
 * @returns {string[]} tokens in lowercase, in the order in which they appear
 */
export function tokenize(text) {
  if (typeof text !== 'string') throw new TypeError('text must be a string');
  return (text.match(WORD) ?? []).map((w) => w.toLowerCase());
}

/**
 * Count of each token.
 * @param {string} text
 * @returns {Map<string, number>} token -> count, in order of first occurrence
 */
export function frequencies(text) {
  const freq = new Map();
  for (const t of tokenize(text)) freq.set(t, (freq.get(t) ?? 0) + 1);
  return freq;
}

/**
 * The `n` most frequent words.
 *
 * Ordering: descending count; ties in ascending order of the word
 * (plain JavaScript string comparison). Words listed in `exclude`
 * (compared in lowercase) are ignored. n <= 0 returns [].
 *
 * @param {string} text
 * @param {number} [n=10]
 * @param {{ exclude?: string[] }} [options]
 * @returns {{ word: string, count: number }[]}
 */
export function topWords(text, n = 10, { exclude = [] } = {}) {
  if (n <= 0) return [];
  const skip = new Set(exclude.map((w) => w.toLowerCase()));
  const entries = [];
  for (const [word, count] of frequencies(text)) {
    if (!skip.has(word)) entries.push({ word, count });
  }
  entries.sort((a, b) => b.count - a.count || (a.word > b.word ? -1 : 1));
  return entries.slice(0, n);
}
