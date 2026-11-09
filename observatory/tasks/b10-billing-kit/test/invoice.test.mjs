import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildInvoice, applyCredits, renderInvoice, MINIMUM_SKU } from '../src/invoice.mjs';

test('consolidates by sku + unit price and ignores qty 0', () => {
  const inv = buildInvoice([
    { sku: 'A', description: 'Alpha', qty: 2, unitCents: 100 },
    { sku: 'B', qty: 1, unitCents: 300 },
    { sku: 'A', description: 'Alpha 2', qty: 3, unitCents: 100 },
    { sku: 'A', qty: 1, unitCents: 120 },
    { sku: 'C', qty: 0, unitCents: 999 },
  ]);
  assert.deepEqual(inv.lines, [
    { sku: 'A', description: 'Alpha', qty: 5, unitCents: 100, amount: 500 },
    { sku: 'B', description: '', qty: 1, unitCents: 300, amount: 300 },
    { sku: 'A', description: '', qty: 1, unitCents: 120, amount: 120 },
  ]);
  assert.equal(inv.subtotal, 920);
  assert.equal(inv.total, 920);
});

test('minimum usage', () => {
  const inv = buildInvoice([{ sku: 'A', qty: 1, unitCents: 100 }], { minimumCents: 500 });
  assert.equal(MINIMUM_SKU, 'MINIMUM');
  assert.deepEqual(inv.lines[1], { sku: 'MINIMUM', description: 'Ajuste de consumo mínimo', qty: 1, unitCents: 400, amount: 400 });
  assert.equal(inv.subtotal, 500);
  assert.equal(buildInvoice([{ sku: 'A', qty: 5, unitCents: 100 }], { minimumCents: 500 }).lines.length, 1);
  assert.deepEqual(buildInvoice([]), { lines: [], subtotal: 0, applied: [], unused: [], total: 0 });
});

test('credits by expiry, no expiry last, ties by order', () => {
  const inv = buildInvoice([{ sku: 'A', qty: 7, unitCents: 100 }], {
    credits: [
      { id: 'c1', cents: 300 },
      { id: 'c2', cents: 200, expires: '2025-01-31' },
      { id: 'c3', cents: 500, expires: '2024-12-31' },
      { id: 'c4', cents: 100, expires: '2024-12-31' },
    ],
  });
  assert.deepEqual(inv.applied, [{ id: 'c3', cents: 500 }, { id: 'c4', cents: 100 }, { id: 'c2', cents: 100 }]);
  assert.deepEqual(inv.unused, [{ id: 'c2', cents: 100 }, { id: 'c1', cents: 300 }]);
  assert.equal(inv.total, 0);
});

test('inputs are not changed', () => {
  const items = [{ sku: 'A', qty: 2, unitCents: 100 }, { sku: 'A', qty: 1, unitCents: 100 }];
  const credits = [{ id: 'x', cents: 150, expires: '2030-01-01' }, { id: 'y', cents: 500 }];
  const snapshot = structuredClone({ items, credits });
  buildInvoice(items, { credits });
  assert.deepEqual({ items, credits }, snapshot);
});

test('idempotence: the same call twice gives the same result', () => {
  const items = [{ sku: 'A', qty: 3, unitCents: 100 }];
  const credits = [{ id: 'x', cents: 200 }];
  const a = buildInvoice(items, { credits });
  const b = buildInvoice(items, { credits });
  assert.deepEqual(b, a);
  assert.equal(b.total, 100);
});

test('applyCredits and validation', () => {
  assert.deepEqual(applyCredits(0, [{ id: 'x', cents: 50 }]), { applied: [], unused: [{ id: 'x', cents: 50 }], remaining: 0 });
  assert.throws(() => applyCredits(10, [{ id: 'x', cents: 0 }]), RangeError);
  assert.throws(() => buildInvoice([{ sku: 'A', qty: -1, unitCents: 1 }]), RangeError);
  assert.throws(() => buildInvoice([{ sku: 'A', qty: 1, unitCents: 1.5 }]), RangeError);
  assert.throws(() => buildInvoice([{ sku: '', qty: 1, unitCents: 1 }]), RangeError);
});

test('renderInvoice', () => {
  const inv = buildInvoice([{ sku: 'A', qty: 2, unitCents: 1050 }], { credits: [{ id: 'promo', cents: 100 }] });
  assert.equal(renderInvoice(inv), 'A x2 21.00\nCREDIT promo -1.00\nTOTAL 20.00');
});
