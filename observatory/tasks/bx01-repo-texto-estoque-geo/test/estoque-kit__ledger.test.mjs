import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StockLedger } from '../src/estoque-kit/ledger.mjs';

test('receive/ship atualizam e devolvem o saldo', () => {
  const l = new StockLedger();
  assert.equal(l.receive('A', 10), 10);
  assert.equal(l.ship('A', 4), 6);
  assert.equal(l.balance('A'), 6);
  assert.equal(l.balance('Z'), 0);
});
test('ship com saldo insuficiente não registra nada; saldo exato é permitido', () => {
  const l = new StockLedger();
  l.receive('A', 3);
  assert.throws(() => l.ship('A', 4), RangeError);
  assert.equal(l.balance('A'), 3);
  assert.equal(l.history('A').length, 1);
  assert.equal(l.ship('A', 3), 0);
});
test('quantidades inválidas', () => {
  const l = new StockLedger();
  assert.throws(() => l.receive('A', 0), RangeError);
  assert.throws(() => l.ship('A', 1.5), RangeError);
});
test('adjust registra a diferença; diferença 0 não registra', () => {
  const l = new StockLedger();
  l.receive('A', 10);
  assert.equal(l.adjust('A', 7, 'inv'), 7);
  assert.equal(l.adjust('A', 7), 7);
  assert.deepEqual(l.history('A'), [
    { type: 'in', qty: 10, ref: null },
    { type: 'adjust', qty: -3, ref: 'inv' },
  ]);
});
test('history em ordem cronológica; SKU desconhecido → []', () => {
  const l = new StockLedger();
  l.receive('A', 10, 'nf-1');
  l.ship('A', 4);
  assert.deepEqual(l.history('A'), [
    { type: 'in', qty: 10, ref: 'nf-1' },
    { type: 'out', qty: 4, ref: null },
  ]);
  assert.deepEqual(l.history('Z'), []);
});
test('history devolve cópia independente', () => {
  const l = new StockLedger();
  l.receive('A', 5);
  const h = l.history('A');
  h[0].qty = 999;
  h.push({ type: 'out', qty: 1, ref: null });
  assert.deepEqual(l.history('A'), [{ type: 'in', qty: 5, ref: null }]);
});
test('skus: só saldo positivo, ordenados', () => {
  const l = new StockLedger();
  l.receive('B', 1);
  l.receive('A', 2);
  l.receive('C', 1);
  l.ship('C', 1);
  assert.deepEqual(l.skus(), ['A', 'B']);
});
