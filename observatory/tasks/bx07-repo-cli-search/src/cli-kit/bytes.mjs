/**
 * Tamanhos em bytes legíveis, nos padrões SI (base 1000) e IEC (base 1024).
 */

const STANDARDS = {
  si: { base: 1000, units: ['B', 'kB', 'MB', 'GB', 'TB', 'PB'] },
  iec: { base: 1024, units: ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'] },
};

const MULTIPLIERS = new Map([
  ['', 1], ['b', 1],
  ['kb', 1e3], ['mb', 1e6], ['gb', 1e9], ['tb', 1e12], ['pb', 1e15],
  ['kib', 1024], ['mib', 1024 ** 2], ['gib', 1024 ** 3], ['tib', 1024 ** 4], ['pib', 1024 ** 5],
]);

function roundTo(value, decimals) {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/**
 * formatBytes(n, { standard = 'si', decimals = 2 }) -> "1.5 KiB", "10 MB", "512 B".
 */
export function formatBytes(n, { standard = 'si', decimals = 2 } = {}) {
  if (!Number.isSafeInteger(n) || n < 0) throw new RangeError('n deve ser inteiro seguro >= 0');
  if (!Object.hasOwn(STANDARDS, standard)) throw new RangeError(`padrão desconhecido: ${standard}`);
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 6) throw new RangeError('decimals deve estar entre 0 e 6');
  const { base, units } = STANDARDS[standard];
  if (n < base) return `${n} B`;
  let k = 0;
  while (k < units.length - 1 && n >= base ** (k + 1)) k++;
  let value = roundTo(n / base ** k, decimals);
  if (value >= base && k < units.length - 1) {
    k++;
    value = roundTo(n / base ** k, decimals);
  }
  const text = value.toFixed(decimals).replace(/\.?0+$/, '');
  return `${text} ${units[k]}`;
}

/**
 * parseBytes("1.5 KiB") -> 1536. Unidade sem distinção de maiúsculas; sem
 * unidade = bytes. O resultado é arredondado para o inteiro mais próximo.
 */
export function parseBytes(text) {
  if (typeof text !== 'string') throw new TypeError('tamanho deve ser string');
  const m = /^(\d+(?:\.\d+)?)\s*([A-Za-z]*)$/.exec(text.trim());
  if (!m) throw new SyntaxError(`tamanho inválido: "${text}"`);
  const mult = MULTIPLIERS.get(m[2].toLowerCase());
  if (mult === undefined) throw new SyntaxError(`unidade desconhecida: "${m[2]}"`);
  return Math.round(Number(m[1]) * mult);
}
