/** Segmentação simplificada em clusters (aglomerados) de grafemas. */

const ZWJ = 0x200d;
const CR = 0x0d;
const LF = 0x0a;

const EXTEND = [
  [0x0300, 0x036f],
  [0x1ab0, 0x1aff],
  [0x1dc0, 0x1dff],
  [0x200d, 0x200d],
  [0x20d0, 0x20ff],
  [0xfe00, 0xfe0f],
  [0xfe20, 0xfe2f],
  [0x1f3fb, 0x1f3ff],
];

export function isExtender(cp) {
  for (const [a, b] of EXTEND) if (cp >= a && cp <= b) return true;
  return false;
}

export function isRegionalIndicator(cp) {
  return cp >= 0x1f1e6 && cp <= 0x1f1ff;
}

export function codePoints(text) {
  if (typeof text !== 'string') throw new TypeError('texto deve ser string');
  return Array.from(text, (ch) => ch.codePointAt(0));
}

export function segment(text) {
  if (typeof text !== 'string') throw new TypeError('texto deve ser string');
  const out = [];
  let prev = -1;
  let ri = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    let join;
    if (out.length === 0) join = false;
    else if (prev === CR && cp === LF) join = true;
    else if (prev === ZWJ) join = true;
    else if (isRegionalIndicator(cp)) join = ri % 2 === 1;
    else join = isExtender(cp);
    ri = isRegionalIndicator(cp) ? ri + 1 : 0;
    if (join) out[out.length - 1] += ch;
    else out.push(ch);
    prev = cp;
  }
  return out;
}

export function graphemeCount(text) {
  return segment(text).length;
}

export function sliceGraphemes(text, start = 0, end) {
  return segment(text).slice(start, end).join('');
}

export function reverseGraphemes(text) {
  return segment(text).reverse().join('');
}

export function chunkGraphemes(text, size) {
  if (!Number.isInteger(size) || size < 1) throw new RangeError(`tamanho inválido: ${size}`);
  const clusters = segment(text);
  const out = [];
  for (let i = 0; i < clusters.length; i += size) out.push(clusters.slice(i, i + size).join(''));
  return out;
}

export function graphemeOffsets(text) {
  const offsets = [];
  let pos = 0;
  for (const c of segment(text)) {
    offsets.push(pos);
    pos += c.length;
  }
  return offsets;
}
