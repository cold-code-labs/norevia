import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuery } from '../src/url-kit/query.mjs';
import { normalizePath } from '../src/url-kit/path.mjs';
import { compileRoute } from '../src/url-kit/route.mjs';

test('busca por "c++ tutorial"', () => {
  assert.deepEqual(parseQuery('?q=c%2B%2B+tutorial'), { q: 'c++ tutorial' });
});
test('normalizePath', () => {
  assert.equal(normalizePath('/a/./b/../c'), '/a/c');
});
test('versão com ponto na rota é literal', () => {
  assert.equal(compileRoute('/api/v1.0/:id').match('/api/v1x0/7'), null);
});
