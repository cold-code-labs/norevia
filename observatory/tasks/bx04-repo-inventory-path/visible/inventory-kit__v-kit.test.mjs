import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortFifo } from '../src/inventory-kit/lots.mjs';
import { allocate } from '../src/inventory-kit/allocate.mjs';
import { ReservationBook } from '../src/inventory-kit/reserve.mjs';
import { suggestOrder } from '../src/inventory-kit/reorder.mjs';

test('sortFifo: lote recebido antes sai primeiro', () => {
  const lots = [
    { id: 'L2', sku: 'cafe', qty: 4, receivedAt: '2024-03-10' },
    { id: 'L1', sku: 'cafe', qty: 6, receivedAt: '2024-02-28' },
  ];
  assert.deepEqual(sortFifo(lots).map((l) => l.id), ['L1', 'L2']);
});

test('allocate: simular a mesma alocação duas vezes dá o mesmo resultado', () => {
  const lots = [{ id: 'L1', qty: 6 }, { id: 'L2', qty: 4, reserved: 1 }];
  const first = allocate(lots, 8);
  assert.deepEqual(first.picks, [{ lotId: 'L1', qty: 6 }, { lotId: 'L2', qty: 2 }]);
  const second = allocate(lots, 8);
  assert.deepEqual(second, first);
});

test('reserva idempotente pela chave', () => {
  const book = new ReservationBook({ defaultTtl: 60 });
  const a = book.reserve({ key: 'pedido-1', sku: 'cafe', qty: 2, now: 100 });
  const b = book.reserve({ key: 'pedido-1', sku: 'cafe', qty: 9, now: 130 });
  assert.equal(a.created, true);
  assert.deepEqual(b, { ...a, created: false });
  assert.equal(book.reservedQty('cafe', 130), 2);
});

test('suggestOrder arredonda para a embalagem', () => {
  const base = { onHand: 10, dailyDemand: 4, leadTimeDays: 5, safetyStock: 6, packSize: 12 };
  assert.deepEqual(suggestOrder({ ...base, targetLevel: 40 }), { order: 36, position: 10, reorderPoint: 26, reason: 'repor' });
  assert.deepEqual(suggestOrder({ ...base, targetLevel: 46 }), { order: 36, position: 10, reorderPoint: 26, reason: 'repor' });
});
