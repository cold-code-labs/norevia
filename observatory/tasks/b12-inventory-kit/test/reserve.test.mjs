import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ReservationBook } from '../src/reserve.mjs';

test('reserve cria e é idempotente enquanto ativa', () => {
  const book = new ReservationBook();
  const a = book.reserve({ key: 'k', sku: 'cafe', qty: 2, now: 0 });
  assert.deepEqual(a, { key: 'k', sku: 'cafe', qty: 2, createdAt: 0, expiresAt: 900, created: true });
  const b = book.reserve({ key: 'k', sku: 'cha', qty: 7, now: 899, ttl: 5000 });
  assert.deepEqual(b, { ...a, created: false });
  assert.equal(book.size, 1);
});

test('no instante expiresAt a reserva já expirou e a chave pode ser recriada', () => {
  const book = new ReservationBook({ defaultTtl: 60 });
  book.reserve({ key: 'k', sku: 'cafe', qty: 2, now: 100 });
  assert.notEqual(book.get('k', 159), null);
  assert.equal(book.get('k', 160), null);
  const again = book.reserve({ key: 'k', sku: 'cafe', qty: 5, now: 160 });
  assert.equal(again.created, true);
  assert.equal(again.qty, 5);
  assert.equal(again.expiresAt, 220);
});

test('release: true só para reserva ativa; sempre remove', () => {
  const book = new ReservationBook({ defaultTtl: 10 });
  book.reserve({ key: 'a', sku: 's', qty: 1, now: 0 });
  book.reserve({ key: 'b', sku: 's', qty: 1, now: 0 });
  assert.equal(book.release('a', 9), true);
  assert.equal(book.release('a', 9), false);
  assert.equal(book.release('b', 10), false);
  assert.equal(book.size, 0);
  assert.equal(book.release('nunca', 0), false);
});

test('reservedQty soma apenas reservas ativas do sku', () => {
  const book = new ReservationBook({ defaultTtl: 30 });
  book.reserve({ key: '1', sku: 'cafe', qty: 2, now: 0 });
  book.reserve({ key: '2', sku: 'cafe', qty: 3, now: 10 });
  book.reserve({ key: '3', sku: 'cha', qty: 4, now: 10 });
  assert.equal(book.reservedQty('cafe', 29), 5);
  assert.equal(book.reservedQty('cafe', 30), 3);
  assert.equal(book.reservedQty('cafe', 40), 0);
  assert.equal(book.reservedQty('cha', 39), 4);
});

test('extend prorroga sem encurtar; inativa → false', () => {
  const book = new ReservationBook({ defaultTtl: 100 });
  book.reserve({ key: 'k', sku: 's', qty: 1, now: 0 });
  assert.equal(book.extend('k', 50, 10), true);
  assert.equal(book.get('k', 50).expiresAt, 100);
  assert.equal(book.extend('k', 50, 80), true);
  assert.equal(book.get('k', 50).expiresAt, 130);
  assert.equal(book.extend('k', 130, 10), false);
  assert.equal(book.extend('x', 0), false);
});

test('purge remove expiradas na ordem de criação; recriar move a chave para o fim', () => {
  const book = new ReservationBook({ defaultTtl: 10 });
  book.reserve({ key: 'a', sku: 's', qty: 1, now: 0 });
  book.reserve({ key: 'b', sku: 's', qty: 1, now: 0 });
  book.reserve({ key: 'c', sku: 's', qty: 1, now: 5 });
  book.reserve({ key: 'a', sku: 's', qty: 1, now: 12 });
  assert.deepEqual(book.purge(15), ['b', 'c']);
  assert.deepEqual(book.purge(22), ['a']);
  assert.equal(book.size, 0);
});

test('validações e cópias defensivas', () => {
  assert.throws(() => new ReservationBook({ defaultTtl: 0 }), RangeError);
  const book = new ReservationBook();
  assert.throws(() => book.reserve({ key: '', sku: 's', qty: 1, now: 0 }), TypeError);
  assert.throws(() => book.reserve({ key: 'k', sku: 's', qty: 0, now: 0 }), RangeError);
  assert.throws(() => book.reserve({ key: 'k', sku: 's', qty: 1, now: 0, ttl: 0 }), RangeError);
  assert.throws(() => book.reserve({ key: 'k', sku: 's', qty: 1, now: 1.5 }), TypeError);
  const r = book.reserve({ key: 'k', sku: 's', qty: 1, now: 0 });
  r.qty = 99;
  book.get('k', 1).qty = 50;
  assert.equal(book.reservedQty('s', 1), 1);
});
