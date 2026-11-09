import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyPatch, PatchError, deepEqual, get } from '../src/path-kit/patch.mjs';

const fails = (doc, ops, index) => assert.throws(() => applyPatch(doc, ops), (e) => e instanceof PatchError && e.name === 'PatchError' && e.index === index);

test('add em objetos, arrays e raiz', () => {
  assert.deepEqual(applyPatch({ a: 1 }, [{ op: 'add', path: ['a'], value: 2 }, { op: 'add', path: ['b'], value: 3 }]), { a: 2, b: 3 });
  assert.deepEqual(applyPatch({ xs: [1, 3] }, [{ op: 'add', path: ['xs', 1], value: 2 }]), { xs: [1, 2, 3] });
  assert.deepEqual(applyPatch({ xs: [1] }, [{ op: 'add', path: ['xs', 1], value: 2 }, { op: 'add', path: ['xs', '-'], value: 3 }]), { xs: [1, 2, 3] });
  assert.deepEqual(applyPatch({ a: 1 }, [{ op: 'add', path: [], value: [9] }]), [9]);
  fails({ xs: [1] }, [{ op: 'test', path: ['xs'], value: [1] }, { op: 'add', path: ['xs', 3], value: 0 }], 1);
  fails({ xs: [1] }, [{ op: 'add', path: ['xs', '0'], value: 0 }], 0);
  fails({ a: 1 }, [{ op: 'add', path: ['a', 'b'], value: 0 }], 0);
});

test('remove e replace', () => {
  assert.deepEqual(applyPatch({ a: 1, b: 2 }, [{ op: 'remove', path: ['a'] }]), { b: 2 });
  assert.deepEqual(applyPatch({ xs: [1, 2, 3] }, [{ op: 'remove', path: ['xs', 1] }]), { xs: [1, 3] });
  assert.deepEqual(applyPatch({ xs: [1, 2] }, [{ op: 'replace', path: ['xs', 0], value: 'x' }]), { xs: ['x', 2] });
  assert.equal(applyPatch({ a: 1 }, [{ op: 'replace', path: [], value: 7 }]), 7);
  fails({ a: 1 }, [{ op: 'remove', path: ['z'] }], 0);
  fails({ a: 1 }, [{ op: 'replace', path: ['z'], value: 1 }], 0);
  fails({ a: 1 }, [{ op: 'remove', path: [] }], 0);
  fails({ xs: [1] }, [{ op: 'remove', path: ['xs', '-'] }], 0);
});

test('a entrada nunca é alterada e subárvores intactas são compartilhadas', () => {
  const doc = { xs: [1, 2, 3], meta: { n: 1 }, outra: [4] };
  const snap = structuredClone(doc);
  const out = applyPatch(doc, [
    { op: 'remove', path: ['xs', 0] },
    { op: 'add', path: ['meta', 'm'], value: 2 },
    { op: 'replace', path: ['xs', 0], value: 9 },
  ]);
  assert.deepEqual(out, { xs: [9, 3], meta: { n: 1, m: 2 }, outra: [4] });
  assert.deepEqual(doc, snap);
  assert.equal(out.outra, doc.outra);
});

test('patch que falha não deixa efeitos na entrada', () => {
  const doc = { xs: ['a', 'b'] };
  fails(doc, [{ op: 'remove', path: ['xs', 0] }, { op: 'test', path: ['xs'], value: [] }], 1);
  assert.deepEqual(doc, { xs: ['a', 'b'] });
});

test('move e copy', () => {
  assert.deepEqual(applyPatch({ xs: [1, 2, 3] }, [{ op: 'move', from: ['xs', 0], path: ['xs', '-'] }]), { xs: [2, 3, 1] });
  assert.deepEqual(applyPatch({ a: { v: 1 }, b: {} }, [{ op: 'move', from: ['a', 'v'], path: ['b', 'w'] }]), { a: {}, b: { w: 1 } });
  assert.deepEqual(applyPatch({ a: 1 }, [{ op: 'move', from: ['a'], path: ['a'] }]), { a: 1 });
  fails({ a: { b: 1 } }, [{ op: 'move', from: ['a'], path: ['a', 'c'] }], 0);
  fails({ a: 1 }, [{ op: 'move', from: ['z'], path: ['b'] }], 0);
  const doc = { src: { k: [1] }, dst: [] };
  const out = applyPatch(doc, [{ op: 'copy', from: ['src'], path: ['dst', 0] }]);
  assert.deepEqual(out, { src: { k: [1] }, dst: [{ k: [1] }] });
  assert.deepEqual(doc.dst, []);
});

test('test e deepEqual', () => {
  const doc = { a: { x: 1, y: [1, { z: null }] } };
  assert.equal(applyPatch(doc, [{ op: 'test', path: ['a'], value: { y: [1, { z: null }], x: 1 } }]), doc);
  assert.equal(applyPatch(doc, []), doc);
  fails(doc, [{ op: 'test', path: ['a', 'y'], value: { 0: 1, 1: { z: null } } }], 0);
  assert.equal(deepEqual([1], { 0: 1 }), false);
  assert.equal(deepEqual({ a: undefined }, { b: undefined }), false);
  assert.equal(deepEqual(null, {}), false);
  assert.equal(deepEqual('1', 1), false);
});

test('erros gerais e get', () => {
  assert.throws(() => applyPatch({}, null), TypeError);
  fails({}, [{ op: 'mover', path: [] }], 0);
  fails({}, [{ op: 'add', path: 'a', value: 1 }], 0);
  assert.equal(get({ xs: [{ a: 5 }] }, ['xs', 0, 'a']), 5);
  assert.equal(get({ xs: [] }, ['xs', 0], 'F'), 'F');
  assert.equal(get({}, ['toString'], 'F'), 'F');
});
