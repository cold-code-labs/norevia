import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ceilToMultiple, floorToMultiple, reorderPoint, coverDays, suggestOrder } from '../src/inventory-kit/reorder.mjs';

test('ceilToMultiple: múltiplo exato não sobe', () => {
  assert.equal(ceilToMultiple(25, 12), 36);
  assert.equal(ceilToMultiple(24, 12), 24);
  assert.equal(ceilToMultiple(1, 1), 1);
  assert.equal(ceilToMultiple(0, 12), 0);
  assert.equal(ceilToMultiple(-3, 5), 0);
});

test('floorToMultiple', () => {
  assert.equal(floorToMultiple(25, 12), 24);
  assert.equal(floorToMultiple(24, 12), 24);
  assert.equal(floorToMultiple(11, 12), 0);
  assert.equal(floorToMultiple(-5, 12), 0);
});

test('reorderPoint e coverDays', () => {
  assert.equal(reorderPoint({ dailyDemand: 2.5, leadTimeDays: 3, safetyStock: 5 }), 13);
  assert.equal(reorderPoint({ dailyDemand: 4, leadTimeDays: 5 }), 20);
  assert.throws(() => reorderPoint({ dailyDemand: -1, leadTimeDays: 3 }), RangeError);
  assert.throws(() => reorderPoint({ dailyDemand: 1, leadTimeDays: NaN }), RangeError);
  assert.equal(coverDays(10, 4), 2);
  assert.equal(coverDays(10, 0), Infinity);
});

test('suggestOrder: acima do ponto não pede; no ponto pede', () => {
  const base = { dailyDemand: 4, leadTimeDays: 5, safetyStock: 6, targetLevel: 50 };
  assert.deepEqual(suggestOrder({ ...base, onHand: 20, onOrder: 10, backorders: 3 }),
    { order: 0, position: 27, reorderPoint: 26, reason: 'acima-do-ponto' });
  assert.deepEqual(suggestOrder({ ...base, onHand: 20, onOrder: 10, backorders: 4 }),
    { order: 24, position: 26, reorderPoint: 26, reason: 'repor' });
});

test('suggestOrder: embalagem exata e pedido mínimo', () => {
  const base = { onHand: 4, dailyDemand: 2, leadTimeDays: 3, targetLevel: 16, packSize: 6 };
  assert.equal(suggestOrder(base).order, 12);
  assert.equal(suggestOrder({ ...base, minOrder: 13 }).order, 18);
  assert.equal(suggestOrder({ ...base, minOrder: 18 }).order, 18);
  assert.equal(suggestOrder({ ...base, targetLevel: 4 }).order, 0);
});

test('suggestOrder: limitado pelo estoque máximo arredonda para baixo', () => {
  const base = { onHand: 4, dailyDemand: 2, leadTimeDays: 3, targetLevel: 30, packSize: 6 };
  assert.deepEqual(suggestOrder({ ...base, maxStock: 25 }),
    { order: 18, position: 4, reorderPoint: 6, reason: 'limitado-pelo-maximo' });
  assert.deepEqual(suggestOrder({ ...base, maxStock: 9 }),
    { order: 0, position: 4, reorderPoint: 6, reason: 'limitado-pelo-maximo' });
  assert.deepEqual(suggestOrder({ ...base, maxStock: 34 }),
    { order: 30, position: 4, reorderPoint: 6, reason: 'repor' });
  assert.throws(() => suggestOrder({ ...base, packSize: 0 }), RangeError);
});
