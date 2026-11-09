import { test } from 'node:test';
import assert from 'node:assert/strict';
import { segment } from '../src/grapheme.mjs';
import { stringWidth } from '../src/width.mjs';
import { wrap } from '../src/wrap.mjs';

test('clusters e larguras básicos', () => {
  assert.deepEqual(segment('éa🇧🇷🇺🇸'), ['é', 'a', '🇧🇷', '🇺🇸']);
  assert.equal(stringWidth('漢字ok'), 6);
});

test('wrap quebra palavra longa preenchendo cada linha', () => {
  assert.deepEqual(wrap('abcdefghij', 4), ['abcd', 'efgh', 'ij']);
});
