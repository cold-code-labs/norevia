/**
 * Tax calculation on invoice lines in cents.
 *
 * A tax is { code, rateBp, compound = false } (rateBp in basis points).
 * Simple taxes apply to the net amount; compound taxes apply
 * to the net plus the SIMPLE taxes of the same group.
 */
import { divRound } from './money.mjs';

function validateTaxes(taxes) {
  const seen = new Set();
  for (const t of taxes) {
    if (typeof t.code !== 'string' || t.code === '') throw new RangeError('tax code required');
    if (seen.has(t.code)) throw new RangeError(`duplicate tax code: ${t.code}`);
    seen.add(t.code);
    if (!Number.isSafeInteger(t.rateBp) || t.rateBp < 0) throw new RangeError(`invalid rate for ${t.code}`);
  }
}

function validateNets(nets) {
  for (const n of nets) {
    if (!Number.isSafeInteger(n) || n < 0) throw new RangeError('net amounts must be non-negative integers');
  }
}

function taxGroup(net, taxes, acc) {
  let simpleSum = 0;
  for (const t of taxes) {
    if (t.compound) continue;
    const amount = divRound(net * t.rateBp, 10000);
    acc[t.code] += amount;
    simpleSum += amount;
  }
  for (const t of taxes) {
    if (!t.compound) continue;
    const amount = divRound((net + simpleSum) * t.rateBp, 10000);
    acc[t.code] += amount;
  }
}

/**
 * computeTaxes(nets, taxes, { rounding = 'line' }):
 *   - rounding 'line':    each line is a group; taxes rounded per line and summed;
 *   - rounding 'invoice': a single group with the sum of the nets.
 * Half-even rounding. → { net, byCode: { [code]: cents } (in the order of `taxes`),
 * taxTotal, gross }.
 */
export function computeTaxes(nets, taxes, { rounding = 'line' } = {}) {
  validateNets(nets);
  validateTaxes(taxes);
  if (rounding !== 'line' && rounding !== 'invoice') throw new RangeError(`unknown rounding: ${rounding}`);
  const byCode = {};
  for (const t of taxes) byCode[t.code] = 0;
  const net = nets.reduce((s, n) => s + n, 0);
  if (rounding === 'invoice') taxGroup(net, taxes, byCode);
  else for (const n of nets) taxGroup(n, taxes, byCode);
  const taxTotal = Object.values(byCode).reduce((s, v) => s + v, 0);
  return { net, byCode, taxTotal, gross: net + taxTotal };
}

/**
 * extractInclusive(gross, taxes): decomposes a price with SIMPLE taxes
 * included (compound tax → RangeError).
 *   1. base = divRound(gross × 10000, 10000 + Σ rateBp);
 *   2. each tax = divRound(base × rateBp, 10000);
 *   3. net = gross − Σ taxes (so net + taxes === gross).
 * → { net, byCode, gross }.
 */
export function extractInclusive(gross, taxes) {
  validateNets([gross]);
  validateTaxes(taxes);
  if (taxes.some((t) => t.compound)) throw new RangeError('compound taxes cannot be extracted');
  const totalBp = taxes.reduce((s, t) => s + t.rateBp, 0);
  const base = divRound(gross * 10000, 10000 + totalBp);
  const byCode = {};
  let sum = 0;
  for (const t of taxes) {
    byCode[t.code] = divRound(base * t.rateBp, 10000);
    sum += byCode[t.code];
  }
  return { net: gross - sum, byCode, gross };
}

/** effectiveRateBp(result): effective rate in bp of a computeTaxes result (half-even). */
export function effectiveRateBp({ net, taxTotal }) {
  if (net === 0) return 0;
  return divRound(taxTotal * 10000, net);
}
