import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDecimal, groupDigits, formatPercent } from '../src/format.mjs';

test('agrupamento padrão e separadores', () => {
  assert.equal(formatDecimal('1234567.891'), '1,234,567.89');
  assert.equal(formatDecimal('-1234.5', { groupSep: '.', decimalSep: ',' }), '-1.234,50');
  assert.equal(formatDecimal('1234567.891', { places: 1, grouping: 'none' }), '1234567.9');
  assert.equal(formatDecimal('-0.001'), '0.00');
  assert.equal(formatDecimal('999', { places: 0 }), '999');
  assert.throws(() => formatDecimal('1', { groupSep: '.', decimalSep: '.' }), RangeError);
  assert.throws(() => formatDecimal('1', { grouping: 'chinese' }), RangeError);
});

test('agrupamento indiano', () => {
  assert.equal(formatDecimal('123456', { grouping: 'indian', places: 0 }), '1,23,456');
  assert.equal(formatDecimal('12345678.905', { grouping: 'indian' }), '1,23,45,678.90');
  assert.equal(formatDecimal('1234567', { grouping: 'indian', places: 0 }), '12,34,567');
  assert.equal(groupDigits('12345', 'indian'), '12,345');
  assert.equal(groupDigits('123', 'indian'), '123');
});

test('arredondamento antes de agrupar', () => {
  assert.equal(formatDecimal('999999.995'), '1,000,000.00');
  assert.equal(formatDecimal('99999.5', { grouping: 'indian', places: 0 }), '1,00,000');
});

test('porcentagem', () => {
  assert.equal(formatPercent('0.125'), '12.5%');
  assert.equal(formatPercent('1.5', 0), '150%');
  assert.equal(formatPercent('-0.0125', 1, 'halfUp'), '-1.3%');
  assert.throws(() => formatPercent('abc'), RangeError);
});
