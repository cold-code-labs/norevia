import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wrap, truncate } from '../src/texto-kit/wrap.mjs';

test('wrap: linha pode ter exatamente width caracteres', () => {
  assert.equal(wrap('aa bb cc', 5), 'aa bb\ncc');
  assert.equal(wrap('the quick brown fox', 9), 'the quick\nbrown fox');
});
test('wrap: colapsa espaços e quebras', () => {
  assert.equal(wrap('  um\n\n dois   tres ', 20), 'um dois tres');
});
test('wrap: palavra longa fica sozinha', () => {
  assert.equal(wrap('a supercalifragilistico b', 5), 'a\nsupercalifragilistico\nb');
});
test('wrap: sem palavras devolve string vazia', () => {
  assert.equal(wrap('   ', 4), '');
});
test('wrap: width inválido', () => {
  assert.throws(() => wrap('a', 0), RangeError);
  assert.throws(() => wrap('a', 2.5), RangeError);
});
test('truncate', () => {
  assert.equal(truncate('abcdef', 4), 'abc…');
  assert.equal(truncate('abc', 3), 'abc');
  assert.equal(truncate('abcdef', 4, '...'), 'a...');
});
