import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitEvenly } from '../src/estoque-kit/money.mjs';
import { StockLedger } from '../src/estoque-kit/ledger.mjs';
import { applyDiscounts } from '../src/estoque-kit/discounts.mjs';

test('splitEvenly(100, 3)', () => {
  assert.deepEqual(splitEvenly(100, 3), [34, 33, 33]);
});
test('ledger básico', () => {
  const l = new StockLedger();
  l.receive('X', 5);
  l.ship('X', 2);
  assert.equal(l.balance('X'), 3);
});
test('desconto de 15% sobre R$ 10,05', () => {
  assert.equal(applyDiscounts(1005, [{ kind: 'percent', value: 15 }]).total, 854);
});
