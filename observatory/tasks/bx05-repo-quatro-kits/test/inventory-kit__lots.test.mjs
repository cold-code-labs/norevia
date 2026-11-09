import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDate, daysBetween, sortFifo, isUsable, usableLots, expiringSoon, totalsBySku } from '../src/inventory-kit/lots.mjs';

test('parseDate e daysBetween', () => {
  assert.equal(parseDate('1970-01-02'), 1);
  assert.equal(daysBetween('2024-02-28', '2024-03-01'), 2);
  assert.equal(daysBetween('2024-03-01', '2024-02-28'), -2);
  assert.equal(daysBetween('2023-12-31', '2024-01-01'), 1);
  assert.throws(() => parseDate('2023-02-29'), RangeError);
  assert.throws(() => parseDate('2024-2-01'), RangeError);
  assert.throws(() => parseDate(20240101), RangeError);
});

test('sortFifo: empate de data desempata pelo id com < (sensível a maiúsculas)', () => {
  const lots = [
    { id: 'a1', qty: 1, receivedAt: '2024-01-05' },
    { id: 'B1', qty: 1, receivedAt: '2024-01-05' },
    { id: 'c', qty: 1, receivedAt: '2024-01-04' },
    { id: 'lote9', qty: 1, receivedAt: '2024-01-06' },
    { id: 'lote10', qty: 1, receivedAt: '2024-01-06' },
  ];
  const snapshot = structuredClone(lots);
  assert.deepEqual(sortFifo(lots).map((l) => l.id), ['c', 'B1', 'a1', 'lote10', 'lote9']);
  assert.deepEqual(lots, snapshot);
});

test('sortFifo: datas comparadas cronologicamente', () => {
  const lots = [
    { id: 'x', qty: 1, receivedAt: '2024-10-01' },
    { id: 'y', qty: 1, receivedAt: '2024-09-30' },
    { id: 'z', qty: 1, receivedAt: '2023-12-31' },
  ];
  assert.deepEqual(sortFifo(lots).map((l) => l.id), ['z', 'y', 'x']);
});

test('isUsable: validade inclusiva, minShelfDays, quantidade e recebimento', () => {
  const lot = (o) => ({ id: 'L', qty: 3, receivedAt: '2024-05-01', ...o });
  assert.equal(isUsable(lot({ expiresOn: '2024-05-10' }), '2024-05-10'), true);
  assert.equal(isUsable(lot({ expiresOn: '2024-05-09' }), '2024-05-10'), false);
  assert.equal(isUsable(lot({ expiresOn: '2024-05-12' }), '2024-05-10', { minShelfDays: 2 }), true);
  assert.equal(isUsable(lot({ expiresOn: '2024-05-11' }), '2024-05-10', { minShelfDays: 2 }), false);
  assert.equal(isUsable(lot({}), '2024-05-10'), true);
  assert.equal(isUsable(lot({ qty: 0 }), '2024-05-10'), false);
  assert.equal(isUsable(lot({ receivedAt: '2024-05-11' }), '2024-05-10'), false);
  assert.equal(isUsable(lot({ receivedAt: '2024-05-10' }), '2024-05-10'), true);
});

test('usableLots: filtra e ordena em FIFO', () => {
  const lots = [
    { id: 'm2', qty: 2, receivedAt: '2024-05-02', expiresOn: '2024-05-20' },
    { id: 'M3', qty: 2, receivedAt: '2024-05-02' },
    { id: 'old', qty: 2, receivedAt: '2024-04-01', expiresOn: '2024-05-09' },
    { id: 'zero', qty: 0, receivedAt: '2024-04-01' },
    { id: 'first', qty: 1, receivedAt: '2024-04-15', expiresOn: '2024-05-10' },
  ];
  assert.deepEqual(usableLots(lots, '2024-05-10').map((l) => l.id), ['first', 'M3', 'm2']);
});

test('expiringSoon: janela inclusiva, por validade e depois FIFO', () => {
  const lots = [
    { id: 'a', qty: 1, receivedAt: '2024-05-01', expiresOn: '2024-05-13' },
    { id: 'B', qty: 1, receivedAt: '2024-05-01', expiresOn: '2024-05-13' },
    { id: 'c', qty: 1, receivedAt: '2024-04-01', expiresOn: '2024-05-10' },
    { id: 'd', qty: 1, receivedAt: '2024-04-01', expiresOn: '2024-05-14' },
    { id: 'e', qty: 1, receivedAt: '2024-04-01', expiresOn: '2024-05-09' },
    { id: 'f', qty: 0, receivedAt: '2024-04-01', expiresOn: '2024-05-11' },
    { id: 'g', qty: 1, receivedAt: '2024-04-01' },
  ];
  assert.deepEqual(expiringSoon(lots, '2024-05-10', 3).map((l) => l.id), ['c', 'B', 'a']);
});

test('totalsBySku na ordem de primeira aparição', () => {
  const lots = [
    { id: '1', sku: 'cha', qty: 2 }, { id: '2', sku: 'cafe', qty: 5 }, { id: '3', sku: 'cha', qty: 1 },
  ];
  assert.deepEqual([...totalsBySku(lots)], [['cha', 3], ['cafe', 5]]);
});
