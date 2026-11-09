import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, join, relative, dirname, basename, extname } from '../src/posixpath.mjs';

test('normalize: básico e barra final', () => {
  assert.equal(normalize('/a/./b/../c/'), '/a/c/');
  assert.equal(normalize('//a//b'), '/a/b');
  assert.equal(normalize(''), '.');
  assert.equal(normalize('./'), './');
  assert.equal(normalize('a/..'), '.');
  assert.equal(normalize('a/../'), './');
  assert.equal(normalize('/'), '/');
  assert.throws(() => normalize(1), TypeError);
});

test('normalize: .. acima da raiz em caminho absoluto', () => {
  assert.equal(normalize('/../a'), '/a');
  assert.equal(normalize('/a/../../b'), '/b');
  assert.equal(normalize('/..'), '/');
});

test('normalize: .. iniciais em caminho relativo', () => {
  assert.equal(normalize('../../a'), '../../a');
  assert.equal(normalize('a/../../b'), '../b');
  assert.equal(normalize('../a/..'), '..');
  assert.equal(normalize('./../x/./'), '../x/');
  assert.equal(normalize('../../'), '../../');
});

test('join', () => {
  assert.equal(join('a', 'b/', '../c'), 'a/c');
  assert.equal(join('/a', '', 'b'), '/a/b');
  assert.equal(join(), '.');
  assert.equal(join('', ''), '.');
  assert.equal(join('..', '..', 'x'), '../../x');
  assert.throws(() => join('a', 1), TypeError);
});

test('relative', () => {
  assert.equal(relative('/a/b/c', '/a/d'), '../../d');
  assert.equal(relative('/a/b', '/a/b'), '');
  assert.equal(relative('/a/bc', '/a/b'), '../b');
  assert.equal(relative('/', '/x/y'), 'x/y');
  assert.equal(relative('/x/', '/x/y/'), 'y');
  assert.equal(relative('/a/../b', '/b/c'), 'c');
  assert.throws(() => relative('a', '/b'), RangeError);
});

test('dirname, basename, extname', () => {
  assert.equal(dirname('/a/b/'), '/a');
  assert.equal(dirname('a'), '.');
  assert.equal(dirname('/a'), '/');
  assert.equal(dirname('/'), '/');
  assert.equal(dirname('a//b'), 'a');
  assert.equal(basename('/a/b.txt'), 'b.txt');
  assert.equal(basename('/a/b.txt', '.txt'), 'b');
  assert.equal(basename('.txt', '.txt'), '.txt');
  assert.equal(basename('/a/b//'), 'b');
  assert.equal(basename('/'), '');
  assert.equal(extname('a.b.c'), '.c');
  assert.equal(extname('.bashrc'), '');
  assert.equal(extname('.a.b'), '.b');
  assert.equal(extname('a.'), '.');
  assert.equal(extname('..'), '');
  assert.equal(extname('/x.d/file'), '');
});
