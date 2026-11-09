import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LFUCache } from '../src/lfu.mjs';
import { merge, mapDelete, mapMerge, mapHas } from '../src/lww.mjs';
import { createSet, add, remove, mergeSets, values } from '../src/orset.mjs';
import { createCounter, increment, decrement, mergeCounters, value } from '../src/pncounter.mjs';
import { mergeClocks, compareClocks, causalSort } from '../src/vclock.mjs';

test('LFU buckets preserve the oldest entry when frequencies tie', () => {
  const cache = new LFUCache(3);
  cache.set('a', 1); cache.set('b', 2); cache.get('b'); cache.set('c', 3);
  assert.equal(cache.set('d', 4), 'a');
});

test('LWW merge is deterministic for equal timestamps', () => {
  assert.deepEqual(merge({ value: 1, ts: 5, replica: 'm' }, { value: 2, ts: 5, replica: 'n' }), { value: 2, ts: 5, replica: 'n' });
  const map = mapDelete(new Map([['x', { value: 1, ts: 1, replica: 'a' }]]), 'x', 2, 'b');
  assert.equal(mapHas(map, 'x'), false);
});

test('OR-Set preserves a concurrent add when another replica removes its old tag', () => {
  const a = add(createSet('a'), 'item');
  const b = add(createSet('b'), 'item');
  assert.deepEqual(values(mergeSets(remove(a, 'item'), b)), ['item']);
});

test('PN-counter merge takes component-wise maxima', () => {
  const left = increment(createCounter(), 'a', 3);
  const right = decrement(createCounter(), 'b', 1);
  assert.equal(value(mergeCounters(left, right)), 2);
});

test('vector-clock order accounts for components absent from the left clock', () => {
  assert.deepEqual(mergeClocks({ a: 2 }, { b: 1 }), { a: 2, b: 1 });
  assert.equal(compareClocks({ a: 1 }, { b: 1 }), 'concurrent');
  assert.deepEqual(causalSort([{ id: 'b', clock: { a: 1, b: 1 } }, { id: 'a', clock: { a: 1 } }]).map((e) => e.id), ['a', 'b']);
});
