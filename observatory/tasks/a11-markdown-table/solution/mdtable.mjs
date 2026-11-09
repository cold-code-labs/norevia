/**
 * Markdown table formatter (GFM style) with display-width calculation
 * for monospaced terminals and editors.
 *
 * Public API:
 *   charWidth(cp)              width of a code point (0, 1 or 2)
 *   displayWidth(text)         sum of the widths of the code points
 *   escapeCell(value)          arbitrary value -> safe text for a cell
 *   unescapeCell(text)         inverse of escapeCell (for parseTable)
 *   padCell(text, width, al)   pads with spaces up to `width` columns
 *   normalizeRows(rows, opts)  rectangular { header, body } from arrays/objects
 *   formatTable(rows, opts)    table text
 *   parseTable(markdown)       { header, align, rows }
 */

/** (Inclusive) ranges of code points with width 0 (combining marks etc.). */
const ZERO_WIDTH = [
  [0x0300, 0x036f],
  [0x1ab0, 0x1aff],
  [0x1dc0, 0x1dff],
  [0x200b, 0x200f],
  [0x20d0, 0x20ff],
  [0xfe00, 0xfe0f],
  [0xfe20, 0xfe2f],
];

/** (Inclusive) ranges of code points with width 2 (wide / fullwidth). */
const WIDE = [
  [0x1100, 0x115f],
  [0x2e80, 0x303e],
  [0x3041, 0x33ff],
  [0x3400, 0x4dbf],
  [0x4e00, 0x9fff],
  [0xa000, 0xa4cf],
  [0xac00, 0xd7a3],
  [0xf900, 0xfaff],
  [0xfe30, 0xfe4f],
  [0xff00, 0xff60],
  [0xffe0, 0xffe6],
  [0x1f300, 0x1f64f],
  [0x1f900, 0x1f9ff],
  [0x20000, 0x3fffd],
];

const ALIGNMENTS = new Set(['left', 'right', 'center', 'none', 'auto']);

/** Minimum column width required by the separator's alignment marker. */
const MARKER_MIN = { none: 1, left: 2, right: 2, center: 3 };

/** Numeric cell for 'auto' alignment: optional sign, digits, decimal with '.' or ','. */
const NUMERIC = /^[-+]?\d+(?:[.,]\d+)?$/;

function inRanges(cp, ranges) {
  let lo = 0;
  let hi = ranges.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [a, b] = ranges[mid];
    if (cp < a) hi = mid - 1;
    else if (cp > b) lo = mid + 1;
    else return true;
  }
  return false;
}

/**
 * Display width of a code point: 0 for the zero-width ranges,
 * 2 for the wide ranges, 1 for everything else.
 * @param {number} cp integer in [0, 0x10FFFF]
 */
export function charWidth(cp) {
  if (!Number.isInteger(cp) || cp < 0 || cp > 0x10ffff) {
    throw new RangeError(`code point inválido: ${cp}`);
  }
  if (inRanges(cp, ZERO_WIDTH)) return 0;
  if (inRanges(cp, WIDE)) return 2;
  return 1;
}

/**
 * Display width of a string: sum of charWidth over its code points
 * (UTF-16 surrogate pairs count as a single code point).
 */
export function displayWidth(text) {
  if (typeof text !== 'string') throw new TypeError('displayWidth espera string');
  let w = 0;
  for (const ch of text) w += charWidth(ch.codePointAt(0));
  return w;
}

/**
 * Converts a value into cell text:
 *  - null/undefined -> '' ; other values -> String(value)
 *  - line breaks \r\n, \r and \n each count as ONE break
 *  - tabs become a space
 *  - whitespace at the ends is removed (trim)
 *  - inner breaks become '<br>' and each '|' becomes '\|'
 */
export function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const s = String(value).replace(/\r\n?/g, '\n').replace(/\t/g, ' ').trim();
  return s.replace(/\n/g, '<br>').replace(/\|/g, '\\|');
}

/** Inverse of escapeCell: '\|' -> '|' and '<br>' -> '\n'. */
export function unescapeCell(text) {
  return text.replace(/\\\|/g, '|').replace(/<br>/g, '\n');
}

/**
 * Pads `text` with spaces until it occupies `width` display columns.
 * 'right' puts the padding on the left; 'center' splits the padding,
 * with the odd space on the right; 'left' and 'none' pad on the right.
 * Text already wider than `width` is returned unchanged.
 */
export function padCell(text, width, align = 'left') {
  const extra = Math.max(0, width - displayWidth(text));
  if (align === 'right') return ' '.repeat(extra) + text;
  if (align === 'center') {
    const left = Math.floor(extra / 2);
    return ' '.repeat(left) + text + ' '.repeat(extra - left);
  }
  return text + ' '.repeat(extra);
}

function isPlainRow(row) {
  return row !== null && typeof row === 'object' && !Array.isArray(row);
}

/**
 * Normalizes the input into rectangular { header, body } (values not yet escaped).
 *
 * Array mode (first row is an array): without `columns`, the first row is the header;
 * with `columns`, all rows are body. The number of columns is the greatest length
 * among header and rows; missing positions become ''.
 *
 * Object mode (first row is an object): the header is `columns` or the union of the own
 * enumerable keys (Object.keys) of the rows, in order of first occurrence.
 * Key missing in the row -> ''.
 */
export function normalizeRows(rows, { columns } = {}) {
  if (!Array.isArray(rows)) throw new TypeError('rows deve ser um array');
  if (columns !== undefined && !Array.isArray(columns)) throw new TypeError('columns deve ser um array');
  if (rows.length === 0) return { header: columns ? [...columns] : [], body: [] };

  if (Array.isArray(rows[0])) {
    if (!rows.every(Array.isArray)) throw new TypeError('linhas misturam arrays e objetos');
    const header = columns ? [...columns] : [...rows[0]];
    const data = columns ? rows : rows.slice(1);
    let n = header.length;
    for (const r of data) n = Math.max(n, r.length);
    while (header.length < n) header.push('');
    const body = data.map((r) => Array.from({ length: n }, (_, j) => (j < r.length ? r[j] : '')));
    return { header, body };
  }

  if (!rows.every(isPlainRow)) throw new TypeError('linhas misturam arrays e objetos');
  let header;
  if (columns) {
    header = [...columns];
  } else {
    const seen = new Set();
    for (const r of rows) for (const k of Object.keys(r)) seen.add(k);
    header = [...seen];
  }
  const body = rows.map((r) => header.map((k) => (Object.hasOwn(r, k) ? r[k] : '')));
  return { header, body };
}

function resolveAlign(align, column) {
  if (align !== 'auto') return align;
  const filled = column.filter((c) => c !== '');
  return filled.length > 0 && filled.every((c) => NUMERIC.test(c)) ? 'right' : 'left';
}

function separator(width, align) {
  if (align === 'left') return ':' + '-'.repeat(width - 1);
  if (align === 'right') return '-'.repeat(width - 1) + ':';
  if (align === 'center') return ':' + '-'.repeat(width - 2) + ':';
  return '-'.repeat(width);
}

/**
 * Formats the table.
 * @param {Array<Array<*>>|Array<object>} rows
 * @param {object} [options]
 * @param {Array<'left'|'right'|'center'|'none'|'auto'|null|undefined>} [options.align]
 * @param {number} [options.minWidth=3] integer >= 1
 * @param {Array<string>} [options.columns]
 * @returns {string} lines joined by '\n', without a trailing '\n'; '' if there are no columns
 */
export function formatTable(rows, options = {}) {
  const { align = [], minWidth = 3, columns } = options;
  if (!Array.isArray(align)) throw new TypeError('align deve ser um array');
  for (const a of align) {
    if (a !== null && a !== undefined && !ALIGNMENTS.has(a)) throw new RangeError(`alinhamento inválido: ${a}`);
  }
  if (!Number.isInteger(minWidth) || minWidth < 1) throw new RangeError('minWidth deve ser inteiro >= 1');

  const { header, body } = normalizeRows(rows, { columns });
  const n = header.length;
  if (n === 0) return '';

  const head = header.map(escapeCell);
  const cells = body.map((r) => r.map(escapeCell));
  const aligns = [];
  const widths = [];
  for (let j = 0; j < n; j++) {
    const column = cells.map((r) => r[j]);
    const a = resolveAlign(align[j] ?? 'none', column);
    let w = Math.max(minWidth, MARKER_MIN[a], displayWidth(head[j]));
    for (const c of column) w = Math.max(w, displayWidth(c));
    aligns.push(a);
    widths.push(w);
  }

  const line = (cs) => '| ' + cs.map((c, j) => padCell(c, widths[j], aligns[j])).join(' | ') + ' |';
  const sep = '| ' + widths.map((w, j) => separator(w, aligns[j])).join(' | ') + ' |';
  return [line(head), sep, ...cells.map(line)].join('\n');
}

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  return s.split(/(?<!\\)\|/).map((c) => c.trim());
}

function parseMarker(cell) {
  const m = /^(:?)-+(:?)$/.exec(cell);
  if (!m) throw new SyntaxError(`separador inválido: ${JSON.stringify(cell)}`);
  if (m[1] && m[2]) return 'center';
  if (m[1]) return 'left';
  if (m[2]) return 'right';
  return 'none';
}

/**
 * Reads a Markdown table. Blank lines are ignored; the 1st line is the header
 * and the 2nd the separator. Edge pipes are optional; '|' preceded by '\' belongs
 * to the cell. Body rows are padded with '' or truncated to the number of columns.
 * @returns {{ header: string[], align: string[], rows: string[][] }}
 */
export function parseTable(markdown) {
  if (typeof markdown !== 'string') throw new TypeError('parseTable espera string');
  const lines = markdown.split(/\r\n|\r|\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) throw new SyntaxError('tabela precisa de cabeçalho e separador');
  const header = splitRow(lines[0]).map(unescapeCell);
  const markers = splitRow(lines[1]);
  if (markers.length !== header.length) throw new SyntaxError('separador com nº de colunas diferente do cabeçalho');
  const align = markers.map(parseMarker);
  const rows = lines.slice(2).map((l) => {
    const cs = splitRow(l).map(unescapeCell);
    return header.map((_, j) => (j < cs.length ? cs[j] : ''));
  });
  return { header, align, rows };
}
