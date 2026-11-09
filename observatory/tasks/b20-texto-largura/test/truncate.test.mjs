import { test } from 'node:test';
import assert from 'node:assert/strict';
import { truncateEnd, truncateStart, truncateMiddle, fit } from '../src/truncate.mjs';

test('truncateEnd e truncateStart', () => {
  assert.equal(truncateEnd('abcdef', 6), 'abcdef');
  assert.equal(truncateEnd('abcdefg', 6), 'abcde…');
  assert.equal(truncateEnd('漢字かな', 5), '漢字…');
  assert.equal(truncateEnd('漢字かな', 4), '漢…');
  assert.equal(truncateEnd('abcdef', 4, '...'), 'a...');
  assert.equal(truncateEnd('abcdef', 2, '...'), 'ab');
  assert.equal(truncateEnd('abc', 0), '');
  assert.equal(truncateStart('abcdefg', 4), '…efg');
  assert.equal(truncateStart('漢字かな', 4), '…な');
  assert.throws(() => truncateEnd('abc', -1), RangeError);
  assert.throws(() => truncateEnd('abc', 2, 5), TypeError);
});

test('truncateMiddle com caracteres estreitos', () => {
  assert.equal(truncateMiddle('abcdefghij', 7), 'abc…hij');
  assert.equal(truncateMiddle('abcdefghij', 6), 'abc…ij');
  assert.equal(truncateMiddle('abcdefghij', 10), 'abcdefghij');
  assert.equal(truncateMiddle('abcdef', 2, '...'), 'ab');
});

test('truncateMiddle repassa à direita a largura não usada à esquerda', () => {
  assert.equal(truncateMiddle('漢字かなabc', 6), '漢…abc');
  assert.equal(truncateMiddle('ab漢字かなxyz', 7), 'ab…xyz');
  assert.equal(truncateMiddle('漢字かなabcdef', 7), '漢…cdef');
  assert.equal(truncateMiddle('漢字かなabcdef', 8), '漢字…def');
  assert.equal(truncateMiddle('漢字abcdef', 4), '漢…f');
});

test('fit', () => {
  assert.equal(fit('abcdefg', 5), 'abcd…');
  assert.equal(fit('ab', 5), 'ab   ');
  assert.equal(fit('漢字かな', 4), '漢… ');
  assert.equal(fit('abcdefg', 5, { position: 'start' }), '…defg');
  assert.equal(fit('漢字かなabc', 6, { position: 'middle' }), '漢…abc');
  assert.throws(() => fit('a', 2, { position: 'meio' }), RangeError);
});
