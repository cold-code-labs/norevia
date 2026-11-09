/**
 * Alinhamento de linhas já quebradas: esquerda, direita, centro e justificado.
 */
import { width, codePoints } from './measure.mjs';

export const ALIGNS = Object.freeze(['left', 'right', 'center', 'justify']);

function checkWidth(w) {
  if (!Number.isInteger(w) || w < 1) throw new RangeError(`largura inválida: ${w}`);
  return w;
}

/** Tamanhos das `gaps` lacunas que somam `spaces` (cada uma >= 1). */
export function distribute(spaces, gaps) {
  if (!Number.isInteger(spaces) || !Number.isInteger(gaps) || gaps < 1) throw new RangeError('argumentos inválidos');
  if (spaces < gaps) throw new RangeError(`espaços insuficientes: ${spaces} para ${gaps} lacunas`);
  const base = Math.floor(spaces / gaps);
  const extra = spaces % gaps;
  return Array.from({ length: gaps }, (_, i) => base + (i < extra ? 1 : 0));
}

export function padEndTo(s, lineWidth) {
  return s + ' '.repeat(Math.max(0, checkWidth(lineWidth) - width(s)));
}

export function padStartTo(s, lineWidth) {
  return ' '.repeat(Math.max(0, checkWidth(lineWidth) - width(s))) + s;
}

export function centerIn(s, lineWidth) {
  const free = Math.max(0, checkWidth(lineWidth) - width(s));
  return ' '.repeat(Math.floor(free / 2)) + s;
}

export function justifyWords(words, lineWidth) {
  if (!Array.isArray(words) || words.length === 0) throw new TypeError('lista de palavras vazia');
  checkWidth(lineWidth);
  if (words.length === 1) return padEndTo(words[0], lineWidth);
  const total = words.reduce((n, w) => n + width(w), 0);
  const gaps = distribute(lineWidth - total, words.length - 1);
  let out = words[0];
  for (let i = 1; i < words.length; i++) out += ' '.repeat(gaps[i - 1]) + words[i];
  return out;
}

export function alignLine(s, lineWidth, align) {
  switch (align) {
    case 'left':
      return s;
    case 'right':
      return padStartTo(s, lineWidth);
    case 'center':
      return centerIn(s, lineWidth);
    case 'justify':
      return justifyWords(s.split(' ').filter(Boolean), lineWidth);
    default:
      throw new RangeError(`alinhamento inválido: ${align}`);
  }
}

/** Corta `s` para caber em `lineWidth` colunas, terminando em '…' quando corta. */
export function truncate(s, lineWidth, ellipsis = '…') {
  checkWidth(lineWidth);
  if (width(s) <= lineWidth) return s;
  const keep = lineWidth - width(ellipsis);
  if (keep < 0) throw new RangeError('reticências maiores que a largura');
  const out = [];
  let n = 0;
  for (const ch of codePoints(s)) {
    if (n >= keep) break;
    out.push(ch);
    if (width(ch) > 0) n++;
  }
  return out.join('') + ellipsis;
}

/** Alinha um bloco de linhas; no modo 'justify' a última linha fica à esquerda. */
export function alignBlock(lines, lineWidth, align) {
  if (!Array.isArray(lines)) throw new TypeError('linhas devem ser lista');
  return lines.map((s, i) => (align === 'justify' && i === lines.length - 1 ? s : alignLine(s, lineWidth, align)));
}
