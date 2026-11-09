import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Cluster } from '../src/network.mjs';
import { Replica } from '../src/node.mjs';

test('round-trip: duas réplicas convergem com escritas concorrentes', () => {
  const c = new Cluster(['a', 'b']);
  c.broadcast('a', { type: 'set', key: 'x', value: 1 });
  c.broadcast('b', { type: 'set', key: 'x', value: 2 });
  c.broadcast('a', { type: 'set', key: 'y', value: 'a' });
  c.broadcast('b', { type: 'del', key: 'y' });
  c.deliverAll();
  assert.ok(c.converged());
  const s = c.snapshots();
  assert.deepEqual(s.a.state, s.b.state);
  assert.equal(s.a.clock, 'a:2,b:2');
});

test('mensagens fora de ordem do mesmo remetente esperam no buffer', () => {
  const c = new Cluster(['a', 'b']);
  c.broadcast('a', { type: 'set', key: 'k', value: 1 });
  c.broadcast('a', { type: 'set', key: 'k', value: 2 });
  assert.deepEqual(c.deliver('b', 'a#2'), []);
  assert.deepEqual(c.snapshots().b.pending, ['a#2']);
  assert.deepEqual(c.deliver('b', 'a#1'), ['a#1', 'a#2']);
  assert.deepEqual(c.snapshots().b.state, { k: 2 });
});

test('relógio carregado pelas mensagens', () => {
  const a = new Replica('a');
  const b = new Replica('b');
  const m1 = a.broadcast({ type: 'set', key: 'x', value: 1 });
  assert.deepEqual(m1, { id: 'a#1', from: 'a', vc: { a: 1 }, op: { type: 'set', key: 'x', value: 1 } });
  assert.deepEqual(b.receive(m1), ['a#1']);
  const m2 = b.broadcast({ type: 'set', key: 'x', value: 2 });
  assert.deepEqual(m2.vc, { a: 1, b: 1 });
});
