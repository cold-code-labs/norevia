import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PagedIndex } from '../src/index.mjs';
import { range } from '../src/range.mjs';
import { collect } from '../src/paginate.mjs';

const WORDS = ['kiwi', 'uva', 'caju', 'pera', 'figo', 'lima', 'manga', 'jaca', 'acai', 'goiaba', 'banana', 'cacau', 'maca', 'amora', 'tamara', 'pitanga', 'coco', 'mamao', 'limao', 'caqui'];
const fmt = (es) => es.map((e) => `${e.key}#${e.id}`);
const byPos = (a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : a.id - b.id);

test('collect percorre o índice inteiro nos dois sentidos', () => {
  for (const pageCapacity of [2, 3, 4, 7]) {
    const ix = new PagedIndex({ pageCapacity });
    const all = [];
    for (const w of WORDS) all.push({ key: w, id: ix.insert(w, w.length), value: w.length });
    all.sort(byPos);
    for (const pageSize of [1, 2, 3, 5, 50]) {
      assert.deepEqual(fmt(collect(ix, { pageSize })), fmt(all), JSON.stringify({ pageCapacity, pageSize }));
      assert.deepEqual(fmt(collect(ix, { pageSize, reverse: true })), fmt(all).reverse());
    }
  }
});

test('range com limites de chave', () => {
  const ix = new PagedIndex({ pageCapacity: 3 });
  for (const w of WORDS) ix.insert(w, null);
  assert.deepEqual(range(ix, { gt: 'caju', lte: 'figo' }).map((e) => e.key), ['caqui', 'coco', 'figo']);
  assert.deepEqual(range(ix, { gte: 'p', reverse: true, limit: 2 }).map((e) => e.key), ['uva', 'tamara']);
});

test('layout dourado de páginas após inserções', () => {
  const ix = new PagedIndex({ pageCapacity: 4 });
  for (const k of ['a', 'a', 'b', 'b', 'c']) ix.insert(k, k);
  assert.deepEqual(ix.layout(), [['a#1', 'a#2', 'b#3'], ['b#4', 'c#5']]);
});
