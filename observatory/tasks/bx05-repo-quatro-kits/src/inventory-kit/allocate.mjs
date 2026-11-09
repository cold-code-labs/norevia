/**
 * Alocação de quantidades sobre lotes, na ordem em que os lotes são dados.
 *
 * Um lote é `{ id, qty, reserved? }`; o disponível é `max(0, qty - reserved)`.
 * Nenhuma função altera os arrays ou objetos recebidos.
 */

const MODES = new Set(['partial', 'all-or-nothing']);

/** Quantidade disponível de um lote. */
export function available(lot) {
  return Math.max(0, lot.qty - (lot.reserved ?? 0));
}

/** Soma do disponível de todos os lotes. */
export function totalAvailable(lots) {
  return lots.reduce((sum, lot) => sum + available(lot), 0);
}

/**
 * Aloca `qty` percorrendo `lots` em ordem.
 * @param {{ id: string, qty: number, reserved?: number }[]} lots
 * @param {number} qty inteiro >= 0
 * @param {{ mode?: 'partial'|'all-or-nothing' }} [options]
 * @returns {{ picks: { lotId: string, qty: number }[], allocated: number, shortfall: number, lots: object[] }}
 */
export function allocate(lots, qty, { mode = 'partial' } = {}) {
  if (!Number.isInteger(qty) || qty < 0) throw new RangeError('quantidade inválida');
  if (!MODES.has(mode)) throw new RangeError(`modo inválido: ${mode}`);
  const out = lots.slice();
  const picks = [];
  if (mode === 'all-or-nothing' && totalAvailable(lots) < qty) {
    return { picks, allocated: 0, shortfall: qty, lots: out };
  }
  let remaining = qty;
  for (let i = 0; i < out.length && remaining > 0; i++) {
    const lot = out[i];
    const take = Math.min(available(lot), remaining);
    if (take === 0) continue;
    lot.qty -= take;
    picks.push({ lotId: lot.id, qty: take });
    remaining -= take;
  }
  return { picks, allocated: qty - remaining, shortfall: remaining, lots: out };
}

/**
 * Atende vários pedidos `{ id, qty, priority = 0 }` em modo parcial: maior
 * prioridade primeiro; empate na ordem de entrada. Cada pedido vê os lotes já
 * consumidos pelos anteriores. Resultados na ordem de entrada dos pedidos.
 */
export function allocateMany(lots, orders) {
  const order = orders
    .map((o, index) => ({ o, index }))
    .sort((a, b) => (b.o.priority ?? 0) - (a.o.priority ?? 0) || a.index - b.index);
  const results = new Array(orders.length);
  let current = lots;
  for (const { o, index } of order) {
    const r = allocate(current, o.qty);
    results[index] = { id: o.id, picks: r.picks, allocated: r.allocated, shortfall: r.shortfall };
    current = r.lots;
  }
  return { results, lots: current };
}

/** Agrupa picks por lote, somando quantidades, na ordem da primeira aparição. */
export function mergePicks(picks) {
  const totals = new Map();
  for (const p of picks) totals.set(p.lotId, (totals.get(p.lotId) ?? 0) + p.qty);
  return [...totals].map(([lotId, qty]) => ({ lotId, qty }));
}
