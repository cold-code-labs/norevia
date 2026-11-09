import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyRate } from '../src/billing-kit/money.mjs';
import { prorate } from '../src/billing-kit/proration.mjs';
import { volume } from '../src/billing-kit/tiers.mjs';
import { computeTaxes } from '../src/billing-kit/tax.mjs';
import { buildInvoice } from '../src/billing-kit/invoice.mjs';

const TABLE = [
  { upTo: 100, unitCents: 50 },
  { upTo: 1000, unitCents: 40, flatCents: 500 },
  { upTo: null, unitCents: 30, flatCents: 1000 },
];

test('estorno de 2,5% arredonda como a cobrança, com sinal trocado', () => {
  assert.equal(applyRate(1070, 250), 27);
  assert.equal(applyRate(-1070, 250), -27);
});

test('volume: pacote com exatamente o limite fica na própria faixa', () => {
  assert.equal(volume(100, TABLE).total, 5000);
});

test('pró-rata, impostos e fatura básicos', () => {
  assert.equal(prorate(3000, { start: '2024-04-01', end: '2024-05-01' }, { start: '2024-04-16', end: '2024-06-01' }), 1500);
  const t = computeTaxes([10000], [{ code: 'S', rateBp: 500 }, { code: 'C', rateBp: 1000, compound: true }]);
  assert.deepEqual(t, { net: 10000, byCode: { S: 500, C: 1050 }, taxTotal: 1550, gross: 11550 });
  const inv = buildInvoice([{ sku: 'A', qty: 2, unitCents: 100 }, { sku: 'A', qty: 1, unitCents: 100 }], { credits: [{ id: 'c', cents: 50 }] });
  assert.equal(inv.total, 250);
  assert.equal(inv.lines.length, 1);
});
