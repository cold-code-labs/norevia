import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareKeys, comparePos, maxPos, minPos, formatPos, encodeCursor, decodeCursor, LOW_ID, HIGH_ID } from '../src/keys.mjs';
import { lowerBound, upperBound, insertEntry, splitPoint, splitPage } from '../src/page.mjs';
import { PagedIndex } from '../src/index.mjs';

const E = (s) => s.split(' ').map((t) => { const [key, id] = t.split('#'); return { key, id: Number(id) }; });
const fmt = (es) => es.map(formatPos).join(' ');

test('ordem de chaves e posições', () => {
  assert.equal(compareKeys('a', 'b'), -1);
  assert.equal(compareKeys('b', 'a'), 1);
  assert.equal(compareKeys('', ''), 0);
  assert.equal(compareKeys('B', 'a'), -1);
  assert.equal(comparePos({ key: 'a', id: 9 }, { key: 'b', id: 1 }), -1);
  assert.equal(comparePos({ key: 'b', id: 2 }, { key: 'b', id: 1 }), 1);
  assert.equal(comparePos({ key: 'b', id: LOW_ID }, { key: 'b', id: 1 }), -1);
  assert.equal(comparePos({ key: 'b', id: HIGH_ID }, { key: 'b', id: 1e9 }), 1);
  assert.equal(formatPos(maxPos(null, { key: 'x', id: 2 })), 'x#2');
  assert.equal(formatPos(minPos({ key: 'x', id: 2 }, { key: 'x', id: 1 })), 'x#1');
  assert.throws(() => compareKeys(1, 'a'), TypeError);
});

test('cursores: formato id.chave', () => {
  assert.equal(encodeCursor({ key: 'b', id: 3 }), '3.b');
  assert.equal(encodeCursor({ key: 'v1.2', id: 12 }), '12.v1.2');
  assert.equal(encodeCursor({ key: '', id: 7 }), '7.');
  assert.deepEqual(decodeCursor('12.v1.2'), { key: 'v1.2', id: 12 });
  assert.deepEqual(decodeCursor('3.x.y'), { key: 'x.y', id: 3 });
  assert.deepEqual(decodeCursor('5.'), { key: '', id: 5 });
  for (const bad of ['x', '0.a', '01.a', '.a', 'a.3', '-1.a', '1e3.a']) assert.throws(() => decodeCursor(bad), RangeError, bad);
  assert.throws(() => decodeCursor(5), TypeError);
  assert.throws(() => encodeCursor({ key: 'a', id: 0 }), RangeError);
});

test('lowerBound/upperBound/insertEntry', () => {
  const es = E('a#1 b#2 b#5 c#3');
  assert.equal(lowerBound(es, { key: 'b', id: LOW_ID }), 1);
  assert.equal(upperBound(es, { key: 'b', id: HIGH_ID }), 3);
  assert.equal(lowerBound(es, { key: 'b', id: 5 }), 2);
  assert.equal(upperBound(es, { key: 'b', id: 5 }), 3);
  assert.equal(lowerBound(es, { key: 'd', id: 0 }), 4);
  assert.equal(insertEntry(es, { key: 'b', id: 9 }), 3);
  assert.equal(fmt(es), 'a#1 b#2 b#5 b#9 c#3');
});

test('splitPage: corte em ⌈n/2⌉ mesmo dentro de chaves repetidas', () => {
  assert.equal(splitPoint(E('a#1 a#2 b#3 b#4 c#5')), 3);
  assert.deepEqual(splitPage(E('a#1 a#2 b#3 b#4 c#5')).map(fmt), ['a#1 a#2 b#3', 'b#4 c#5']);
  assert.deepEqual(splitPage(E('k#1 k#2 k#3 k#4')).map(fmt), ['k#1 k#2', 'k#3 k#4']);
  assert.deepEqual(splitPage(E('a#1 b#2 b#3 b#4 b#5 c#6 d#7')).map(fmt), ['a#1 b#2 b#3 b#4', 'b#5 c#6 d#7']);
});

test('layouts dourados após inserções', () => {
  const a = new PagedIndex({ pageCapacity: 4 });
  for (const k of ['a', 'a', 'b', 'b', 'c']) a.insert(k, k);
  assert.deepEqual(a.layout(), [['a#1', 'a#2', 'b#3'], ['b#4', 'c#5']]);
  const b = new PagedIndex({ pageCapacity: 4 });
  for (const k of ['m', 'c', 'x', 'c', 'a', 'c', 'q', 'c', 'z', 'b']) b.insert(k, k);
  assert.deepEqual(b.layout(), [['a#5', 'b#10', 'c#2', 'c#4'], ['c#6', 'c#8'], ['m#1', 'q#7', 'x#3', 'z#9']]);
  const c = new PagedIndex({ pageCapacity: 3 });
  for (const k of ['p', 'p', 'q', 'p', 'q', 'p']) c.insert(k, k);
  assert.deepEqual(c.layout(), EXPECTED_C);
  assert.equal(c.check(), true);
  assert.deepEqual(c.get('p'), ['p', 'p', 'p', 'p']);
});

const EXPECTED_C = [['p#1', 'p#2'], ['p#4', 'p#6'], ['q#3', 'q#5']];
