import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deepMerge, mergeAll } from '../src/config-kit/merge.mjs';

test('mescla objetos aninhados', () => {
  assert.deepEqual(deepMerge({ db: { host: 'a', port: 1 }, x: 1 }, { db: { port: 2 } }), { db: { host: 'a', port: 2 }, x: 1 });
});
test('arrays são substituídos', () => {
  assert.deepEqual(deepMerge({ list: [1, 2] }, { list: [3] }), { list: [3] });
});
test('undefined é ignorado; null substitui', () => {
  assert.deepEqual(deepMerge({ a: 1, b: 2 }, { a: undefined, b: null }), { a: 1, b: null });
});
test('valores falsy substituem', () => {
  assert.deepEqual(
    deepMerge({ debug: true, retries: 3, name: 'x' }, { debug: false, retries: 0, name: '' }),
    { debug: false, retries: 0, name: '' },
  );
});
test('não altera nem compartilha as entradas', () => {
  const base = { a: { b: 1 }, l: [1] };
  const ov = { c: { d: 2 } };
  const r = deepMerge(base, ov);
  r.a.b = 9;
  r.c.d = 9;
  r.l.push(2);
  assert.deepEqual(base, { a: { b: 1 }, l: [1] });
  assert.deepEqual(ov, { c: { d: 2 } });
});
test('objeto x não-objeto', () => {
  assert.deepEqual(deepMerge({ a: 1 }, { a: { b: 1 } }), { a: { b: 1 } });
  assert.deepEqual(deepMerge({ a: { b: 1 } }, { a: 5 }), { a: 5 });
});
test('mergeAll ignora camadas nulas', () => {
  assert.deepEqual(mergeAll({ a: 1 }, null, { b: { c: 1 } }, undefined, { b: { d: 2 } }), { a: 1, b: { c: 1, d: 2 } });
  assert.deepEqual(mergeAll(), {});
});
