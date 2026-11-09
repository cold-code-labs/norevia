import { test } from 'node:test';
import assert from 'node:assert/strict';
import { available, totalAvailable, allocate, allocateMany, mergePicks } from '../src/allocate.mjs';

const mk = () => [
  { id: 'A', qty: 5, reserved: 5 },
  { id: 'B', qty: 4, reserved: 1 },
  { id: 'C', qty: 10 },
];

test('available e totalAvailable', () => {
  assert.equal(available({ qty: 3, reserved: 5 }), 0);
  assert.equal(available({ qty: 3 }), 3);
  assert.equal(totalAvailable(mk()), 13);
});

test('allocate parcial: respeita reservado e pula lotes sem disponível', () => {
  const r = allocate(mk(), 8);
  assert.deepEqual(r.picks, [{ lotId: 'B', qty: 3 }, { lotId: 'C', qty: 5 }]);
  assert.equal(r.allocated, 8);
  assert.equal(r.shortfall, 0);
  assert.deepEqual(r.lots.map((l) => l.qty), [5, 1, 5]);
  assert.deepEqual(r.lots.map((l) => l.reserved), [5, 1, undefined]);
});

test('allocate não altera o array nem os lotes recebidos', () => {
  const lots = mk();
  const snapshot = structuredClone(lots);
  const r = allocate(lots, 8);
  assert.deepEqual(lots, snapshot);
  assert.notEqual(r.lots, lots);
  assert.deepEqual(allocate(lots, 8), r);
});

test('allocate parcial com falta', () => {
  const r = allocate(mk(), 20);
  assert.deepEqual(r.picks, [{ lotId: 'B', qty: 3 }, { lotId: 'C', qty: 10 }]);
  assert.equal(r.allocated, 13);
  assert.equal(r.shortfall, 7);
});

test('allocate all-or-nothing', () => {
  const lots = mk();
  const none = allocate(lots, 14, { mode: 'all-or-nothing' });
  assert.deepEqual(none.picks, []);
  assert.equal(none.allocated, 0);
  assert.equal(none.shortfall, 14);
  assert.deepEqual(none.lots, mk());
  const all = allocate(lots, 13, { mode: 'all-or-nothing' });
  assert.equal(all.allocated, 13);
  assert.deepEqual(all.lots.map((l) => l.qty), [5, 1, 0]);
});

test('allocate: validações e qty zero', () => {
  assert.throws(() => allocate(mk(), -1), RangeError);
  assert.throws(() => allocate(mk(), 1.5), RangeError);
  assert.throws(() => allocate(mk(), 1, { mode: 'greedy' }), RangeError);
  assert.deepEqual(allocate(mk(), 0), { picks: [], allocated: 0, shortfall: 0, lots: mk() });
});

test('allocateMany: prioridade, empate pela entrada, resultados na ordem de entrada', () => {
  const lots = mk();
  const snapshot = structuredClone(lots);
  const out = allocateMany(lots, [
    { id: 'p1', qty: 4 },
    { id: 'p2', qty: 6, priority: 2 },
    { id: 'p3', qty: 5 },
  ]);
  assert.deepEqual(out.results, [
    { id: 'p1', picks: [{ lotId: 'C', qty: 4 }], allocated: 4, shortfall: 0 },
    { id: 'p2', picks: [{ lotId: 'B', qty: 3 }, { lotId: 'C', qty: 3 }], allocated: 6, shortfall: 0 },
    { id: 'p3', picks: [{ lotId: 'C', qty: 3 }], allocated: 3, shortfall: 2 },
  ]);
  assert.deepEqual(out.lots.map((l) => l.qty), [5, 1, 0]);
  assert.deepEqual(lots, snapshot);
});

test('mergePicks soma por lote na ordem de primeira aparição', () => {
  assert.deepEqual(mergePicks([{ lotId: 'C', qty: 2 }, { lotId: 'B', qty: 1 }, { lotId: 'C', qty: 3 }]),
    [{ lotId: 'C', qty: 5 }, { lotId: 'B', qty: 1 }]);
});
