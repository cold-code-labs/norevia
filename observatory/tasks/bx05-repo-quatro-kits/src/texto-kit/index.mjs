/**
 * Kit de processamento de texto: tokenização, slugs e quebra de linhas.
 */
import { tokenize, frequencies, topWords } from './tokenize.mjs';
import { slugify, uniqueSlug } from './slugify.mjs';
import { wrap, truncate } from './wrap.mjs';

export { tokenize, frequencies, topWords, slugify, uniqueSlug, wrap, truncate };

/**
 * Resumo de um texto: título em slug, as `n` palavras mais frequentes e o corpo
 * quebrado em linhas de largura `width`.
 */
export function summarize(title, body, { n = 3, width = 72 } = {}) {
  return {
    slug: slugify(title),
    top: topWords(body, n).map((e) => e.word),
    text: wrap(body, width),
  };
}
