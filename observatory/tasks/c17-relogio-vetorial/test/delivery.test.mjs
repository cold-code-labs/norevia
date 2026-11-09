import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DeliveryBuffer, isReady, isDelivered, validateMessage } from '../src/delivery.mjs';

const msg = (id, from, vc) => ({ id, from, vc, op: { type: 'set', key: 'k', value: id } });

test('isReady e isDelivered', () => {
  assert.equal(isReady({ a: 1 }, msg('b#1', 'b', { a: 1, b: 1 })), true);
  assert.equal(isReady({}, msg('b#1', 'b', { a: 1, b: 1 })), false);
  assert.equal(isReady({ a: 1 }, msg('b#2', 'b', { b: 2 })), false);
  assert.equal(isReady({ a: 1 }, msg('b#1', 'b', { b: 1, c: 1 })), false);
  assert.equal(isReady({ a: 1, c: 1 }, msg('b#1', 'b', { b: 1, c: 1 })), true);
  assert.equal(isReady({ b: 1 }, msg('b#1', 'b', { b: 1 })), false);
  assert.equal(isDelivered({ b: 1 }, msg('b#1', 'b', { b: 1 })), true);
  assert.equal(isDelivered({ b: 1 }, msg('b#2', 'b', { b: 2 })), false);
  assert.equal(isDelivered({}, msg('b#1', 'b', { b: 1 })), false);
  assert.throws(() => validateMessage(null), TypeError);
  assert.throws(() => validateMessage({ id: 'x', from: 'B', vc: {} }), RangeError);
});

test('DeliveryBuffer: espera dependências de terceiros', () => {
  const buf = new DeliveryBuffer('c');
  assert.deepEqual(buf.receive(msg('b#1', 'b', { a: 1, b: 1 })), []);
  assert.deepEqual(buf.pendingIds(), ['b#1']);
  assert.deepEqual(buf.receive(msg('a#1', 'a', { a: 1 })).map((m) => m.id), ['a#1', 'b#1']);
  assert.deepEqual(buf.clock, { a: 1, b: 1 });
  assert.deepEqual(buf.stamp(), { a: 1, b: 1, c: 1 });
  assert.deepEqual(buf.receive(msg('a#1', 'a', { a: 1 })), []);
  assert.throws(() => buf.receive(msg('c#9', 'c', { c: 9 })), RangeError);
});

test('DeliveryBuffer: prontas ao mesmo tempo saem em ordem de remetente', () => {
  const buf = new DeliveryBuffer('d');
  assert.deepEqual(buf.receive(msg('c#1', 'c', { a: 1, c: 1 })), []);
  assert.deepEqual(buf.receive(msg('b#1', 'b', { a: 1, b: 1 })), []);
  assert.deepEqual(buf.receive(msg('b#1', 'b', { a: 1, b: 1 })), []);
  assert.deepEqual(buf.pendingIds(), ['b#1', 'c#1']);
  assert.deepEqual(buf.receive(msg('a#1', 'a', { a: 1 })).map((m) => m.id), ['a#1', 'b#1', 'c#1']);
  assert.deepEqual(buf.pendingIds(), []);
  assert.deepEqual(buf.clock, { a: 1, b: 1, c: 1 });
});
