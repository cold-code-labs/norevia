/**
 * Text processing kit: tokenization, slugs and line wrapping.
 */
import { tokenize, frequencies, topWords } from './tokenize.mjs';
import { slugify, uniqueSlug } from './slugify.mjs';
import { wrap, truncate } from './wrap.mjs';

export { tokenize, frequencies, topWords, slugify, uniqueSlug, wrap, truncate };

/**
 * Summary of a text: title as a slug, the `n` most frequent words and the body
 * wrapped into lines of width `width`.
 */
export function summarize(title, body, { n = 3, width = 72 } = {}) {
  return {
    slug: slugify(title),
    top: topWords(body, n).map((e) => e.word),
    text: wrap(body, width),
  };
}
