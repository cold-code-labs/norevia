/**
 * Formatação de decimais com agrupamento de milhares (padrão ou indiano).
 */
import { roundDecimal } from './round.mjs';

const GROUPINGS = ['standard', 'indian', 'none'];

function groupStandard(int, sep) {
  let out = '';
  for (let i = int.length; i > 0; i -= 3) out = int.slice(Math.max(0, i - 3), i) + (out ? sep + out : '');
  return out;
}

function groupIndian(int, sep) {
  if (int.length <= 3) return int;
  let out = int.slice(-3);
  let rest = int.slice(0, -3);
  while (rest.length > 2) {
    out = rest.slice(-2) + sep + out;
    rest = rest.slice(0, -2);
  }
  return rest + sep + out;
}

export function groupDigits(int, grouping = 'standard', sep = ',') {
  if (!/^\d+$/.test(int)) throw new RangeError(`parte inteira inválida: ${int}`);
  if (grouping === 'none') return int;
  return grouping === 'indian' ? groupIndian(int, sep) : groupStandard(int, sep);
}

/**
 * Formata a string decimal `text`: arredonda para `places` casas com `mode` e agrupa a parte inteira.
 */
export function formatDecimal(text, options = {}) {
  const { places = 2, mode = 'halfEven', grouping = 'standard', groupSep = ',', decimalSep = '.' } = options;
  if (!GROUPINGS.includes(grouping)) throw new RangeError(`agrupamento inválido: ${grouping}`);
  if (groupSep === decimalSep) throw new RangeError('separadores devem ser diferentes');
  const r = roundDecimal(text, places, mode);
  const neg = r.startsWith('-');
  const [int, frac] = (neg ? r.slice(1) : r).split('.');
  const body = groupDigits(int, grouping, groupSep) + (frac === undefined ? '' : decimalSep + frac);
  return (neg ? '-' : '') + body;
}

/** `ratio` (string decimal; 1 = 100%) formatado como porcentagem: `'12.5%'`. */
export function formatPercent(ratio, places = 1, mode = 'halfEven') {
  const p = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(typeof ratio === 'string' ? ratio : '');
  if (!p) throw new RangeError(`razão inválida: ${ratio}`);
  const frac = (p[3] ?? '').padEnd(2, '0');
  const shifted = `${p[1]}${p[2]}${frac.slice(0, 2)}${frac.length > 2 ? '.' + frac.slice(2) : ''}`;
  return formatDecimal(shifted, { places, mode, grouping: 'none' }) + '%';
}
