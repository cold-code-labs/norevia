/**
 * Cupons de desconto.
 *
 * Texto do cupom: `CODIGO:VALOR`. Se VALOR termina com `%`, o cupom é
 * percentual (`DESC10:10%`, `MEIO:12,5%`); caso contrário é um abatimento fixo
 * em dinheiro no formato brasileiro (`MENOS15:15,00`).
 */
import { parsePrice } from './catalog.mjs';
import { toCents } from './money.mjs';

const CODE_RE = /^[A-Z0-9]+$/;
const PERCENT_RE = /^\d+(?:,\d+)?$/;

/**
 * @typedef {{code:string, kind:'percent', value:number} | {code:string, kind:'fixed', value:number}} Coupon
 * Em cupons `percent`, `value` é o percentual (10 significa 10%).
 * Em cupons `fixed`, `value` é o abatimento em centavos.
 */

/**
 * @param {string} raw
 * @returns {Coupon}
 */
export function parseCoupon(raw) {
  const s = String(raw).trim();
  const idx = s.indexOf(':');
  if (idx <= 0) throw new SyntaxError(`cupom inválido: "${raw}"`);
  const code = s.slice(0, idx).toUpperCase();
  const body = s.slice(idx + 1).trim();
  if (!CODE_RE.test(code)) throw new SyntaxError(`código de cupom inválido: "${code}"`);
  if (body.endsWith('%')) {
    const num = body.slice(0, -1).trim();
    if (!PERCENT_RE.test(num)) throw new SyntaxError(`percentual inválido: "${body}"`);
    const value = parsePrice(num);
    if (value <= 0 || value > 100) throw new RangeError(`percentual fora de (0, 100]: ${value}`);
    return { code, kind: 'percent', value };
  }
  return { code, kind: 'fixed', value: parsePrice(body) };
}

/**
 * Valor do desconto, em centavos, que o cupom concede sobre `subtotalCents`.
 * Percentual: arredondado ao centavo mais próximo (meio centavo para cima).
 * Fixo: nunca maior que o subtotal.
 * @param {number} subtotalCents
 * @param {Coupon|null} coupon
 * @returns {number}
 */
export function discountFor(subtotalCents, coupon) {
  if (!coupon || subtotalCents <= 0) return 0;
  if (coupon.kind === 'percent') return Math.round((subtotalCents * coupon.value) / 100);
  if (coupon.kind === 'fixed') return Math.min(toCents(coupon.value), subtotalCents);
  throw new TypeError(`tipo de cupom desconhecido: ${coupon.kind}`);
}
