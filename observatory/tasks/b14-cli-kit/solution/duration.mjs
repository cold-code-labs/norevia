/**
 * Durações legíveis: "1h30m", "90s", "250ms" <-> milissegundos.
 */

const UNITS = [
  ['d', 86_400_000],
  ['h', 3_600_000],
  ['m', 60_000],
  ['s', 1_000],
  ['ms', 1],
];
const SIZE = new Map(UNITS);
const RANK = new Map(UNITS.map(([unit], i) => [unit, i]));
const SEGMENT = /(\d+(?:\.\d+)?)(ms|d|h|m|s)/y;

/**
 * Converte texto em milissegundos. Aceita um inteiro puro (ms) ou uma sequência
 * de segmentos `<número><unidade>` em ordem estritamente decrescente de unidade.
 * O total é arredondado para o milissegundo mais próximo.
 */
export function parseDuration(text) {
  if (typeof text !== 'string') throw new TypeError('duração deve ser string');
  const s = text.trim();
  if (s === '') throw new SyntaxError('duração vazia');
  if (/^\d+$/.test(s)) return Number(s);
  let total = 0;
  let pos = 0;
  let lastRank = -1;
  while (pos < s.length) {
    SEGMENT.lastIndex = pos;
    const m = SEGMENT.exec(s);
    if (!m) throw new SyntaxError(`trecho inválido: "${s.slice(pos)}"`);
    const rank = RANK.get(m[2]);
    if (rank <= lastRank) throw new SyntaxError(`unidade fora de ordem: ${m[2]}`);
    lastRank = rank;
    total += Number(m[1]) * SIZE.get(m[2]);
    pos = SEGMENT.lastIndex;
  }
  return Math.round(total);
}

/**
 * Formata milissegundos usando no máximo `largest` unidades consecutivas a
 * partir da maior unidade presente; o resto é arredondado (metade para cima)
 * na menor unidade da janela, com transporte para as unidades maiores.
 */
export function formatDuration(ms, { largest = 2 } = {}) {
  if (!Number.isInteger(ms) || ms < 0) throw new RangeError('ms deve ser inteiro >= 0');
  if (!Number.isInteger(largest) || largest < 1 || largest > UNITS.length) {
    throw new RangeError(`largest deve estar entre 1 e ${UNITS.length}`);
  }
  if (ms === 0) return '0ms';
  const top = UNITS.findIndex(([, size]) => size <= ms);
  const last = Math.min(top + largest - 1, UNITS.length - 1);
  const step = UNITS[last][1];
  let rest = Math.round(ms / step) * step;
  const parts = [];
  for (const [unit, size] of UNITS) {
    const n = Math.floor(rest / size);
    if (n > 0) parts.push(`${n}${unit}`);
    rest -= n * size;
  }
  return parts.join('');
}
