import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fuzzyMatch, fuzzyFilter } from '../src/search-kit/fuzzy.mjs';

test('fuzzyMatch: exemplos de pontuação', () => {
  assert.deepEqual(fuzzyMatch('ab', 'ab'), { score: 7, positions: [0, 1] });
  assert.deepEqual(fuzzyMatch('fb', 'foo-bar'), { score: 6, positions: [0, 4] });
  assert.deepEqual(fuzzyMatch('fb', 'fooBar'), { score: 6, positions: [0, 3] });
  assert.deepEqual(fuzzyMatch('Ab', 'AB'), { score: 7, positions: [0, 1] });
});

test('fuzzyMatch: casamento guloso pela esquerda', () => {
  assert.deepEqual(fuzzyMatch('ab', 'a_ab'), { score: 4, positions: [0, 3] });
  assert.deepEqual(fuzzyMatch('oa', 'foo-bar'), { score: 2, positions: [1, 5] });
  assert.deepEqual(fuzzyMatch('ABC', 'xaybzc'), { score: 3, positions: [1, 3, 5] });
});

test('fuzzyMatch: sem casamento, consulta vazia, code points', () => {
  assert.equal(fuzzyMatch('abc', 'ab'), null);
  assert.equal(fuzzyMatch('ba', 'ab'), null);
  assert.deepEqual(fuzzyMatch('', 'xyz'), { score: 0, positions: [] });
  assert.deepEqual(fuzzyMatch('😀b', 'a😀b'), { score: 7, positions: [1, 2] });
  assert.throws(() => fuzzyMatch('a', 1), TypeError);
});

test('fuzzyFilter: pontuação decrescente', () => {
  assert.deepEqual(fuzzyFilter('ab', ['a-b', 'zz ab']), [
    { item: 'zz ab', score: 7, positions: [3, 4] },
    { item: 'a-b', score: 6, positions: [0, 2] },
  ]);
  assert.deepEqual(fuzzyFilter('re', ['core', 'remote', 'tree', 'xyz']).map((r) => [r.item, r.score]), [
    ['remote', 7], ['core', 5], ['tree', 5],
  ]);
});

test('fuzzyFilter: empates por tamanho e depois ordem original', () => {
  assert.deepEqual(fuzzyFilter('ab', ['abxx', 'ab', 'abx']).map((r) => r.item), ['ab', 'abx', 'abxx']);
  assert.deepEqual(fuzzyFilter('a', ['ca', 'ba', 'ab']).map((r) => r.item), ['ab', 'ca', 'ba']);
});

test('fuzzyFilter: limit', () => {
  assert.deepEqual(fuzzyFilter('a', ['a', 'ba', 'ca'], { limit: 2 }).map((r) => r.item), ['a', 'ba']);
  assert.deepEqual(fuzzyFilter('a', ['a'], { limit: 0 }), []);
  assert.throws(() => fuzzyFilter('a', ['a'], { limit: -1 }), RangeError);
});
