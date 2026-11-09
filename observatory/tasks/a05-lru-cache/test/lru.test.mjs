import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LRUCache } from '../src/lru.mjs';

test('keys order after update', () => {
  const c = new LRUCache(3);
  c.set('a', 1).set('b', 2).set('c', 3);
  c.set('a', 4);
  assert.deepEqual(c.keys(), ['b', 'c', 'a']);
  assert.equal(c.size, 3);
});

test('onEvict receives the least used after update', () => {
  const evicted = [];
  const c = new LRUCache(2, { onEvict: (k, v) => evicted.push([k, v]) });
  c.set('x', 1).set('y', 2);
  c.set('x', 3);
  c.set('z', 4);
  c.set('w', 5);
  assert.deepEqual(evicted, [['y', 2], ['x', 3]]);
  assert.deepEqual(c.keys(), ['z', 'w']);
});

test('update does not fire onEvict nor change size', () => {
  let calls = 0;
  const c = new LRUCache(2, { onEvict: () => calls++ });
  c.set('a', 1).set('b', 2).set('b', 3).set('a', 4);
  assert.equal(calls, 0);
  assert.equal(c.size, 2);
  assert.deepEqual(c.keys(), ['b', 'a']);
});

test('has and peek do not refresh', () => {
  const c = new LRUCache(2);
  c.set('a', 1).set('b', 2);
  assert.equal(c.has('a'), true);
  assert.equal(c.peek('a'), 1);
  c.set('c', 3);
  assert.equal(c.has('a'), false);
  assert.deepEqual(c.keys(), ['b', 'c']);
});

test('capacity 1', () => {
  const c = new LRUCache(1);
  c.set('a', 1);
  c.set('a', 2);
  assert.equal(c.get('a'), 2);
  c.set('b', 3);
  assert.deepEqual(c.keys(), ['b']);
  assert.equal(c.get('a'), undefined);
});

test('stored undefined value and delete/clear', () => {
  let calls = 0;
  const c = new LRUCache(3, { onEvict: () => calls++ });
  c.set('u', undefined);
  assert.equal(c.has('u'), true);
  assert.equal(c.size, 1);
  c.set('v', 1);
  assert.equal(c.delete('u'), true);
  assert.equal(c.delete('u'), false);
  c.clear();
  assert.equal(c.size, 0);
  assert.equal(calls, 0);
});

test('invalid capacity', () => {
  assert.throws(() => new LRUCache(0), RangeError);
  assert.throws(() => new LRUCache(2.5), RangeError);
  assert.equal(new LRUCache(4).capacity, 4);
});
