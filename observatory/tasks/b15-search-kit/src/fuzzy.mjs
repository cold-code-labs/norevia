/**
 * Busca aproximada por subsequência, no estilo "abrir arquivo rápido".
 *
 * A comparação é feita code point a code point, após `toLowerCase()` de cada
 * code point isoladamente. O casamento é guloso: cada caractere da consulta
 * casa com a primeira ocorrência possível depois do casamento anterior.
 */

export const MATCH_POINTS = 1;
export const WORD_START_BONUS = 2;
export const CONSECUTIVE_BONUS = 3;

const WORD_CHAR = /^[\p{L}\p{N}]$/u;
const UPPER = /^\p{Lu}$/u;
const LOWER = /^\p{Ll}$/u;

/** Início de palavra: posição 0, após não-alfanumérico, ou maiúscula após minúscula. */
function isWordStart(cps, i) {
  if (i === 0) return true;
  const prev = cps[i - 1];
  if (!WORD_CHAR.test(prev)) return true;
  return UPPER.test(cps[i]) && LOWER.test(prev);
}

/**
 * Pontua `candidate` para a consulta `query`. Devolve `{ score, positions }`
 * (posições em code points do candidato) ou `null` se `query` não for
 * subsequência de `candidate`.
 */
export function fuzzyMatch(query, candidate) {
  if (typeof query !== 'string' || typeof candidate !== 'string') {
    throw new TypeError('query e candidate devem ser strings');
  }
  const q = [...query].map((ch) => ch.toLowerCase());
  const cps = [...candidate];
  const low = cps.map((ch) => ch.toLowerCase());
  const positions = [];
  let score = 0;
  let last = -1;
  for (const ch of q) {
    let i = last + 1;
    while (i < low.length && low[i] !== ch) i++;
    if (i >= low.length) return null;
    score += MATCH_POINTS;
    if (isWordStart(cps, i)) score += WORD_START_BONUS;
    if (i === last + 1) score += CONSECUTIVE_BONUS;
    positions.push(i);
    last = i;
  }
  return { score, positions };
}

/**
 * Filtra e ordena candidatos: pontuação decrescente; empate → menos code
 * points primeiro; persistindo, ordem original. `limit` corta o resultado.
 */
export function fuzzyFilter(query, candidates, { limit = Infinity } = {}) {
  if (!(limit === Infinity || (Number.isInteger(limit) && limit >= 0))) {
    throw new RangeError('limit deve ser inteiro >= 0');
  }
  const scored = [];
  candidates.forEach((item, index) => {
    const m = fuzzyMatch(query, item);
    if (m) scored.push({ item, score: m.score, positions: m.positions, index, size: [...item].length });
  });
  scored.sort((a, b) => b.score - a.score || a.size - b.size || a.index - b.index);
  return scored.slice(0, limit).map(({ item, score, positions }) => ({ item, score, positions }));
}
