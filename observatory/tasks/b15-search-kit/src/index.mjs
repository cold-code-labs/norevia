/**
 * Kit de busca: análise de texto, busca aproximada, ranqueamento BM25,
 * destaque de trechos e paginação por cursor. Os módulos são independentes.
 */
export { DEFAULT_STOPWORDS, normalize, analyze, termFrequencies, edgeNgrams } from './analyze.mjs';
export { fuzzyMatch, fuzzyFilter } from './fuzzy.mjs';
export { K1, B, createIndex, idf, score, search } from './rank.mjs';
export { escapeHtml, mergeRanges, findMatches, highlight, snippet } from './highlight.mjs';
export { encodeCursor, decodeCursor, paginate, collectAll } from './cursor.mjs';
