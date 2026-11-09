/**
 * Pontos de hifenização marcados por hífens suaves (U+00AD).
 */
import { SHY, codePoints, width } from './measure.mjs';

function checkMin(name, v) {
  if (!Number.isInteger(v) || v < 1) throw new RangeError(`${name} inválido: ${v}`);
  return v;
}

/**
 * Posições de quebra permitidas em `word`: para cada hífen suave, o número de
 * pontos de código visíveis antes dele. Crescente e sem repetição.
 */
export function hyphenPoints(word, { minLeft = 2, minRight = 2 } = {}) {
  checkMin('minLeft', minLeft);
  checkMin('minRight', minRight);
  const total = width(word);
  const out = [];
  let visible = 0;
  for (const ch of codePoints(word)) {
    if (ch === SHY) {
      const k = visible;
      if (k >= minLeft && total - k >= minRight && out[out.length - 1] !== k) out.push(k);
    }
    visible++;
  }
  return out;
}

/** Maior ponto `k` de `points` com k + 1 <= room (cabeça + '-'), ou -1. */
export function bestPoint(points, room) {
  let best = -1;
  for (const k of points) if (k + 1 <= room && k > best) best = k;
  return best;
}

/** Texto visível de uma palavra (sem hífens suaves). */
export function visibleText(word) {
  return codePoints(word).filter((ch) => ch !== SHY).join('');
}

/**
 * Insere hífens suaves em `word` conforme o dicionário `dict`
 * (palavra visível em minúsculas → mesma palavra com '-' nos pontos de quebra).
 * Palavras ausentes do dicionário (ou que já têm hífen suave) voltam intactas.
 */
export function markHyphens(word, dict) {
  if (typeof word !== 'string') throw new TypeError('palavra deve ser string');
  if (word.includes(SHY)) return word;
  const pattern = dict instanceof Map ? dict.get(word.toLowerCase()) : dict?.[word.toLowerCase()];
  if (typeof pattern !== 'string') return word;
  const chars = codePoints(word);
  const out = [];
  let i = 0;
  for (const p of codePoints(pattern)) {
    if (p === '-') {
      if (i > 0 && i < chars.length) out.push(SHY);
      continue;
    }
    if (i >= chars.length || p.toLowerCase() !== chars[i].toLowerCase()) return word;
    out.push(chars[i]);
    i++;
  }
  return i === chars.length ? out.join('') : word;
}

/** Aplica `markHyphens` a cada palavra (sequência sem espaços) de `text`. */
export function hyphenateText(text, dict) {
  if (typeof text !== 'string') throw new TypeError('texto deve ser string');
  return text.replace(/[^ \n]+/g, (w) => markHyphens(w, dict));
}
