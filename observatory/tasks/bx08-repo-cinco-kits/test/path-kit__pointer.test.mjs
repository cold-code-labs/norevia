import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePointer, formatPointer, escapeToken, getAt, hasAt, covers } from '../src/path-kit/pointer.mjs';

test('parsePointer: raiz, tokens vazios e erros', () => {
  assert.deepEqual(parsePointer(''), []);
  assert.deepEqual(parsePointer('/'), ['']);
  assert.deepEqual(parsePointer('/a//b'), ['a', '', 'b']);
  assert.throws(() => parsePointer('a/b'), SyntaxError);
  assert.throws(() => parsePointer(null), TypeError);
});

test('parsePointer: ordem de decodificação e escapes inválidos', () => {
  assert.deepEqual(parsePointer('/~01'), ['~1']);
  assert.deepEqual(parsePointer('/~10'), ['/0']);
  assert.throws(() => parsePointer('/a~2'), SyntaxError);
  assert.throws(() => parsePointer('/a~'), SyntaxError);
});

test('formatPointer e escapeToken', () => {
  assert.equal(formatPointer(['a/b', '~c', 0]), '/a~1b/~0c/0');
  assert.equal(formatPointer([]), '');
  assert.equal(escapeToken('~/'), '~0~1');
  const toks = ['~1', '/~', ''];
  assert.deepEqual(parsePointer(formatPointer(toks)), toks);
});

test('getAt em objetos e arrays', () => {
  const doc = { a: { b: [10, 20, { c: null }] }, '': 1, 'x/y': 2 };
  assert.equal(getAt(doc, '/a/b/1'), 20);
  assert.equal(getAt(doc, '/a/b/0'), 10);
  assert.equal(getAt(doc, '/a/b/2/c', 'F'), null);
  assert.equal(getAt(doc, ''), doc);
  assert.equal(getAt(doc, '/'), 1);
  assert.equal(getAt(doc, '/x~1y'), 2);
  assert.equal(getAt(doc, '/a/z', 'F'), 'F');
  assert.equal(getAt(doc, '/a/b/0/x', 'F'), 'F');
  assert.equal(getAt({}, '/toString', 'F'), 'F');
});

test('índices de array: só decimais canônicos dentro do tamanho', () => {
  const doc = { xs: [10, 20, 30] };
  for (const bad of ['01', '00', '-', '3', '1.0', ' 1', '-1', '1e0', '']) {
    assert.equal(getAt(doc, '/xs/' + bad, 'F'), 'F', bad);
  }
  assert.equal(getAt(doc, '/xs/2'), 30);
});

test('hasAt', () => {
  assert.equal(hasAt({ u: undefined }, '/u'), true);
  assert.equal(hasAt({}, '/toString'), false);
  assert.equal(hasAt([1, 2], '/01'), false);
  assert.equal(hasAt([1, 2], '/1'), true);
  assert.equal(hasAt(5, ''), true);
});

test('covers compara por tokens', () => {
  assert.equal(covers('/a', '/a/b'), true);
  assert.equal(covers('/a', '/a'), true);
  assert.equal(covers('/a', '/ab'), false);
  assert.equal(covers('', '/x'), true);
  assert.equal(covers('/a~1b', '/a/b/c'), false);
  assert.equal(covers('/a/b', '/a'), false);
});
