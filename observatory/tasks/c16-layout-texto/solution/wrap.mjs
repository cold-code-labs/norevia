/**
 * Quebra gulosa de um parágrafo em linhas, com hifenização opcional.
 * Linhas: { start, end, hyphen }, deslocamentos em pontos de código no texto.
 */
import { SHY, codePoints, width, cpSlice, toCpIndex } from './measure.mjs';
import { hyphenPoints, bestPoint } from './hyphenate.mjs';

function words(text) {
  const out = [];
  for (const m of text.matchAll(/[^ ]+/g)) {
    const start = toCpIndex(text, m.index);
    out.push({ text: m[0], start, end: start + codePoints(m[0]).length });
  }
  return out;
}

/** Índice (em pontos de código) do hífen suave precedido por `k` pontos visíveis. */
function shyIndex(word, k) {
  let visible = 0;
  let i = 0;
  for (const ch of codePoints(word)) {
    if (ch === SHY && visible === k) return i;
    if (ch !== SHY) visible++;
    i++;
  }
  throw new RangeError(`sem hífen suave na posição ${k}`);
}

/** Menor prefixo (em pontos de código) que contém `n` pontos visíveis. */
function prefixFor(word, n) {
  let visible = 0;
  let i = 0;
  for (const ch of codePoints(word)) {
    i++;
    if (ch !== SHY) {
      visible++;
      if (visible === n) return i;
    }
  }
  return i;
}

function rest(piece, n) {
  const text = cpSlice(piece.text, n);
  if (width(text) === 0) return null;
  return { text, start: piece.start + n, end: piece.end };
}

export function wrap(text, lineWidth, { hyphenate = false, minLeft = 2, minRight = 2 } = {}) {
  if (typeof text !== 'string') throw new TypeError('texto deve ser string');
  if (text.includes('\n')) throw new RangeError('wrap recebe um único parágrafo');
  if (!Number.isInteger(lineWidth) || lineWidth < 1) throw new RangeError(`largura inválida: ${lineWidth}`);
  const lines = [];
  let cur = null;
  const flush = (hyphen) => {
    lines.push({ start: cur.start, end: cur.end, hyphen });
    cur = null;
  };
  for (const w of words(text)) {
    let piece = width(w.text) === 0 ? null : w;
    while (piece) {
      const pw = width(piece.text);
      const room = cur ? lineWidth - cur.width - 1 : lineWidth;
      if (pw <= room) {
        if (cur) {
          cur.end = piece.end;
          cur.width += 1 + pw;
        } else {
          cur = { start: piece.start, end: piece.end, width: pw };
        }
        piece = null;
        continue;
      }
      if (hyphenate) {
        const k = bestPoint(hyphenPoints(piece.text, { minLeft, minRight }), room);
        if (k !== -1) {
          const cut = shyIndex(piece.text, k);
          if (cur) cur.end = piece.start + cut;
          else cur = { start: piece.start, end: piece.start + cut, width: k };
          flush(true);
          piece = rest(piece, cut + 1);
          continue;
        }
      }
      if (cur) {
        flush(false);
        continue;
      }
      const cut = prefixFor(piece.text, lineWidth);
      lines.push({ start: piece.start, end: piece.start + cut, hyphen: false });
      piece = rest(piece, cut);
    }
  }
  if (cur) flush(false);
  return lines;
}

/**
 * Quebra um texto com vários parágrafos (separados por '\n').
 * Cada linha ganha `para` (índice do parágrafo) e deslocamentos relativos ao texto inteiro.
 */
export function wrapText(text, lineWidth, options = {}) {
  if (typeof text !== 'string') throw new TypeError('texto deve ser string');
  const out = [];
  let offset = 0;
  text.split('\n').forEach((para, i) => {
    for (const ln of wrap(para, lineWidth, options)) {
      out.push({ para: i, start: offset + ln.start, end: offset + ln.end, hyphen: ln.hyphen });
    }
    offset += codePoints(para).length + 1;
  });
  return out;
}
