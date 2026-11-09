/**
 * Kit de estoque: lotes FIFO, unidades, alocação, reservas e reposição.
 */
export * from './lots.mjs';
export * from './units.mjs';
export * from './allocate.mjs';
export * from './reserve.mjs';
export * from './reorder.mjs';

import { usableLots } from './lots.mjs';
import { allocate } from './allocate.mjs';

/** Separa `qty` dos lotes utilizáveis em `today`, em ordem FIFO, no modo indicado. */
export function planPick(lots, qty, today, { mode = 'partial', minShelfDays = 0 } = {}) {
  return allocate(usableLots(lots, today, { minShelfDays }), qty, { mode });
}
