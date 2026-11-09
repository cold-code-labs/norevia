import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MinHeap, heapSort, nSmallest, defaultCompare } from '../src/heap.mjs';

const byP = (a, b) => a.p - b.p;
const drain = (h) => { const out = []; while (h.size) out.push(h.pop()); return out; };
const ids = (xs) => xs.map((x) => x.id).join('');

test('push/pop/peek em ordem crescente', () => {
  const h = new MinHeap();
  for (const x of [5, 3, 8, 1, 9, 2, 7]) h.push(x);
  assert.equal(h.size, 7);
  assert.equal(h.peek(), 1);
  assert.deepEqual(drain(h), [1, 2, 3, 5, 7, 8, 9]);
  assert.equal(h.pop(), undefined);
  assert.equal(h.peek(), undefined);
  assert.equal(defaultCompare('B', 'a'), -1);
});

test('empates saem em ordem de inserção (inclusive itens do construtor)', () => {
  const h = new MinHeap(byP, [{ p: 2, id: 'a' }, { p: 1, id: 'b' }, { p: 2, id: 'c' }, { p: 1, id: 'd' }]);
  h.push({ p: 1, id: 'e' }).push({ p: 2, id: 'f' });
  assert.equal(ids(drain(h)), 'bdeacf');
  assert.throws(() => new MinHeap(5), TypeError);
  assert.throws(() => new MinHeap(byP, 'x'), TypeError);
});

test('replace equivale a pop seguido de push', () => {
  const h = new MinHeap(byP, [{ p: 1, id: 'x' }, { p: 1, id: 'y' }]);
  assert.equal(h.replace({ p: 1, id: 'z' }).id, 'x');
  assert.equal(ids(drain(h)), 'yz');
  const g = new MinHeap(byP, [{ p: 1, id: 'a' }, { p: 2, id: 'b' }, { p: 2, id: 'c' }, { p: 3, id: 'd' }]);
  assert.equal(g.replace({ p: 2, id: 'e' }).id, 'a');
  assert.equal(g.replace({ p: 0, id: 'f' }).id, 'b');
  assert.equal(ids(drain(g)), 'fced');
  const e = new MinHeap();
  assert.equal(e.replace(4), undefined);
  assert.equal(e.size, 1);
});

test('replace repetido mantém FIFO entre iguais', () => {
  const h = new MinHeap(byP, [{ p: 5, id: 'a' }, { p: 5, id: 'b' }, { p: 5, id: 'c' }]);
  const out = [];
  for (const id of ['d', 'e', 'f']) out.push(h.replace({ p: 5, id }).id);
  assert.equal(out.join('') + ids(drain(h)), 'abcdef');
});

test('pushPop equivale a push seguido de pop', () => {
  const h = new MinHeap(byP, [{ p: 2, id: 'a' }, { p: 3, id: 'b' }]);
  assert.equal(h.pushPop({ p: 1, id: 'c' }).id, 'c');
  assert.equal(h.pushPop({ p: 2, id: 'd' }).id, 'a');
  assert.equal(h.pushPop({ p: 9, id: 'e' }).id, 'd');
  assert.equal(ids(drain(h)), 'be');
  assert.equal(new MinHeap().pushPop(3), 3);
});

test('toArray não altera; heapSort estável; nSmallest', () => {
  const h = new MinHeap(byP, [{ p: 3, id: 'a' }, { p: 1, id: 'b' }, { p: 3, id: 'c' }]);
  assert.equal(ids(h.toArray()), 'bac');
  assert.equal(h.size, 3);
  const items = [{ p: 2, id: 'a' }, { p: 1, id: 'b' }, { p: 2, id: 'c' }, { p: 1, id: 'd' }];
  assert.equal(ids(heapSort(items, byP)), 'bdac');
  assert.equal(ids(items), 'abcd');
  assert.deepEqual(nSmallest([4, 1, 3, 2], 2), [1, 2]);
  assert.deepEqual(nSmallest([4, 1], 5), [1, 4]);
  assert.throws(() => nSmallest([1], -1), RangeError);
  h.clear();
  assert.equal(h.size, 0);
});

test('heap construído a partir de array desordenado', () => {
  assert.deepEqual(heapSort([5, 4, 3, 2, 1]), [1, 2, 3, 4, 5]);
  assert.deepEqual(heapSort([9, 8, 7, 1, 2, 3, 6, 5, 4]), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const h = new MinHeap(undefined, [7, 6, 5, 4, 3, 2, 1, 0]);
  assert.equal(h.peek(), 0);
  assert.deepEqual(nSmallest([10, 9, 8, 7, 6, 5], 3), [5, 6, 7]);
});
