import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compact, parseCompact } from '../src/compact.mjs';

test('unidades e modos simétricos', () => {
  assert.equal(compact('999'), '999');
  assert.equal(compact('0.5'), '0.5');
  assert.equal(compact('1250'), '1.2K');
  assert.equal(compact('1250', 'halfUp'), '1.3K');
  assert.equal(compact('-1250', 'halfUp'), '-1.3K');
  assert.equal(compact('999949'), '999.9K');
  assert.equal(compact('1234567890123456'), '1234.6T');
  assert.equal(compact('12345', 'down'), '12.3K');
  assert.equal(compact('-1000'), '-1K');
});

test('promoção de unidade após o arredondamento', () => {
  assert.equal(compact('999950'), '1M');
  assert.equal(compact('999999999999999999'), '1000000T');
});

test('floor e ceiling usam o valor com sinal', () => {
  assert.equal(compact('-1250', 'floor'), '-1.3K');
  assert.equal(compact('-1250', 'ceiling'), '-1.2K');
  assert.equal(compact('1250', 'floor'), '1.2K');
  assert.equal(compact('-1999', 'floor'), '-2K');
  assert.equal(compact('-0.04', 'ceiling'), '0');
  assert.equal(compact('-12345', 'ceiling'), '-12.3K');
});

test('parseCompact', () => {
  assert.equal(parseCompact('1.5K'), '1500');
  assert.equal(parseCompact('-2M'), '-2000000');
  assert.equal(parseCompact('0.25'), '0.25');
  assert.throws(() => parseCompact('1.5k'), RangeError);
  assert.throws(() => parseCompact(15), TypeError);
});
