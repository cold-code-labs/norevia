import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatTable, escapeCell } from '../src/mdtable.mjs';

test('table with CJK characters and a combining accent stays aligned', () => {
  const out = formatTable([['Cidade', 'Nota'], ['東京', '9'], ['São Paulo', '10']], { align: [null, 'right'] });
  assert.equal(out, [
    '| Cidade    | Nota |',
    '| --------- | ---: |',
    '| 東京      |    9 |',
    '| São Paulo |   10 |',
  ].join('\n'));
});

test('table with emoji stays aligned', () => {
  const out = formatTable([['Fruta', 'Ícone'], ['maçã', '🍎']]);
  assert.equal(out, [
    '| Fruta | Ícone |',
    '| ----- | ----- |',
    '| maçã  | 🍎    |',
  ].join('\n'));
});

test('escapeCell replaces line breaks and pipes', () => {
  assert.equal(escapeCell(' a|b\nc '), 'a\\|b<br>c');
});
