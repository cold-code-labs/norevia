/**
 * Quebra de linhas e truncamento.
 */

/**
 * wrap(text, width): quebra gulosa de linhas.
 *  - palavras são separadas por qualquer espaço em branco (inclusive \n); espaços são colapsados;
 *  - cada linha recebe tantas palavras quantas couberem, separadas por um espaço,
 *    sem que o comprimento da linha passe de `width`;
 *  - uma palavra mais longa que `width` ocupa sozinha uma linha (não é partida);
 *  - devolve as linhas unidas por '\n'; texto sem palavras devolve ''.
 * `width` deve ser inteiro >= 1 (senão RangeError).
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
 * truncate(text, max, ellipsis = '…'): se text.length <= max devolve o texto intacto;
 * senão devolve os primeiros (max - ellipsis.length) caracteres seguidos de `ellipsis`,
 * de modo que o resultado tenha exatamente `max` caracteres.
 */
export function truncate(text, max, ellipsis = '…') {
  if (text.length <= max) return text;
  if (max < ellipsis.length) throw new RangeError('max smaller than ellipsis');
  return text.slice(0, max - ellipsis.length) + ellipsis;
}
