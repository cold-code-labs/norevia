import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFormatted, isFormatted } from '../src/parse.mjs';

test('formato padrão', () => {
  assert.equal(parseFormatted('1,234,567.50'), '1234567.5');
  assert.equal(parseFormatted('-0.00'), '0');
  assert.equal(parseFormatted('100'), '100');
  assert.equal(parseFormatted('0'), '0');
  assert.equal(parseFormatted('007'), '7');
  assert.equal(parseFormatted('1,000.10'), '1000.1');
  assert.throws(() => parseFormatted('12,34'), RangeError);
  assert.throws(() => parseFormatted('10.'), RangeError);
  assert.throws(() => parseFormatted('1234', { allowUngrouped: false }), RangeError);
  assert.throws(() => parseFormatted(5), TypeError);
});

test('indiano', () => {
  assert.equal(parseFormatted('12,34,567', { grouping: 'indian' }), '1234567');
  assert.equal(isFormatted('1,234,567', { grouping: 'indian' }), false);
  assert.equal(isFormatted('1,23,456.7', { grouping: 'indian' }), true);
});

test('separadores europeus', () => {
  assert.equal(parseFormatted('1.234,50', { groupSep: '.', decimalSep: ',' }), '1234.5');
  assert.equal(parseFormatted('1.200', { groupSep: '.', decimalSep: ',' }), '1200');
  assert.equal(parseFormatted('1200,0', { groupSep: '.', decimalSep: ',' }), '1200');
  assert.equal(parseFormatted('-1 000', { groupSep: ' ', decimalSep: ',' }), '-1000');
  assert.throws(() => parseFormatted('1', { groupSep: ',', decimalSep: ',' }), RangeError);
});
