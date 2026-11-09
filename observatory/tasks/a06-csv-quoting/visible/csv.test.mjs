import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatField, toCsv } from '../src/csv.mjs';

test('simple field and field with comma', () => {
  assert.equal(formatField('abc'), 'abc');
  assert.equal(formatField('a,b'), '"a,b"');
});

test('quotation with two quoted utterances', () => {
  assert.equal(
    toCsv([['id', 'texto'], [1, 'ele disse "oi" e "tchau"']]),
    'id,texto\r\n1,"ele disse ""oi"" e ""tchau"""',
  );
});
