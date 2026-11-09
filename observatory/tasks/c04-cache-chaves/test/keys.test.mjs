import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entityKey, queryKey, resourceOf, encodeValue } from '../src/keys.mjs';

test('entityKey: formato e codificação', () => {
  assert.equal(entityKey('user', 42), 'user:42');
  assert.equal(entityKey('doc', 'a/b c'), 'doc:a%2Fb%20c');
  assert.equal(encodeValue(['x y', null, 3]), 'x%20y,,3');
});

test('queryKey: ordenação, omissão de undefined, null e arrays', () => {
  assert.equal(queryKey('user', { role: 'admin', page: 2 }), 'user?page=2&role=admin');
  assert.equal(queryKey('user'), 'user?');
  assert.equal(queryKey('post', { tags: ['a b', 'c'], q: undefined, author: null }), 'post?author=&tags=a%20b,c');
  assert.equal(queryKey('post', { Z: 1, a: 'é&=' }), 'post?Z=1&a=%C3%A9%26%3D');
});

test('validações e resourceOf', () => {
  assert.throws(() => entityKey('User', 1), TypeError);
  assert.throws(() => entityKey('user', ''), TypeError);
  assert.throws(() => queryKey('user', []), TypeError);
  assert.equal(resourceOf('users?x=1'), 'users');
  assert.equal(resourceOf('user:7'), 'user');
});
