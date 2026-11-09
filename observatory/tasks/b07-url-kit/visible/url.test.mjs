import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuery } from '../src/query.mjs';
import { normalizePath } from '../src/path.mjs';
import { compileRoute } from '../src/route.mjs';

test('search for \"c++ tutorial\"', () => {
  assert.deepEqual(parseQuery('?q=c%2B%2B+tutorial'), { q: 'c++ tutorial' });
});
test('normalizePath', () => {
  assert.equal(normalizePath('/a/./b/../c'), '/a/c');
});
test('version with a dot in the route is literal', () => {
  assert.equal(compileRoute('/api/v1.0/:id').match('/api/v1x0/7'), null);
});
