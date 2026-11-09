/**
 * Números decimais representados como strings: `[-]inteiro[.fração]`.
 * Representação interna: `{ neg, digits, scale }` com valor = (neg ? -1 : 1) * digits / 10^scale,
 * `digits` sem zeros à esquerda (ou '0').
 */

const RE = /^([+-]?)(\d+)(?:\.(\d+))?$/;

export function parseDecimal(text) {
  if (typeof text !== 'string') throw new TypeError('decimal deve ser string');
  const m = RE.exec(text);
  if (!m) throw new RangeError(`decimal inválido: ${text}`);
  const frac = m[3] ?? '';
  const digits = (m[2] + frac).replace(/^0+/, '') || '0';
  return { neg: m[1] === '-' && digits !== '0', digits, scale: frac.length };
}

export function formatParts({ neg, digits, scale }) {
  let s = digits.padStart(scale + 1, '0');
  if (scale > 0) s = s.slice(0, s.length - scale) + '.' + s.slice(s.length - scale);
  return (neg && /[1-9]/.test(s) ? '-' : '') + s;
}

/** Forma canônica: sem '+', sem zeros supérfluos, '-0' vira '0'. */
export function normalize(text) {
  const p = parseDecimal(text);
  let { digits, scale } = p;
  while (scale > 0 && digits.endsWith('0')) {
    digits = digits.slice(0, -1) || '0';
    scale--;
  }
  return formatParts({ neg: p.neg, digits, scale });
}

export function isZero(text) {
  return parseDecimal(text).digits === '0';
}

export function negate(text) {
  const n = normalize(text);
  return n === '0' ? n : n.startsWith('-') ? n.slice(1) : '-' + n;
}

export function abs(text) {
  const n = normalize(text);
  return n.startsWith('-') ? n.slice(1) : n;
}

/** Multiplica por 10^k exatamente (k inteiro). */
export function shift(text, k) {
  if (!Number.isInteger(k)) throw new RangeError(`k inválido: ${k}`);
  const p = parseDecimal(text);
  let { digits, scale } = p;
  if (k >= 0) {
    const take = Math.min(k, scale);
    scale -= take;
    if (digits !== '0') digits += '0'.repeat(k - take);
  } else {
    scale -= k;
  }
  return normalize(formatParts({ neg: p.neg, digits, scale }));
}

export function compareDecimal(a, b) {
  const x = parseDecimal(a);
  const y = parseDecimal(b);
  if (x.neg !== y.neg) return x.neg ? -1 : 1;
  const s = Math.max(x.scale, y.scale);
  const dx = (x.digits + '0'.repeat(s - x.scale)).replace(/^0+/, '');
  const dy = (y.digits + '0'.repeat(s - y.scale)).replace(/^0+/, '');
  const c = dx.length !== dy.length ? (dx.length < dy.length ? -1 : 1) : dx < dy ? -1 : dx > dy ? 1 : 0;
  return x.neg ? -c : c;
}
