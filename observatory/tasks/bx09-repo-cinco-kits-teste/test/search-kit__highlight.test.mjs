import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, mergeRanges, findMatches, highlight, snippet } from '../src/search-kit/highlight.mjs';

test('escapeHtml', () => {
  assert.equal(escapeHtml(`<a href="x">Tom & 'Jerry'</a>`), '&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;');
});

test('mergeRanges mescla sobrepostos e vizinhos, descarta vazios', () => {
  const input = [[5, 7], [0, 2], [2, 3], [6, 9], [4, 4]];
  const copy = JSON.parse(JSON.stringify(input));
  assert.deepEqual(mergeRanges(input), [[0, 3], [5, 9]]);
  assert.deepEqual(input, copy);
  assert.deepEqual(mergeRanges([[1, 2], [3, 4]]), [[1, 2], [3, 4]]);
  assert.deepEqual(mergeRanges([]), []);
});

test('mergeRanges valida intervalos', () => {
  assert.throws(() => mergeRanges([[3, 2]]), RangeError);
  assert.throws(() => mergeRanges([[-1, 2]]), RangeError);
  assert.throws(() => mergeRanges([[0, 1.5]]), RangeError);
  assert.throws(() => mergeRanges([[0, 1, 2]]), TypeError);
});

test('findMatches: sem distinção de maiúsculas, sem sobreposição por termo', () => {
  assert.deepEqual(findMatches('Banana', ['ana', 'AN', '']), [[1, 3], [1, 4], [3, 5]]);
  assert.deepEqual(findMatches('aaaa', ['aa']), [[0, 2], [2, 4]]);
  assert.deepEqual(findMatches('abc', ['z']), []);
});

test('highlight escapa texto, não marcadores', () => {
  assert.equal(highlight('a<b & c', [[2, 3]]), 'a&lt;<mark>b</mark> &amp; c');
  assert.equal(highlight('a<b', []), 'a&lt;b');
  assert.equal(highlight('xyz', [[0, 1]], { open: '<b class="m">', close: '</b>' }), '<b class="m">x</b>yz');
  assert.throws(() => highlight('abc', [[1, 4]]), RangeError);
});

test('highlight une trechos vizinhos e sobrepostos', () => {
  assert.equal(highlight('abab', findMatches('abab', ['ab'])), '<mark>abab</mark>');
  assert.equal(highlight('Banana', findMatches('Banana', ['ana', 'an'])), 'B<mark>anan</mark>a');
  assert.equal(highlight('fish & chips', [[0, 4], [4, 6], [7, 12]]), '<mark>fish &amp;</mark> <mark>chips</mark>');
});

test('snippet', () => {
  assert.equal(snippet('O rato roeu a roupa do rei de Roma', ['roupa'], { radius: 5 }), '…eu a <mark>roupa</mark> do r…');
  assert.equal(snippet('O rato roeu', ['rato'], { radius: 3 }), 'O <mark>rato</mark> ro…');
  assert.equal(snippet('abcdefgh', ['zz'], { radius: 2 }), 'abcd…');
  assert.equal(snippet('abc', ['zz'], { radius: 2 }), 'abc');
});
