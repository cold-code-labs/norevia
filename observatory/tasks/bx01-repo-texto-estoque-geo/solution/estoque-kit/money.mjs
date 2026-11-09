/**
 * Valores monetários em reais, representados como centavos inteiros.
 */

/**
 * formatBRL(cents): "R$ 1.234,56". Milhares separados por ponto, sempre duas casas
 * decimais após a vírgula; negativos recebem '-' antes de "R$".
 * @param {number} cents inteiro
 */
export function formatBRL(cents) {
  if (!Number.isInteger(cents)) throw new TypeError('cents must be an integer');
  const neg = cents < 0;
  const abs = Math.abs(cents);
  const reais = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const frac = String(abs % 100).padStart(2, '0');
  return `${neg ? '-' : ''}R$ ${reais},${frac}`;
}

/**
 * parseBRL(text): inverso tolerante de formatBRL. Aceita prefixo "R$" opcional,
 * sinal '-' opcional no início, milhares com ponto (opcionais) e 0 a 2 casas
 * decimais após a vírgula ("12,5" = 1250 centavos). Formato inválido → SyntaxError.
 */
export function parseBRL(text) {
  const m = /^\s*(-)?\s*(?:R\$\s*)?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?\s*$/.exec(text);
  if (!m) throw new SyntaxError(`invalid amount: ${text}`);
  const int = Number(m[2].replaceAll('.', ''));
  const frac = m[3] ? Number(m[3].padEnd(2, '0')) : 0;
  const value = int * 100 + frac;
  return m[1] && value !== 0 ? -value : value;
}

/**
 * splitEvenly(cents, n): divide um valor não negativo em n parcelas inteiras cuja
 * soma é exatamente `cents`. As parcelas diferem em no máximo 1 centavo e os
 * centavos que sobram da divisão vão para as PRIMEIRAS parcelas.
 * @returns {number[]}
 */
export function splitEvenly(cents, n) {
  if (!Number.isInteger(cents) || cents < 0) throw new RangeError('cents must be a non-negative integer');
  if (!Number.isInteger(n) || n < 1) throw new RangeError('n must be a positive integer');
  const base = Math.floor(cents / n);
  const rem = cents - base * n;
  const parts = [];
  for (let i = 0; i < n; i++) parts.push(base + (i < rem ? 1 : 0));
  return parts;
}
