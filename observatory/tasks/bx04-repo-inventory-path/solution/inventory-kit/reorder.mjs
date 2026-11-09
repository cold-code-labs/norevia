/**
 * Ponto de pedido e sugestão de compra arredondada para embalagens.
 */

/** Menor múltiplo de `m` que seja >= `n`; `n <= 0` → 0. */
export function ceilToMultiple(n, m) {
  if (n <= 0) return 0;
  return Math.ceil(n / m) * m;
}

/** Maior múltiplo de `m` que seja <= `n`; `n <= 0` → 0. */
export function floorToMultiple(n, m) {
  if (n <= 0) return 0;
  return Math.floor(n / m) * m;
}

/** `ceil(dailyDemand * leadTimeDays) + safetyStock`. */
export function reorderPoint({ dailyDemand, leadTimeDays, safetyStock = 0 }) {
  if (!(dailyDemand >= 0) || !(leadTimeDays >= 0) || !(safetyStock >= 0)) {
    throw new RangeError('parâmetros de demanda inválidos');
  }
  return Math.ceil(dailyDemand * leadTimeDays) + safetyStock;
}

/**
 * Dias inteiros que o estoque cobre: `floor(onHand / dailyDemand)`;
 * demanda zero → Infinity.
 */
export function coverDays(onHand, dailyDemand) {
  if (dailyDemand === 0) return Infinity;
  return Math.floor(onHand / dailyDemand);
}

/**
 * Sugere a quantidade a pedir.
 * @returns {{ order: number, position: number, reorderPoint: number, reason: string }}
 */
export function suggestOrder({
  onHand, onOrder = 0, backorders = 0,
  dailyDemand, leadTimeDays, safetyStock = 0,
  targetLevel, packSize = 1, minOrder = 0, maxStock = Infinity,
}) {
  if (!Number.isInteger(packSize) || packSize < 1) throw new RangeError('packSize inválido');
  const rop = reorderPoint({ dailyDemand, leadTimeDays, safetyStock });
  const position = onHand + onOrder - backorders;
  if (position > rop) return { order: 0, position, reorderPoint: rop, reason: 'acima-do-ponto' };
  const need = Math.max(targetLevel - position, minOrder);
  let order = ceilToMultiple(need, packSize);
  let reason = 'repor';
  if (order > maxStock - position) {
    order = floorToMultiple(maxStock - position, packSize);
    reason = 'limitado-pelo-maximo';
  }
  return { order, position, reorderPoint: rop, reason };
}
