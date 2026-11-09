/**
 * Aritmética monetária em centavos inteiros, com modos de arredondamento
 * explícitos. Nenhuma função usa ponto flutuante para representar dinheiro.
 */

export const ROUNDING_MODES = Object.freeze(['half-even', 'half-up', 'floor', 'ceil', 'trunc']);

function assertSafeInt(value, name) {
  if (!Number.isSafeInteger(value)) throw new RangeError(`${name} must be a safe integer`);
}

/**
 * divRound(n, d, mode = 'half-even'): quociente inteiro de n / d arredondado
 * segundo `mode`:
 *   - 'half-even': para o inteiro mais próximo; empates para o par;
 *   - 'half-up':   para o inteiro mais próximo; empates para longe do zero;
 *   - 'floor':     em direção a -∞;
 *   - 'ceil':      em direção a +∞;
 *   - 'trunc':     em direção ao zero.
 * `d` pode ser negativo; `d === 0` ou modo desconhecido → RangeError. Nunca -0.
 */
export function divRound(n, d, mode = 'half-even') {
  assertSafeInt(n, 'n');
  assertSafeInt(d, 'd');
  if (d === 0) throw new RangeError('division by zero');
  if (!ROUNDING_MODES.includes(mode)) throw new RangeError(`unknown rounding mode: ${mode}`);
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const q = Math.floor(n / d);
  const r = n - q * d;
  let out;
  switch (mode) {
    case 'floor':
      out = q;
      break;
    case 'ceil':
      out = r === 0 ? q : q + 1;
      break;
    case 'trunc':
      out = r !== 0 && n < 0 ? q + 1 : q;
      break;
    case 'half-up':
      out = 2 * r > d || (2 * r === d && n > 0) ? q + 1 : q;
      break;
    default:
      out = 2 * r > d || (2 * r === d && q % 2 !== 0) ? q + 1 : q;
  }
  return out === 0 ? 0 : out;
}

/**
 * applyRate(cents, rateBp, mode): cents × rateBp / 10000 (rateBp em pontos-base,
 * 1 bp = 0,01%), arredondado com divRound. Produto fora do intervalo seguro → RangeError.
 */
export function applyRate(cents, rateBp, mode = 'half-even') {
  assertSafeInt(cents, 'cents');
  assertSafeInt(rateBp, 'rateBp');
  const product = cents * rateBp;
  if (!Number.isSafeInteger(product)) throw new RangeError('overflow');
  return divRound(product, 10000, mode);
}

/** Soma de centavos; qualquer item não inteiro → RangeError. */
export function sumCents(values) {
  let total = 0;
  for (const v of values) {
    assertSafeInt(v, 'value');
    total += v;
  }
  return total;
}

/**
 * fromDecimal(text, mode): "12.5" → 1250, "-0.05" → -5. Aceita sinal opcional,
 * parte inteira com ao menos um dígito e parte decimal opcional (ponto) de
 * qualquer tamanho; casas além da segunda são arredondadas com `mode`.
 * Formato inválido → SyntaxError.
 */
export function fromDecimal(text, mode = 'half-even') {
  const m = /^\s*([+-])?(\d+)(?:\.(\d+))?\s*$/.exec(String(text));
  if (!m) throw new SyntaxError(`invalid decimal: ${text}`);
  const frac = m[3] ?? '';
  const digits = m[2] + frac.padEnd(2, '0');
  const scale = Math.max(0, frac.length - 2);
  const n = Number(digits) * (m[1] === '-' ? -1 : 1);
  return divRound(n, 10 ** scale, mode);
}

/** toDecimal(cents): 1250 → "12.50", -5 → "-0.05", 0 → "0.00". */
export function toDecimal(cents) {
  assertSafeInt(cents, 'cents');
  const abs = Math.abs(cents);
  const s = `${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
  return cents < 0 ? `-${s}` : s;
}
