import { stringWidth } from './width.mjs';
import { wrap } from './wrap.mjs';

function check(text, width) {
  if (typeof text !== 'string') throw new TypeError('texto deve ser string');
  if (!Number.isInteger(width) || width < 0) throw new RangeError(`largura inválida: ${width}`);
}

export function padEnd(text, width) {
  check(text, width);
  return text + ' '.repeat(Math.max(0, width - stringWidth(text)));
}

export function padStart(text, width) {
  check(text, width);
  return ' '.repeat(Math.max(0, width - stringWidth(text))) + text;
}

export function center(text, width) {
  check(text, width);
  const extra = Math.max(0, width - stringWidth(text));
  const left = Math.floor(extra / 2);
  return ' '.repeat(left) + text + ' '.repeat(extra - left);
}

export function justify(line, width) {
  check(line, width);
  const words = line.split(' ').filter((w) => w !== '');
  if (words.length === 0) return ' '.repeat(width);
  if (words.length === 1) return padEnd(words[0], width);
  const natural = stringWidth(words.join(' '));
  if (natural >= width) return words.join(' ');
  const gaps = words.length - 1;
  const total = width - natural + gaps;
  const base = Math.floor(total / gaps);
  const rem = total % gaps;
  let out = words[0];
  for (let i = 0; i < gaps; i++) {
    const sp = base + (i < rem ? 1 : 0);
    out += ' '.repeat(sp) + words[i + 1];
  }
  return out;
}

const ALIGN = { left: padEnd, right: padStart, center };

export function table(rows, aligns = [], { header = false } = {}) {
  if (!Array.isArray(rows) || !rows.every(Array.isArray)) throw new TypeError('rows deve ser array de arrays');
  for (const a of aligns) if (!(a in ALIGN)) throw new RangeError(`alinhamento inválido: ${a}`);
  const ncols = Math.max(0, ...rows.map((r) => r.length));
  const widths = [];
  for (let c = 0; c < ncols; c++) widths.push(Math.max(...rows.map((r) => stringWidth(r[c] ?? ''))));
  const lines = rows.map((r) => widths.map((w, c) => ALIGN[aligns[c] ?? 'left'](r[c] ?? '', w)).join(' | '));
  if (header && lines.length) lines.splice(1, 0, widths.map((w) => '-'.repeat(w)).join('-+-'));
  return lines;
}

export function columns(items, width, gap = 2) {
  if (!Array.isArray(items) || !items.every((s) => typeof s === 'string')) throw new TypeError('items deve ser array de strings');
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(gap) || gap < 0) throw new RangeError('largura ou espaçamento inválido');
  const n = items.length;
  if (n === 0) return [];
  const widths = items.map(stringWidth);
  let best = { rows: n, colW: [Math.max(...widths)] };
  for (let k = 2; k <= n; k++) {
    const rows = Math.ceil(n / k);
    if (Math.ceil(n / rows) < k) continue;
    const colW = [];
    for (let c = 0; c < k; c++) colW.push(Math.max(...widths.slice(c * rows, (c + 1) * rows)));
    if (colW.reduce((s, w) => s + w, 0) + gap * (k - 1) <= width) best = { rows, colW };
  }
  const lines = [];
  for (let r = 0; r < best.rows; r++) {
    const cells = [];
    for (let c = 0; c < best.colW.length; c++) {
      const i = c * best.rows + r;
      if (i < n) cells.push(padEnd(items[i], best.colW[c]));
    }
    lines.push(cells.join(' '.repeat(gap)).trimEnd());
  }
  return lines;
}

export function justifyText(text, width) {
  const out = [];
  for (const para of text.split('\n')) {
    const lines = wrap(para, width);
    lines.forEach((l, i) => out.push(i < lines.length - 1 ? justify(l, width) : l));
  }
  return out;
}
