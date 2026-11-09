/**
 * Unidades de medida com quantidades inteiras na unidade-base.
 *
 * Uma tabela é criada por `defineUnits(base, factors)`, em que cada fator é o
 * número (inteiro positivo) de unidades-base contidas em uma unidade.
 */

/** Arredonda para o inteiro mais próximo; empates exatos vão para o par. */
export function roundHalfEven(x) {
  const f = Math.floor(x);
  const diff = x - f;
  if (diff > 0.5) return f + 1;
  if (diff < 0.5) return f;
  return f % 2 === 0 ? f : f + 1;
}

/**
 * @param {string} base nome da unidade-base (fator 1, incluída automaticamente)
 * @param {Record<string, number>} factors
 */
export function defineUnits(base, factors = {}) {
  if (typeof base !== 'string' || base === '') throw new TypeError('unidade-base inválida');
  const map = new Map([[base, 1]]);
  for (const [unit, factor] of Object.entries(factors)) {
    if (!Number.isInteger(factor) || factor < 1) throw new RangeError(`fator inválido para ${unit}`);
    if (unit === base && factor !== 1) throw new RangeError('a unidade-base deve ter fator 1');
    map.set(unit, factor);
  }
  return Object.freeze({ base, factors: map });
}

/** Fator da unidade; unidade desconhecida → RangeError. */
export function factorOf(unit, table) {
  const f = table.factors.get(unit);
  if (f === undefined) throw new RangeError(`unidade desconhecida: ${unit}`);
  return f;
}

/** Quantidade em `unit` → inteiro na unidade-base (meio-par). */
export function toBase(qty, unit, table) {
  if (typeof qty !== 'number' || !Number.isFinite(qty)) throw new TypeError('quantidade inválida');
  return roundHalfEven(qty * factorOf(unit, table));
}

/** Converte entre unidades; resultado inteiro em `to` (meio-par). */
export function convert(qty, from, to, table) {
  return roundHalfEven(toBase(qty, from, table) / factorOf(to, table));
}

/**
 * Decompõe uma quantidade-base (inteiro >= 0) usando primeiro as unidades de
 * maior fator (empate: nome em ordem crescente). Omite componentes zero;
 * `0` → `[[base, 0]]`.
 * @returns {[string, number][]}
 */
export function split(baseQty, table) {
  if (!Number.isInteger(baseQty) || baseQty < 0) throw new RangeError('quantidade-base inválida');
  if (baseQty === 0) return [[table.base, 0]];
  const units = [...table.factors].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const parts = [];
  let rest = baseQty;
  for (const [unit, factor] of units) {
    const n = Math.floor(rest / factor);
    if (n > 0) {
      parts.push([unit, n]);
      rest -= n * factor;
    }
  }
  return parts;
}

/** `split` formatado: `'2 cx 1 kg 500 g'`. */
export function format(baseQty, table) {
  return split(baseQty, table).map(([unit, n]) => `${n} ${unit}`).join(' ');
}
