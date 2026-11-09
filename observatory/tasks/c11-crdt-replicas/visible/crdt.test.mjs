import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Replica } from '../src/replica.mjs';
import { encodeState, decodeState, parseStamp } from '../src/codec.mjs';
import { formatStamp } from '../src/clock.mjs';

test('round-trip: duas réplicas sincronizadas e encode → decode → encode', () => {
  const a = new Replica('a');
  const b = new Replica('b');
  a.set('cor', 'azul');
  a.add('x');
  a.add('y');
  b.set('n', 3);
  b.add('z');
  b.delete('tmp');
  a.syncWith(b);
  a.remove('y');
  a.set('cor', 'verde');
  b.syncWith(a);
  assert.deepEqual(a.keys(), ['cor', 'n']);
  assert.deepEqual(b.keys(), a.keys());
  assert.deepEqual(b.values(), ['x', 'z']);
  assert.equal(b.get('cor'), 'verde');
  const text = encodeState(a.snapshot());
  assert.equal(encodeState(b.snapshot()), text);
  assert.equal(encodeState(decodeState(text)), text);
  const c = Replica.fromSnapshot('c', decodeState(text));
  assert.deepEqual(c.values(), a.values());
  assert.equal(c.get('n'), 3);
});

test('carimbos no formato <contador>@<réplica>', () => {
  assert.equal(formatStamp({ c: 12, r: 'b' }), '12@b');
  assert.deepEqual(parseStamp('12@b'), { c: 12, r: 'b' });
});

test('lê estado exportado por outra equipe', () => {
  const snap = decodeState('{"map":{"cor":["3@b","verde"],"velho":["2@a"]},"set":{"x":["1@a","2@b"]},"tombs":{"y":["1@b"]},"vv":{"a":2,"b":3}}');
  const r = Replica.fromSnapshot('c', snap);
  assert.equal(r.get('cor'), 'verde');
  assert.equal(r.has('velho'), false);
  assert.deepEqual(r.tags('x'), ['1@a', '2@b']);
  assert.equal(r.contains('y'), false);
  assert.equal(r.clock, 3);
  assert.equal(r.set('k', 1), '4@c');
});
