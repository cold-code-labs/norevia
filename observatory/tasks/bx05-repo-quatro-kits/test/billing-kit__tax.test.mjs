import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeTaxes, extractInclusive, effectiveRateBp } from '../src/billing-kit/tax.mjs';

test('arredondamento por linha vs por fatura', () => {
  const taxes = [{ code: 'A', rateBp: 250 }];
  assert.deepEqual(computeTaxes([1050, 2050], taxes), { net: 3100, byCode: { A: 77 }, taxTotal: 77, gross: 3177 });
  assert.deepEqual(computeTaxes([1050, 2050], taxes, { rounding: 'invoice' }), { net: 3100, byCode: { A: 78 }, taxTotal: 78, gross: 3178 });
  assert.equal(computeTaxes([5, 7], [{ code: 'H', rateBp: 5000 }]).taxTotal, 6);
});

test('composto incide sobre líquido + simples, independente da posição', () => {
  const r = computeTaxes([10000], [{ code: 'C', rateBp: 1000, compound: true }, { code: 'S', rateBp: 500 }]);
  assert.deepEqual(r.byCode, { C: 1050, S: 500 });
  assert.deepEqual(Object.keys(r.byCode), ['C', 'S']);
});

test('dois impostos compostos não incidem um sobre o outro', () => {
  const r = computeTaxes([10000], [
    { code: 'S', rateBp: 500 },
    { code: 'C1', rateBp: 1000, compound: true },
    { code: 'C2', rateBp: 200, compound: true },
  ]);
  assert.deepEqual(r, { net: 10000, byCode: { S: 500, C1: 1050, C2: 210 }, taxTotal: 1760, gross: 11760 });
  assert.equal(effectiveRateBp(r), 1760);
});

test('composto com várias linhas nos dois modos', () => {
  const taxes = [{ code: 'S', rateBp: 1000 }, { code: 'C', rateBp: 1000, compound: true }];
  assert.deepEqual(computeTaxes([3333, 3333], taxes).byCode, { S: 666, C: 734 });
  assert.deepEqual(computeTaxes([3333, 3333], taxes, { rounding: 'invoice' }).byCode, { S: 667, C: 733 });
});

test('validação', () => {
  assert.throws(() => computeTaxes([100], [{ code: 'A', rateBp: 1 }, { code: 'A', rateBp: 2 }]), RangeError);
  assert.throws(() => computeTaxes([-1], [{ code: 'A', rateBp: 1 }]), RangeError);
  assert.throws(() => computeTaxes([1], [{ code: 'A', rateBp: 1.5 }]), RangeError);
  assert.throws(() => computeTaxes([1], [], { rounding: 'x' }), RangeError);
});

test('extractInclusive', () => {
  assert.deepEqual(extractInclusive(1100, [{ code: 'A', rateBp: 1000 }]), { net: 1000, byCode: { A: 100 }, gross: 1100 });
  assert.deepEqual(extractInclusive(1000, [{ code: 'A', rateBp: 500 }, { code: 'B', rateBp: 700 }]), { net: 892, byCode: { A: 45, B: 63 }, gross: 1000 });
  assert.deepEqual(extractInclusive(0, []), { net: 0, byCode: {}, gross: 0 });
  assert.throws(() => extractInclusive(1000, [{ code: 'C', rateBp: 100, compound: true }]), RangeError);
  assert.equal(effectiveRateBp({ net: 0, taxTotal: 0 }), 0);
});
