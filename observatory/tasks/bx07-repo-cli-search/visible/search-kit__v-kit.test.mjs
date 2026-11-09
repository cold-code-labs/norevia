import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../src/search-kit/analyze.mjs';
import { fuzzyFilter } from '../src/search-kit/fuzzy.mjs';
import { highlight } from '../src/search-kit/highlight.mjs';
import { paginate } from '../src/search-kit/cursor.mjs';

test('analyze remove acentos, stopwords e termos curtos', () => {
  assert.deepEqual(analyze('O Café da Manhã'), ['cafe', 'manha']);
});

test('fuzzyFilter: início de palavra após espaço vence', () => {
  assert.deepEqual(fuzzyFilter('ab', ['a-b', 'zz ab']).map((r) => r.item), ['zz ab', 'a-b']);
});

test('highlight não separa trechos que se tocam', () => {
  assert.equal(highlight('fish & chips', [[0, 4], [4, 6]]), '<mark>fish &amp;</mark> chips');
});

test('paginate percorre as páginas em ordem', () => {
  const items = [{ id: 'e', n: 5 }, { id: 'a', n: 1 }, { id: 'c', n: 3 }, { id: 'b', n: 2 }, { id: 'd', n: 4 }];
  const p1 = paginate(items, { sortKey: 'n', limit: 2 });
  assert.deepEqual(p1.items.map((i) => i.id), ['a', 'b']);
  const p2 = paginate(items, { sortKey: 'n', limit: 2, after: p1.nextCursor });
  assert.deepEqual(p2.items.map((i) => i.id), ['c', 'd']);
  const p3 = paginate(items, { sortKey: 'n', limit: 2, after: p2.nextCursor });
  assert.deepEqual(p3.items.map((i) => i.id), ['e']);
  assert.equal(p3.nextCursor, null);
});
