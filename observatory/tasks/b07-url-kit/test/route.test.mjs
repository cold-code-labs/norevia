import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileRoute, createRouter } from '../src/route.mjs';

test('captures parameters', () => {
  const r = compileRoute('/users/:id/posts/:postId');
  assert.deepEqual(r.names, ['id', 'postId']);
  assert.deepEqual(r.match('/users/42/posts/7'), { id: '42', postId: '7' });
});
test('does not match: missing, empty or differently cased segments', () => {
  const r = compileRoute('/users/:id/posts/:postId');
  assert.equal(r.match('/users/42'), null);
  assert.equal(r.match('/users//posts/7'), null);
  assert.equal(r.match('/Users/42/posts/7'), null);
});
test('trailing slash tolerated', () => {
  assert.deepEqual(compileRoute('/users/:id').match('/users/42/'), { id: '42' });
});
test('special characters of the pattern are literals', () => {
  const v = compileRoute('/api/v1.0/:id');
  assert.equal(v.match('/api/v1x0/7'), null);
  assert.deepEqual(v.match('/api/v1.0/7'), { id: '7' });
  const f = compileRoute('/files/:name.json');
  assert.deepEqual(f.match('/files/report.v2.json'), { name: 'report.v2' });
  assert.equal(f.match('/files/reportxjson'), null);
  assert.deepEqual(compileRoute('/c++/:x').match('/c++/1'), { x: '1' });
});
test('decoded parameters', () => {
  const r = compileRoute('/tags/:tag');
  assert.deepEqual(r.match('/tags/caf%C3%A9%20bar'), { tag: 'café bar' });
  assert.deepEqual(r.match('/tags/%E0'), { tag: '%E0' });
});
test('trailing wildcard', () => {
  assert.deepEqual(compileRoute('/static/*').match('/static/css/app.css'), { '*': 'css/app.css' });
});
test('invalid pattern', () => {
  assert.throws(() => compileRoute('users/:id'), SyntaxError);
});
test('router: first route wins', () => {
  const me = () => 'me';
  const byId = () => 'id';
  const router = createRouter().add('/users/me', me).add('/users/:id', byId);
  assert.deepEqual(router.resolve('/users/me'), { handler: me, params: {} });
  assert.deepEqual(router.resolve('/users/9'), { handler: byId, params: { id: '9' } });
  assert.equal(router.resolve('/x'), null);
});
