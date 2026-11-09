import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrderedMap } from '../src/ordmap.mjs';

function check(node) {
  if (!node) return { height: 0, size: 0 };
  const left = check(node.left);
  const right = check(node.right);
  assert.ok(Math.abs(left.height - right.height) <= 1, `unbalanced at key ${node.key}`);
  return { height: Math.max(left.height, right.height) + 1, size: left.size + right.size + 1 };
}

test('tree metadata and order statistics remain valid after deletion', () => {
  const map = new OrderedMap();
  for (const key of [2, 30, 27, 19, 38, 33, 15, 13, 32, 0, 18, 29, 16, 21, 37, 31, 17, 14, 25, 24]) map.set(key, key);
  map.delete(37);
  const stats = check(map.toTree());
  assert.equal(stats.size, map.size);
  assert.equal(stats.height, 5);
  assert.deepEqual([...map.keys()], [0, 2, 13, 14, 15, 16, 17, 18, 19, 21, 24, 25, 27, 29, 30, 31, 32, 33, 38]);
  assert.equal(map.rank(20), 9);
  assert.equal(map.select(9), 21);
});
