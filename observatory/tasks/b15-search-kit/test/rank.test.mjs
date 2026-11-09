import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createIndex, idf, score, search, K1, B } from '../src/rank.mjs';

const DOCS = [
  { id: 'd1', terms: ['gato', 'preto', 'gato'] },
  { id: 'd2', terms: ['gato'] },
  { id: 'd3', terms: ['cachorro', 'preto', 'grande', 'bravo'] },
];
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-12, `${a} != ${b}`);

test('idf segue a fórmula com +1 dentro do logaritmo', () => {
  const ix = createIndex(DOCS);
  close(idf(ix, 'gato'), Math.log(1 + (3 - 2 + 0.5) / (2 + 0.5)));
  close(idf(ix, 'bravo'), Math.log(1 + (3 - 1 + 0.5) / (1 + 0.5)));
  close(idf(ix, 'peixe'), Math.log(8));
});

test('score BM25 com k1 = 1,2 e b = 0,75', () => {
  assert.equal(K1, 1.2);
  assert.equal(B, 0.75);
  const ix = createIndex(DOCS);
  const avg = 8 / 3;
  const part = (f, dl, df) => Math.log(1 + (3 - df + 0.5) / (df + 0.5)) * (f * 2.2) / (f + 1.2 * (0.25 + 0.75 * dl / avg));
  close(score(ix, 'd1', ['gato', 'preto']), part(2, 3, 2) + part(1, 3, 2));
  close(score(ix, 'd3', ['gato', 'preto']), part(1, 4, 2));
  assert.equal(score(ix, 'd2', ['peixe']), 0);
  assert.throws(() => score(ix, 'zz', ['gato']), RangeError);
});

test('termos repetidos na consulta contam uma vez', () => {
  const ix = createIndex(DOCS);
  assert.equal(score(ix, 'd1', ['gato', 'gato', 'preto']), score(ix, 'd1', ['gato', 'preto']));
});

test('search ordena por pontuação e omite documentos sem pontuação', () => {
  const ix = createIndex(DOCS);
  assert.deepEqual(search(ix, ['gato', 'preto']).map((h) => h.id), ['d1', 'd2', 'd3']);
  assert.deepEqual(search(ix, ['bravo']).map((h) => h.id), ['d3']);
  assert.deepEqual(search(ix, []), []);
  assert.deepEqual(search(createIndex([]), ['x']), []);
});

test('empates por id em ordem crescente de código (<)', () => {
  const docs = ['b', 'B', 'a', '10', '9'].map((id) => ({ id, terms: ['x', 'y'] }));
  docs.push({ id: 'z', terms: ['y'] });
  const ix = createIndex(docs);
  assert.deepEqual(search(ix, ['x']).map((h) => h.id), ['10', '9', 'B', 'a', 'b']);
  assert.deepEqual(search(ix, ['x'], { limit: 3 }).map((h) => h.id), ['10', '9', 'B']);
});

test('limit', () => {
  const ix = createIndex(DOCS);
  assert.deepEqual(search(ix, ['gato', 'preto'], { limit: 2 }).map((h) => h.id), ['d1', 'd2']);
  assert.deepEqual(search(ix, ['gato'], { limit: 0 }), []);
  assert.throws(() => search(ix, ['gato'], { limit: 1.5 }), RangeError);
  assert.throws(() => search(ix, ['gato'], { limit: -1 }), RangeError);
});

test('createIndex valida ids e não altera a entrada', () => {
  assert.throws(() => createIndex([{ id: 'a', terms: [] }, { id: 'a', terms: ['x'] }]), Error);
  assert.throws(() => createIndex([{ id: 1, terms: [] }]), TypeError);
  const docs = JSON.parse(JSON.stringify(DOCS));
  const ix = createIndex(docs);
  docs[0].terms.push('peixe');
  assert.deepEqual(docs.slice(1), DOCS.slice(1));
  assert.equal(ix.size, 3);
  assert.equal(search(ix, ['peixe']).length, 0);
});
