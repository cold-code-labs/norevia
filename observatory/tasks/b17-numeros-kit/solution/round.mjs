/**
 * Arredondamento decimal exato sobre strings.
 */
import { parseDecimal, formatParts, normalize } from './decimal.mjs';

export const MODES = Object.freeze(['halfEven', 'halfUp', 'halfDown', 'up', 'down', 'ceiling', 'floor']);

function increment(s) {
  let i = s.length - 1;
  while (i >= 0 && s[i] === '9') i--;
  if (i < 0) return '1' + '0'.repeat(s.length);
  return s.slice(0, i) + String.fromCharCode(s.charCodeAt(i) + 1) + '0'.repeat(s.length - 1 - i);
}

function roundUpNeeded(mode, neg, lastKept, drop) {
  const nonZero = /[1-9]/.test(drop);
  if (!nonZero) return false;
  const half = drop[0] > '5' || (drop[0] === '5' && /[1-9]/.test(drop.slice(1)));
  const tie = drop[0] === '5' && !/[1-9]/.test(drop.slice(1));
  switch (mode) {
    case 'up': return true;
    case 'down': return false;
    case 'ceiling': return !neg;
    case 'floor': return neg;
    case 'halfUp': return half || tie;
    case 'halfDown': return half;
    default: return half || (tie && (lastKept.charCodeAt(0) - 48) % 2 === 1);
  }
}

/**
 * Arredonda `text` para exatamente `places` casas decimais (0–20) segundo `mode`.
 */
export function roundDecimal(text, places = 0, mode = 'halfEven') {
  if (!Number.isInteger(places) || places < 0 || places > 20) throw new RangeError(`places inválido: ${places}`);
  if (!MODES.includes(mode)) throw new RangeError(`modo inválido: ${mode}`);
  const p = parseDecimal(text);
  if (p.scale <= places) {
    const digits = p.digits === '0' ? '0' : p.digits + '0'.repeat(places - p.scale);
    return formatParts({ neg: p.neg, digits, scale: places });
  }
  const cut = p.scale - places;
  let ds = p.digits;
  if (ds.length <= cut) ds = '0'.repeat(cut - ds.length + 1) + ds;
  let keep = ds.slice(0, ds.length - cut);
  const drop = ds.slice(ds.length - cut);
  if (roundUpNeeded(mode, p.neg, keep[keep.length - 1], drop)) keep = increment(keep);
  return formatParts({ neg: p.neg, digits: keep.replace(/^0+(?=\d)/, ''), scale: places });
}

/** Arredonda para `sig` (1–30) algarismos significativos; devolve a forma canônica. */
export function roundSignificant(text, sig, mode = 'halfEven') {
  if (!Number.isInteger(sig) || sig < 1 || sig > 30) throw new RangeError(`sig inválido: ${sig}`);
  const p = parseDecimal(text);
  if (p.digits === '0') return '0';
  const magnitude = p.digits.length - p.scale; // nº de algarismos antes da vírgula (pode ser <= 0)
  const places = sig - magnitude;
  if (places > 20) throw new RangeError('precisão excessiva');
  if (places >= 0) return normalize(roundDecimal(text, places, mode));
  const factor = -places;
  const scaled = formatParts({ neg: p.neg, digits: p.digits, scale: p.scale + factor });
  const r = roundDecimal(scaled, 0, mode);
  return r === '0' ? '0' : normalize(r + '0'.repeat(factor));
}
