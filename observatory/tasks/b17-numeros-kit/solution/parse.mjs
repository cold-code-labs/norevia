/**
 * Leitura estrita de números formatados (inverso de formatDecimal).
 */

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function integerPattern(grouping, sep) {
  const g = esc(sep);
  if (grouping === 'none') return '\\d+';
  if (grouping === 'indian') return `(?:\\d{1,3}|\\d{1,2}(?:${g}\\d{2})*${g}\\d{3})`;
  return `\\d{1,3}(?:${g}\\d{3})*`;
}

/**
 * Converte `text` formatado em string decimal canônica.
 * Opções: `grouping` ('standard' | 'indian' | 'none'), `groupSep`, `decimalSep`, `allowUngrouped`.
 */
export function parseFormatted(text, options = {}) {
  const { grouping = 'standard', groupSep = ',', decimalSep = '.', allowUngrouped = true } = options;
  if (typeof text !== 'string') throw new TypeError('parseFormatted espera string');
  if (!['standard', 'indian', 'none'].includes(grouping)) throw new RangeError(`agrupamento inválido: ${grouping}`);
  if (typeof groupSep !== 'string' || typeof decimalSep !== 'string' || groupSep.length !== 1 || decimalSep.length !== 1 || groupSep === decimalSep || /\d/.test(groupSep + decimalSep)) {
    throw new RangeError('separadores inválidos');
  }
  const int = integerPattern(grouping, groupSep);
  const alt = allowUngrouped && grouping !== 'none' ? `(?:${int}|\\d+)` : int;
  const re = new RegExp(`^(-?)(${alt})(?:${esc(decimalSep)}(\\d+))?$`);
  const m = re.exec(text);
  if (!m) throw new RangeError(`número inválido: ${text}`);
  const intDigits = m[2].split(groupSep).join('').replace(/^0+(?=\d)/, '');
  let s = intDigits + (m[3] !== undefined ? '.' + m[3] : '');
  if (m[3] !== undefined) s = s.replace(/0+$/, '').replace(/\.$/, '');
  if (/^0(\.0*)?$/.test(s)) return '0';
  return (m[1] === '-' ? '-' : '') + s;
}

/** Verdadeiro sse `text` é aceito por `parseFormatted` com as mesmas opções. */
export function isFormatted(text, options) {
  try {
    parseFormatted(text, options);
    return true;
  } catch (e) {
    if (e instanceof RangeError) return false;
    throw e;
  }
}
