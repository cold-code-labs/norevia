/**
 * Análise de texto para indexação: normalização, tokenização, frequências e
 * prefixos para autocompletar.
 */

/** Stopwords padrão (português), comparadas após a mesma normalização dos termos. */
export const DEFAULT_STOPWORDS = Object.freeze([
  'a', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'e', 'é', 'em', 'no', 'na', 'nos', 'nas',
  'um', 'uma', 'para', 'por', 'com', 'não', 'que', 'se', 'ao', 'à', 'às', 'ou', 'mais', 'já',
]);

const COMBINING = /[̀-ͯ]/g;
const TOKEN = /[\p{L}\p{N}]+/gu;

/** NFKD, remove marcas combinantes U+0300–U+036F e converte para minúsculas. */
export function normalize(text) {
  if (typeof text !== 'string') throw new TypeError('text deve ser string');
  return text.normalize('NFKD').replace(COMBINING, '').toLowerCase();
}

function checkOptions(minLength, stopwords) {
  if (!Number.isInteger(minLength) || minLength < 1) throw new RangeError('minLength deve ser inteiro >= 1');
  if (stopwords == null || typeof stopwords[Symbol.iterator] !== 'function') {
    throw new TypeError('stopwords deve ser iterável');
  }
}

/**
 * Termos do texto, em ordem de ocorrência: sequências maximais de letras e
 * dígitos Unicode do texto normalizado, com pelo menos `minLength` code points
 * e fora da lista de stopwords.
 */
export function analyze(text, { minLength = 2, stopwords = DEFAULT_STOPWORDS } = {}) {
  checkOptions(minLength, stopwords);
  const stop = new Set([...stopwords].map(normalize));
  const out = [];
  for (const m of normalize(text).matchAll(TOKEN)) {
    const term = m[0];
    if ([...term].length < minLength) continue;
    if (stop.has(term)) continue;
    out.push(term);
  }
  return out;
}

/** `Map` termo → contagem, com as chaves na ordem da primeira ocorrência. */
export function termFrequencies(text, options = {}) {
  const freq = new Map();
  for (const term of analyze(text, options)) freq.set(term, (freq.get(term) ?? 0) + 1);
  return freq;
}

/**
 * Prefixos de um termo para autocompletar, do menor (`min` code points) ao
 * termo inteiro, limitados a `max` code points.
 */
export function edgeNgrams(term, { min = 2, max = Infinity } = {}) {
  if (typeof term !== 'string') throw new TypeError('term deve ser string');
  if (!Number.isInteger(min) || min < 1) throw new RangeError('min deve ser inteiro >= 1');
  if (max !== Infinity && (!Number.isInteger(max) || max < min)) throw new RangeError('max inválido');
  const cps = [...term];
  const out = [];
  for (let n = min; n <= Math.min(max, cps.length); n++) out.push(cps.slice(0, n).join(''));
  return out;
}
