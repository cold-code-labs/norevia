import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LRUCache } from '../src/lru.mjs';

test('get refreshes the key', () => {
  const c = new LRUCache(2);
  c.set('a', 1).set('b', 2);
  c.get('a');
  c.set('c', 3);
  assert.equal(c.has('a'), true);
  assert.equal(c.has('b'), false);
});

test('updating a value refreshes the key', () => {
  const c = new LRUCache(2);
  c.set('a', 1).set('b', 2);
  c.set('a', 10);
  c.set('c', 3);
  assert.equal(c.get('a'), 10);
  assert.equal(c.has('b'), false);
});
