/**
 * Diagramação: parágrafos → linhas quebradas e alinhadas.
 */
import { cpSlice, stripShy, width as cols } from './measure.mjs';
import { wrap } from './wrap.mjs';
import { ALIGNS, alignLine, justifyWords, padEndTo, truncate } from './align.mjs';

/** Texto visível de uma linha devolvida por `wrap`. */
export function lineText(text, line) {
  const raw = cpSlice(text, line.start, line.end);
  const words = stripShy(raw).split(' ').filter(Boolean);
  return words.join(' ') + (line.hyphen ? '-' : '');
}

export function layout(text, { width, align = 'left', hyphenate = false } = {}) {
  if (typeof text !== 'string') throw new TypeError('texto deve ser string');
  if (!ALIGNS.includes(align)) throw new RangeError(`alinhamento inválido: ${align}`);
  const out = [];
  for (const para of text.split('\n')) {
    const lines = wrap(para, width, { hyphenate });
    if (lines.length === 0) {
      out.push('');
      continue;
    }
    lines.forEach((ln, i) => {
      const s = lineText(para, ln);
      if (align === 'justify') out.push(i === lines.length - 1 ? s : justifyWords(s.split(' '), width));
      else out.push(alignLine(s, width, align));
    });
  }
  return out;
}

export function render(text, options) {
  return layout(text, options).join('\n');
}

/** Caixa com bordas em volta do texto diagramado; o título é cortado com '…' se preciso. */
export function frame(text, { width, title = '', ...options } = {}) {
  const body = layout(text, { width, ...options });
  const head = title === '' ? '' : truncate(` ${title} `, width);
  const top = '┌' + head + '─'.repeat(width - cols(head)) + '┐';
  const rows = body.map((ln) => '│' + padEndTo(ln, width) + '│');
  return [top, ...rows, '└' + '─'.repeat(width) + '┘'].join('\n');
}

/** Estatísticas da diagramação. */
export function stats(text, options) {
  const lines = layout(text, options);
  let hyphenated = 0;
  let maxWidth = 0;
  let used = 0;
  for (const p of text.split('\n')) for (const ln of wrap(p, options.width, { hyphenate: options.hyphenate ?? false })) if (ln.hyphen) hyphenated++;
  for (const ln of lines) {
    const w = cols(ln);
    used += w;
    if (w > maxWidth) maxWidth = w;
  }
  return { lines: lines.length, hyphenated, maxWidth, fill: lines.length === 0 ? 0 : used / (lines.length * options.width) };
}

/** Diagrama vários textos lado a lado, cada um numa coluna de `width` colunas. */
export function columns(texts, { width, gap = 2, ...options } = {}) {
  if (!Array.isArray(texts) || texts.length === 0) throw new TypeError('lista de textos vazia');
  if (!Number.isInteger(gap) || gap < 0) throw new RangeError(`espaçamento inválido: ${gap}`);
  const blocks = texts.map((t) => layout(t, { width, ...options }));
  const rows = Math.max(...blocks.map((b) => b.length));
  const out = [];
  for (let r = 0; r < rows; r++) {
    const cells = blocks.map((b) => padEndTo(b[r] ?? '', width));
    out.push(cells.join(' '.repeat(gap)).trimEnd());
  }
  return out;
}

/** Régua de colunas: '....+....1....+....2…' com `width` caracteres. */
export function ruler(width) {
  if (!Number.isInteger(width) || width < 1) throw new RangeError(`largura inválida: ${width}`);
  let out = '';
  for (let c = 1; c <= width; c++) out += c % 10 === 0 ? String((c / 10) % 10) : c % 5 === 0 ? '+' : '.';
  return out;
}
