/**
 * Carrinho de compras sobre um catálogo (ver catalog.mjs).
 */
import { priceOf } from './catalog.mjs';
import { parseCoupon, discountFor } from './discount.mjs';
import { formatBRL, toCents } from './money.mjs';

/** Frete fixo, em centavos, cobrado abaixo do limite de frete grátis. */
export const SHIPPING_CENTS = 1990;
/** Valor (após desconto), em centavos, a partir do qual o frete é grátis. */
export const FREE_SHIPPING_FROM_CENTS = 19900;

/**
 * @param {Map<string, {sku:string, name:string, priceCents:number}>} catalog
 */
export function createCart(catalog) {
  const quantities = new Map();
  let coupon = null;

  function add(sku, qty = 1) {
    if (!Number.isInteger(qty) || qty < 1) throw new RangeError(`quantidade inválida: ${qty}`);
    priceOf(catalog, sku);
    quantities.set(sku, (quantities.get(sku) ?? 0) + qty);
  }

  function remove(sku, qty = Infinity) {
    const current = quantities.get(sku);
    if (current === undefined) return;
    const left = current - qty;
    if (left > 0) quantities.set(sku, left);
    else quantities.delete(sku);
  }

  function applyCoupon(c) {
    coupon = typeof c === 'string' ? parseCoupon(c) : c;
  }

  function summary() {
    const lines = [];
    let subtotalCents = 0;
    for (const [sku, qty] of quantities) {
      const unitCents = toCents(priceOf(catalog, sku));
      const totalCents = unitCents * qty;
      lines.push({ sku, name: catalog.get(sku).name, qty, unitCents, totalCents });
      subtotalCents += totalCents;
    }
    const discountCents = discountFor(subtotalCents, coupon);
    const afterDiscount = subtotalCents - discountCents;
    let shippingCents = 0;
    if (lines.length > 0 && afterDiscount < FREE_SHIPPING_FROM_CENTS) shippingCents = SHIPPING_CENTS;
    return {
      lines,
      subtotalCents,
      discountCents,
      shippingCents,
      totalCents: afterDiscount + shippingCents,
    };
  }

  function receipt() {
    const s = summary();
    const out = s.lines.map((l) => `${l.qty}x ${l.name} — ${formatBRL(l.totalCents)}`);
    out.push(`Subtotal: ${formatBRL(s.subtotalCents)}`);
    if (s.discountCents > 0) out.push(`Desconto (${coupon.code}): -${formatBRL(s.discountCents)}`);
    out.push(`Frete: ${s.shippingCents === 0 ? 'grátis' : formatBRL(s.shippingCents)}`);
    out.push(`Total: ${formatBRL(s.totalCents)}`);
    return out.join('\n');
  }

  return { add, remove, applyCoupon, summary, receipt };
}
