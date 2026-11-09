import { segment, isExtender, isRegionalIndicator } from './grapheme.mjs';

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
  [0x20000, 0x2fffd],
  [0x30000, 0x3fffd],
];

export function isWide(cp) {
  let lo = 0;
  let hi = WIDE.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [a, b] = WIDE[mid];
    if (cp < a) hi = mid - 1;
    else if (cp >= b) lo = mid + 1;
    else return true;
  }
  return false;
}

export function codePointWidth(cp) {
  if (!Number.isInteger(cp) || cp < 0 || cp > 0x10ffff) throw new RangeError(`ponto de código inválido: ${cp}`);
  if (cp < 0x20 || (cp >= 0x7f && cp < 0xa0)) return 0;
  if (cp === 0x200b || isExtender(cp)) return 0;
  return isWide(cp) ? 2 : 1;
}

export function clusterWidth(cluster) {
  const cps = Array.from(cluster, (ch) => ch.codePointAt(0));
  if (cps.length === 0) return 0;
  if (cps.includes(0xfe0f)) return 2;
  if (isRegionalIndicator(cps[0])) return cps.length > 1 && isRegionalIndicator(cps[1]) ? 2 : 1;
  return codePointWidth(cps[0]);
}

export function stringWidth(text) {
  let w = 0;
  for (const c of segment(text)) w += clusterWidth(c);
  return w;
}

export function sliceColumns(text, from, to = Infinity) {
  if (!Number.isInteger(from) || from < 0 || !(to === Infinity || (Number.isInteger(to) && to >= from))) throw new RangeError('intervalo de colunas inválido');
  let col = 0;
  let out = '';
  for (const c of segment(text)) {
    const w = clusterWidth(c);
    if (col >= from && col + w <= to) out += c;
    col += w;
  }
  return out;
}
