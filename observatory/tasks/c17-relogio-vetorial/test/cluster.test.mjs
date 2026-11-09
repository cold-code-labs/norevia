import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Cluster } from '../src/network.mjs';
import { Replica } from '../src/node.mjs';
import { Store, stampWins } from '../src/store.mjs';

const set = (key, value) => ({ type: 'set', key, value });

test('Replica: relógio das mensagens inclui o próprio evento', () => {
  const a = new Replica('a');
  const b = new Replica('b');
  const c = new Replica('c');
  const a1 = a.broadcast(set('x', 1));
  const a2 = a.broadcast(set('x', 2));
  assert.deepEqual([a1.vc, a2.vc, a2.id], [{ a: 1 }, { a: 2 }, 'a#2']);
  b.receive(a1);
  const b1 = b.broadcast(set('y', 1));
  assert.deepEqual(b1.vc, { a: 1, b: 1 });
  assert.deepEqual(c.receive(b1), []);
  assert.deepEqual(c.receive(a2), []);
  assert.deepEqual(c.receive(a1), ['a#1', 'a#2', 'b#1']);
  assert.deepEqual(c.broadcast(set('z', 1)).vc, { a: 2, b: 1, c: 1 });
  assert.deepEqual(c.snapshot(), { id: 'c', clock: 'a:2,b:1,c:1', log: ['a#1', 'a#2', 'b#1', 'c#1'], pending: [], state: { x: 2, y: 1, z: 1 } });
});

test('três réplicas: entrega causal respeita dependências transitivas', () => {
  const c = new Cluster(['a', 'b', 'c']);
  c.broadcast('a', set('saldo', 100));
  c.deliver('b', 'a#1');
  c.broadcast('b', set('saldo', 70));
  assert.deepEqual(c.deliver('c', 'b#1'), []);
  assert.deepEqual(c.snapshots().c.pending, ['b#1']);
  const b1 = c.replica('b').log[1];
  assert.deepEqual(c.duplicate('c', b1), []);
  assert.deepEqual(c.duplicate('c', b1), []);
  assert.deepEqual(c.snapshots().c.pending, ['b#1']);
  assert.deepEqual(c.snapshots().c.state, {});
  assert.deepEqual(c.deliver('c', 'a#1'), ['a#1', 'b#1']);
  assert.deepEqual(c.snapshots().c.state, { saldo: 70 });
  c.deliverAll();
  assert.ok(c.converged());
  assert.deepEqual(c.snapshots().a.log, ['a#1', 'b#1']);
});

test('quatro réplicas: ordem determinística entre concorrentes prontas juntas', () => {
  const c = new Cluster(['a', 'b', 'c', 'd']);
  c.broadcast('a', set('k', 'a'));
  c.deliver('b', 'a#1');
  c.deliver('c', 'a#1');
  c.broadcast('b', set('k', 'b'));
  c.broadcast('c', set('k', 'c'));
  assert.deepEqual(c.deliver('d', 'c#1'), []);
  assert.deepEqual(c.deliver('d', 'b#1'), []);
  assert.deepEqual(c.deliver('d', 'a#1'), ['a#1', 'b#1', 'c#1']);
  assert.deepEqual(c.replica('d').concurrentPairs(), [['b#1', 'c#1']]);
  assert.deepEqual(c.replica('d').causalPast('c#1'), ['a#1']);
  c.deliverAll();
  assert.ok(c.converged());
  const s = c.snapshots();
  assert.deepEqual(s.a.log, ['a#1', 'b#1', 'c#1']);
  assert.deepEqual(s.b.log, ['a#1', 'b#1', 'c#1']);
  assert.deepEqual(s.d.state, { k: 'c' });
  assert.equal(s.d.clock, 'a:1,b:1,c:1');
});

test('concorrência detectada pelos relógios das mensagens', () => {
  const c = new Cluster(['a', 'b']);
  c.broadcast('a', set('x', 1));
  c.broadcast('b', set('x', 2));
  c.broadcast('a', set('x', 3));
  c.deliverAll();
  assert.deepEqual(c.replica('a').concurrentPairs(), [['a#1', 'b#1'], ['a#2', 'b#1']]);
  assert.deepEqual(c.replica('b').concurrentPairs(), [['b#1', 'a#1'], ['b#1', 'a#2']]);
  assert.deepEqual(c.replica('b').causalPast('a#2'), ['a#1']);
  assert.deepEqual(c.replica('a').causalPast('a#1'), []);
  c.broadcast('b', set('x', 4));
  c.deliverAll();
  assert.deepEqual(c.replica('a').causalPast('b#2'), ['a#1', 'a#2', 'b#1']);
  assert.deepEqual(c.replica('b').causalPast('b#1'), []);
  assert.deepEqual(c.snapshots().b.state, { x: 4 });
  assert.throws(() => c.replica('a').causalPast('z#1'), RangeError);
});

test('três réplicas: escritas concorrentes convergem e duplicatas são ignoradas', () => {
  const c = new Cluster(['a', 'b', 'c']);
  const ids = c.run([
    ['bcast', 'a', set('x', 'a1')],
    ['bcast', 'b', set('x', 'b1')],
    ['deliver', 'c', 'b#1'],
    ['bcast', 'c', { type: 'del', key: 'x' }],
    ['deliver', 'a', 'c#1'],
    ['deliver', 'a', 'b#1'],
  ]);
  assert.deepEqual(ids, ['a#1', 'b#1', ['b#1'], 'c#1', [], ['b#1', 'c#1']]);
  assert.deepEqual(c.snapshots().a.state, {});
  const b1 = c.replica('b').log[0];
  assert.deepEqual(c.duplicate('a', b1), []);
  c.deliverAll();
  assert.ok(c.converged());
  assert.deepEqual(c.replica('b').store.writers(), { x: 'c#1' });
  assert.deepEqual(c.snapshots().c.log, ['b#1', 'c#1', 'a#1']);
  assert.throws(() => c.deliver('a', 'b#1'), RangeError);
  assert.throws(() => new Cluster(['a', 'a']), RangeError);
  assert.throws(() => c.replica('q'), RangeError);
});

test('Store: carimbo (peso, remetente)', () => {
  assert.equal(stampWins({ weight: 2, from: 'a' }, { weight: 1, from: 'z' }), true);
  assert.equal(stampWins({ weight: 2, from: 'a' }, { weight: 2, from: 'b' }), false);
  const s = new Store();
  assert.equal(s.apply({ id: 'b#1', from: 'b', vc: { b: 1 }, op: set('k', 1) }), true);
  assert.equal(s.apply({ id: 'a#1', from: 'a', vc: { a: 1 }, op: set('k', 2) }), false);
  assert.equal(s.apply({ id: 'a#2', from: 'a', vc: { a: 2, b: 1 }, op: { type: 'del', key: 'k' } }), true);
  assert.equal(s.get('k'), undefined);
  assert.deepEqual(s.state(), {});
  assert.throws(() => s.apply({ id: 'a#3', from: 'a', vc: { a: 3 }, op: { type: 'inc', key: 'k' } }), RangeError);
});
