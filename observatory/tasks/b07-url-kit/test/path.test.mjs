import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePath, joinPath, basename, extname } from '../src/path.mjs';

test('empty segments and . are discarded', () => {
  assert.equal(normalizePath('/a//b/./c'), '/a/b/c');
  assert.equal(normalizePath('a/./b'), 'a/b');
});
test('.. removes the previous segment', () => {
  assert.equal(normalizePath('/a/b/../c'), '/a/c');
  assert.equal(normalizePath('a/b/../../c'), 'c');
});
test('.. above the absolute root is discarded', () => {
  assert.equal(normalizePath('/../a'), '/a');
  assert.equal(normalizePath('/a/../..'), '/');
});
test('leading .. of a relative path are kept', () => {
  assert.equal(normalizePath('../a'), '../a');
  assert.equal(normalizePath('../../a/b'), '../../a/b');
  assert.equal(normalizePath('a/../../b'), '../b');
  assert.equal(normalizePath('../x/../../y'), '../../y');
});
test('trailing slash and empty results', () => {
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
test('basename and extname', () => {
  assert.equal(basename('/a/b/c.txt'), 'c.txt');
  assert.equal(basename('/a/b/'), 'b');
  assert.equal(basename('/'), '');
  assert.equal(extname('/x/archive.tar.gz'), '.gz');
  assert.equal(extname('/x/.env'), '');
  assert.equal(extname('/x/README'), '');
});
