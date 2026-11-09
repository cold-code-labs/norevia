/**
 * Cálculo de impostos sobre linhas de fatura em centavos.
 *
 * Um imposto é { code, rateBp, compound = false } (rateBp em pontos-base).
 * Impostos simples incidem sobre o valor líquido; impostos compostos incidem
 * sobre o líquido somado aos impostos SIMPLES do mesmo grupo.
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
 *   - rounding 'line':    cada linha é um grupo; impostos arredondados por linha e somados;
 *   - rounding 'invoice': um único grupo com a soma dos líquidos.
 * Arredondamento half-even. → { net, byCode: { [code]: cents } (na ordem de `taxes`),
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
 * extractInclusive(gross, taxes): decompõe um preço com impostos SIMPLES
 * embutidos (imposto composto → RangeError).
 *   1. base = divRound(gross × 10000, 10000 + Σ rateBp);
 *   2. cada imposto = divRound(base × rateBp, 10000);
 *   3. net = gross − Σ impostos (assim net + impostos === gross).
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

/** effectiveRateBp(result): taxa efetiva em bp de um resultado de computeTaxes (half-even). */
export function effectiveRateBp({ net, taxTotal }) {
  if (net === 0) return 0;
  return divRound(taxTotal * 10000, net);
}
