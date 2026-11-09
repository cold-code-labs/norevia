/**
 * Utilitários monetários. Toda a aritmética do pedido é feita em CENTAVOS
 * inteiros; reais (números com casas decimais) só aparecem em fronteiras.
 */

/** Converte reais (ex.: 19.9) em centavos inteiros (1990), arredondando ao mais próximo. */
export function toCents(reais) {
  if (typeof reais !== 'number' || !Number.isFinite(reais)) throw new TypeError(`valor inválido: ${reais}`);
  return Math.round(reais * 100);
}

/** Converte centavos inteiros em reais. */
export function toReais(cents) {
  return cents / 100;
}

/**
 * Formata centavos como moeda brasileira: 123456 → "R$ 1.234,56",
 * 5 → "R$ 0,05", -100 → "-R$ 1,00".
 */
export function formatBRL(cents) {
  if (!Number.isInteger(cents)) throw new RangeError(`centavos devem ser inteiros: ${cents}`);
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const reais = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const frac = String(abs % 100).padStart(2, '0');
  return `${sign}R$ ${reais},${frac}`;
}
