import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePath, joinPath, basename, extname } from '../src/url-kit/path.mjs';

test('segmentos vazios e . são descartados', () => {
  assert.equal(normalizePath('/a//b/./c'), '/a/b/c');
  assert.equal(normalizePath('a/./b'), 'a/b');
});
test('.. remove o segmento anterior', () => {
  assert.equal(normalizePath('/a/b/../c'), '/a/c');
  assert.equal(normalizePath('a/b/../../c'), 'c');
});
test('.. acima da raiz absoluta é descartado', () => {
  assert.equal(normalizePath('/../a'), '/a');
  assert.equal(normalizePath('/a/../..'), '/');
});
test('.. iniciais de caminho relativo são mantidos', () => {
  assert.equal(normalizePath('../a'), '../a');
  assert.equal(normalizePath('../../a/b'), '../../a/b');
  assert.equal(normalizePath('a/../../b'), '../b');
  assert.equal(normalizePath('../x/../../y'), '../../y');
});
test('barra final e resultados vazios', () => {
  assert.equal(normalizePath('/a/b/'), '/a/b/');
  assert.equal(normalizePath('a/b/../'), 'a/');
  assert.equal(normalizePath('/'), '/');
  assert.equal(normalizePath(''), '.');
  assert.equal(normalizePath('./'), '.');
});
test('joinPath', () => {
  assert.equal(joinPath('/api/', '/v1', 'users/'), '/api/v1/users/');
  assert.equal(joinPath('a', '', '../b'), 'b');
  assert.equal(joinPath(), '.');
  assert.equal(joinPath('..', '..', 'x'), '../../x');
});
test('basename e extname', () => {
  assert.equal(basename('/a/b/c.txt'), 'c.txt');
  assert.equal(basename('/a/b/'), 'b');
  assert.equal(basename('/'), '');
  assert.equal(extname('/x/archive.tar.gz'), '.gz');
  assert.equal(extname('/x/.env'), '');
  assert.equal(extname('/x/README'), '');
});
