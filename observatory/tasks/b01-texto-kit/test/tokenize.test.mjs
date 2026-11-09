import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, frequencies, topWords } from '../src/tokenize.mjs';

test('tokenize: words with inner hyphen and apostrophe, lowercase', () => {
  assert.deepEqual(
    tokenize("Olá, Mundo! O guarda-chuva d'água custa 10 reais."),
    ['olá', 'mundo', 'o', 'guarda-chuva', "d'água", 'custa', '10', 'reais'],
  );
});
test('tokenize: loose hyphens/apostrophes are separators; empty', () => {
  assert.deepEqual(tokenize("--a--b' 'c-"), ['a', 'b', 'c']);
  assert.deepEqual(tokenize(''), []);
});
test('frequencies: order of first occurrence', () => {
  assert.deepEqual([...frequencies('b a B c a b')], [['b', 3], ['a', 2], ['c', 1]]);
});
test('topWords: descending count and cut at n', () => {
  assert.deepEqual(topWords('x y y z z z', 2), [{ word: 'z', count: 3 }, { word: 'y', count: 2 }]);
});
test('topWords: ties in ascending order', () => {
  assert.deepEqual(topWords('pera uva maçã uva pera banana'), [
    { word: 'pera', count: 2 }, { word: 'uva', count: 2 },
    { word: 'banana', count: 1 }, { word: 'maçã', count: 1 },
  ]);
});
test('topWords: exclude ignores case', () => {
  assert.deepEqual(topWords('O gato e O rato e o cão', 2, { exclude: ['O', 'E'] }), [
    { word: 'cão', count: 1 }, { word: 'gato', count: 1 },
  ]);
});
test('topWords: n <= 0 returns []', () => {
  assert.deepEqual(topWords('a b c', 0), []);
  assert.deepEqual(topWords('a b c', -2), []);
});
