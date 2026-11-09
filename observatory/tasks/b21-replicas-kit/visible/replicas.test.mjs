import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LFUCache } from '../src/lfu.mjs';
import { merge, mapMerge, mapToObject } from '../src/lww.mjs';

test('LFU eviction breaks a frequency tie by least recent use', () => {
  const cache = new LFUCache(2);
  cache.set('old', 1);
  cache.set('new', 2);
  assert.equal(cache.set('third', 3), 'old');
  assert.equal(cache.has('old'), false);
  assert.equal(cache.get('new'), 2);
});

test('LWW uses the greater replica id to break equal timestamps', () => {
  assert.deepEqual(merge({ value: 'a', ts: 7, replica: 'a' }, { value: 'z', ts: 7, replica: 'z' }), { value: 'z', ts: 7, replica: 'z' });
  const left = new Map([['key', { value: 'left', ts: 3, replica: 'a' }]]);
  const right = new Map([['key', { value: 'right', ts: 3, replica: 'z' }]]);
  assert.deepEqual(mapToObject(mapMerge(left, right)), { key: 'right' });
});
