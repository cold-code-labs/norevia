import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PriorityQueue } from '../src/priority-queue.mjs';

test('numbers come out in ascending order; push returns the size', () => {
  const q = new PriorityQueue();
  assert.equal(q.push(5), 1);
  for (const x of [1, 4, 2, 3]) q.push(x);
  assert.equal(q.size, 5);
  assert.equal(q.peek(), 1);
  assert.deepEqual(q.drain(), [1, 2, 3, 4, 5]);
  assert.equal(q.size, 0);
});
test('empty queue', () => {
  const q = new PriorityQueue();
  assert.equal(q.pop(), undefined);
  assert.equal(q.peek(), undefined);
});
test('custom comparator', () => {
  const q = new PriorityQueue((a, b) => b - a);
  for (const x of [3, 9, 1, 7]) q.push(x);
  assert.deepEqual(q.drain(), [9, 7, 3, 1]);
});
test('ties come out in insertion order', () => {
  const q = new PriorityQueue((a, b) => a.p - b.p);
  for (const [name, p] of [['a1', 2], ['b', 1], ['a2', 2], ['c', 1], ['a3', 2]]) q.push({ name, p });
  assert.deepEqual(q.drain().map((e) => e.name), ['b', 'c', 'a1', 'a2', 'a3']);
});
test('FIFO ties with interleaved pops', () => {
  const q = new PriorityQueue((a, b) => a.p - b.p);
  q.push({ name: 'x', p: 1 });
  q.push({ name: 'y', p: 1 });
  assert.equal(q.pop().name, 'x');
  q.push({ name: 'z', p: 1 });
  assert.equal(q.pop().name, 'y');
  assert.equal(q.pop().name, 'z');
});
test('many elements', () => {
  const q = new PriorityQueue();
  for (let i = 0; i < 100; i++) q.push((i * 37) % 100);
  assert.deepEqual(q.drain(), Array.from({ length: 100 }, (_, i) => i));
});
