import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrderedMap } from '../src/ordmap.mjs';

test('deletion retraces height changes through ancestors', () => {
  const map = new OrderedMap();
  for (const key of [2, 30, 27, 19, 38, 33, 15, 13, 32, 0, 18, 29, 16, 21, 37, 31, 17, 14, 25, 24]) map.set(key, key);
  assert.equal(map.delete(37), true);
  assert.equal(map.height(), 5);
  assert.equal(map.size, 19);
});
