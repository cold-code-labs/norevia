import { segment } from './grapheme.mjs';
import { clusterWidth, stringWidth } from './width.mjs';

function cutWord(word, width) {
  const pieces = [];
  let cur = '';
  let w = 0;
  for (const c of segment(word)) {
    const cw = clusterWidth(c);
    if (cur !== '' && w + cw >= width) {
      pieces.push(cur);
      cur = '';
      w = 0;
    }
    cur += c;
    w += cw;
  }
  if (cur !== '') pieces.push(cur);
  return pieces;
}

export function wrap(text, width) {
  if (typeof text !== 'string') throw new TypeError('texto deve ser string');
  if (!Number.isInteger(width) || width < 1) throw new RangeError(`largura inválida: ${width}`);
  const lines = [];
  for (const para of text.split('\n')) {
    let line = '';
    let lw = 0;
    let has = false;
    for (const word of para.split(' ')) {
      if (word === '') continue;
      const ww = stringWidth(word);
      if (has && lw + 1 + ww <= width) {
        line += ' ' + word;
        lw += 1 + ww;
        continue;
      }
      if (has) lines.push(line);
      if (ww <= width) {
        line = word;
        lw = ww;
      } else {
        const pieces = cutWord(word, width);
        for (let i = 0; i < pieces.length - 1; i++) lines.push(pieces[i]);
        line = pieces[pieces.length - 1];
        lw = stringWidth(line);
      }
      has = true;
    }
    lines.push(line);
  }
  return lines;
}

export function wrapCount(text, width) {
  return wrap(text, width).length;
}

export function wrapIndent(text, width, prefix) {
  if (typeof prefix !== 'string') throw new TypeError('prefixo deve ser string');
  const inner = width - stringWidth(prefix);
  if (!Number.isInteger(inner) || inner < 1) throw new RangeError('prefixo não cabe na largura');
  return wrap(text, inner).map((l) => prefix + l);
}
