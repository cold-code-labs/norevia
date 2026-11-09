import { stringWidth } from './width.mjs';
import { padEnd, padStart, center } from './align.mjs';
import { truncateEnd } from './truncate.mjs';

const ALIGNERS = { left: (t, w) => padEnd(t, w), right: padStart, center };

export function box(lines, { padding = 1, title = '', align = 'left' } = {}) {
  if (!Array.isArray(lines) || !lines.every((l) => typeof l === 'string')) throw new TypeError('lines deve ser array de strings');
  if (!Number.isInteger(padding) || padding < 0) throw new RangeError(`padding inválido: ${padding}`);
  if (typeof title !== 'string') throw new TypeError('title deve ser string');
  if (!(align in ALIGNERS)) throw new RangeError(`alinhamento inválido: ${align}`);
  const content = Math.max(0, ...lines.map(stringWidth));
  const inner = content + 2 * padding;
  let top;
  if (title === '') top = '┌' + '─'.repeat(inner) + '┐';
  else {
    const label = ' ' + truncateEnd(title, Math.max(0, inner - 3)) + ' ';
    const lw = stringWidth(label);
    top = lw + 1 <= inner ? '┌─' + label + '─'.repeat(inner - 1 - lw) + '┐' : '┌' + '─'.repeat(inner) + '┐';
  }
  const pad = ' '.repeat(padding);
  const body = lines.map((l) => '│' + pad + ALIGNERS[align](l, content) + pad + '│');
  return [top, ...body, '└' + '─'.repeat(inner) + '┘'];
}

export function frameWidth(lines, padding = 1) {
  return Math.max(0, ...lines.map(stringWidth)) + 2 * padding + 2;
}
