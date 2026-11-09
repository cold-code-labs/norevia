import { segment } from './grapheme.mjs';
import { clusterWidth, stringWidth } from './width.mjs';

function check(text, max, ellipsis) {
  if (typeof text !== 'string' || typeof ellipsis !== 'string') throw new TypeError('texto e reticências devem ser strings');
  if (!Number.isInteger(max) || max < 0) throw new RangeError(`largura inválida: ${max}`);
}

function takePrefix(clusters, budget) {
  let w = 0;
  let n = 0;
  while (n < clusters.length) {
    const cw = clusterWidth(clusters[n]);
    if (w + cw > budget) break;
    w += cw;
    n++;
  }
  return { text: clusters.slice(0, n).join(''), w, n };
}

function takeSuffix(clusters, budget) {
  let w = 0;
  let n = 0;
  while (n < clusters.length) {
    const cw = clusterWidth(clusters[clusters.length - 1 - n]);
    if (w + cw > budget) break;
    w += cw;
    n++;
  }
  return { text: clusters.slice(clusters.length - n).join(''), w, n };
}

export function truncateEnd(text, max, ellipsis = '…') {
  check(text, max, ellipsis);
  if (stringWidth(text) <= max) return text;
  const ew = stringWidth(ellipsis);
  const clusters = segment(text);
  if (ew > max) return takePrefix(clusters, max).text;
  return takePrefix(clusters, max - ew).text + ellipsis;
}

export function truncateStart(text, max, ellipsis = '…') {
  check(text, max, ellipsis);
  if (stringWidth(text) <= max) return text;
  const ew = stringWidth(ellipsis);
  const clusters = segment(text);
  if (ew > max) return takeSuffix(clusters, max).text;
  return ellipsis + takeSuffix(clusters, max - ew).text;
}

export function truncateMiddle(text, max, ellipsis = '…') {
  check(text, max, ellipsis);
  if (stringWidth(text) <= max) return text;
  const ew = stringWidth(ellipsis);
  const clusters = segment(text);
  if (ew > max) return takePrefix(clusters, max).text;
  const avail = max - ew;
  const left = takePrefix(clusters, Math.ceil(avail / 2));
  const right = takeSuffix(clusters.slice(left.n), Math.floor(avail / 2));
  return left.text + ellipsis + right.text;
}

const MODES = { end: truncateEnd, start: truncateStart, middle: truncateMiddle };

export function fit(text, width, { position = 'end', ellipsis = '…' } = {}) {
  if (!(position in MODES)) throw new RangeError(`posição inválida: ${position}`);
  const t = MODES[position](text, width, ellipsis);
  return t + ' '.repeat(width - stringWidth(t));
}
