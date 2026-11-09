import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatField, formatRow, toCsv } from '../src/csv.mjs';

test('a single quote', () => {
  assert.equal(formatField('5" tela'), '"5"" tela"');
});

test('field made only of quotes', () => {
  assert.equal(formatField('""'), '""""""');
  assert.equal(formatField('"'), '""""');
});

test('quotes with alternative delimiter', () => {
  assert.equal(formatRow(['x"y"z', 'a;b', 'c,d'], ';'), '"x""y""z";"a;b";c,d');
});

test('line breaks and spaces at the ends', () => {
  assert.equal(formatField('l1\nl2'), '"l1\nl2"');
  assert.equal(formatField('a\rb'), '"a\rb"');
  assert.equal(formatField(' x'), '" x"');
  assert.equal(formatField('x '), '"x "');
  assert.equal(formatField('a b'), 'a b');
});

test('non-string values', () => {
  assert.equal(formatRow([null, undefined, 0, false, 1.5]), ',,0,false,1.5');
});

test('full toCsv', () => {
  const rows = [['nome', 'obs'], ['Ana', 'diz "sim", "não" e "talvez"'], ['Bia', '']];
  assert.equal(toCsv(rows), 'nome,obs\r\nAna,"diz ""sim"", ""não"" e ""talvez"""\r\nBia,');
  assert.equal(toCsv([]), '');
});

test('invalid inputs', () => {
  assert.throws(() => toCsv('x'), TypeError);
  assert.throws(() => toCsv([['a']], { delimiter: ';;' }), RangeError);
  assert.throws(() => toCsv([['a']], { delimiter: '"' }), RangeError);
});
