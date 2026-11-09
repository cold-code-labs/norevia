/**
 * Notação compacta: 1.2K, 34M, 5.6B, 7T.
 */
import { parseDecimal, shift, abs, compareDecimal, normalize } from './decimal.mjs';
import { roundDecimal } from './round.mjs';

const UNITS = ['', 'K', 'M', 'B', 'T'];

function unitIndex(absText) {
  const p = parseDecimal(absText);
  const intDigits = p.digits.length - p.scale;
  if (intDigits <= 3) return 0;
  return Math.min(Math.floor((intDigits - 1) / 3), UNITS.length - 1);
}

function scaledRound(text, k, mode) {
  return roundDecimal(shift(text, -3 * k), 1, mode);
}

/**
 * Formata `text` em notação compacta com no máximo 1 casa decimal.
 */
export function compact(text, mode = 'halfEven') {
  const a = abs(text);
  let k = unitIndex(a);
  let r = scaledRound(text, k, mode);
  if (k < UNITS.length - 1 && compareDecimal(abs(r), '1000') >= 0) {
    k += 1;
    r = scaledRound(text, k, mode);
  }
  return normalize(r) + UNITS[k];
}

/** Inverso aproximado: `'1.5K'` → `'1500'`. */
export function parseCompact(text) {
  if (typeof text !== 'string') throw new TypeError('parseCompact espera string');
  const m = /^(-?\d+(?:\.\d+)?)([KMBT]?)$/.exec(text);
  if (!m) throw new RangeError(`formato compacto inválido: ${text}`);
  return shift(m[1], 3 * UNITS.indexOf(m[2]));
}
