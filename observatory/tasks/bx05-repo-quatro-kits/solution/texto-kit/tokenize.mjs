/**
 * Tokenização de texto em palavras.
 *
 * Uma palavra é uma sequência maximal de letras ou dígitos Unicode que pode conter
 * apóstrofos (') ou hífens (-) isolados ENTRE dois caracteres alfanuméricos
 * ("d'água", "guarda-chuva"). Todo o resto é separador. Tokens saem em minúsculas.
 */
const WORD = /[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu;

/**
 * @param {string} text
 * @returns {string[]} tokens em minúsculas, na ordem em que aparecem
 */
export function tokenize(text) {
  if (typeof text !== 'string') throw new TypeError('text must be a string');
  return (text.match(WORD) ?? []).map((w) => w.toLowerCase());
}

/**
 * Contagem de cada token.
 * @param {string} text
 * @returns {Map<string, number>} token -> contagem, na ordem da primeira ocorrência
 */
export function frequencies(text) {
  const freq = new Map();
  for (const t of tokenize(text)) freq.set(t, (freq.get(t) ?? 0) + 1);
  return freq;
}

/**
 * As `n` palavras mais frequentes.
 *
 * Ordenação: contagem decrescente; empates em ordem crescente da palavra
 * (comparação simples de strings do JavaScript). Palavras listadas em `exclude`
 * (comparadas em minúsculas) são ignoradas. n <= 0 devolve [].
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
  entries.sort((a, b) => b.count - a.count || (a.word < b.word ? -1 : 1));
  return entries.slice(0, n);
}
