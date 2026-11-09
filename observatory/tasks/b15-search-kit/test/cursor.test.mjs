import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeCursor, decodeCursor, paginate, collectAll } from '../src/cursor.mjs';

const ITEMS = [{ id: 'a', p: 3 }, { id: 'b', p: 1 }, { id: 'c', p: 3 }, { id: 'd', p: 2 }];
const ids = (r) => r.items.map((i) => i.id);

test('cursor: base64url sem padding, ida e volta', () => {
  assert.equal(encodeCursor({ s: 'p', d: 'asc', k: 2, id: 'd' }), 'eyJzIjoicCIsImQiOiJhc2MiLCJrIjoyLCJpZCI6ImQifQ');
  const v = { s: 'p', d: 'asc', k: 'ç?>', id: 'é' };
  const c = encodeCursor(v);
  assert.match(c, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(decodeCursor(c), v);
});

test('decodeCursor rejeita cursores malformados', () => {
  for (const bad of ['', 'abc=', 'ab+c', 'ab/c', 'a', 'e30 ', encodeCursor([1]), encodeCursor(null), encodeCursor('x'), 'bm90IGpzb24']) {
    assert.throws(() => decodeCursor(bad), RangeError, JSON.stringify(bad));
  }
  assert.throws(() => decodeCursor(42), RangeError);
});

test('última página exata não devolve cursor', () => {
  const p1 = paginate(ITEMS, { sortKey: 'p', limit: 2 });
  assert.deepEqual(ids(p1), ['b', 'd']);
  assert.equal(p1.nextCursor, encodeCursor({ s: 'p', d: 'asc', k: 2, id: 'd' }));
  const p2 = paginate(ITEMS, { sortKey: 'p', limit: 2, after: p1.nextCursor });
  assert.deepEqual(ids(p2), ['a', 'c']);
  assert.equal(p2.nextCursor, null);
  assert.equal(paginate(ITEMS, { sortKey: 'p', limit: 4 }).nextCursor, null);
  assert.equal(paginate(ITEMS, { sortKey: 'p', limit: 10 }).nextCursor, null);
});

test('desc: chave decrescente, id ainda crescente', () => {
  const p1 = paginate(ITEMS, { sortKey: 'p', limit: 2, direction: 'desc' });
  assert.deepEqual(ids(p1), ['a', 'c']);
  const p2 = paginate(ITEMS, { sortKey: 'p', limit: 2, direction: 'desc', after: p1.nextCursor });
  assert.deepEqual(ids(p2), ['d', 'b']);
  assert.equal(p2.nextCursor, null);
});

test('keyset: continua depois da posição do cursor mesmo com mudanças', () => {
  const p1 = paginate(ITEMS, { sortKey: 'p', limit: 2 });
  const changed = [{ id: 'e', p: 1 }, { id: 'a', p: 3 }, { id: 'c', p: 3 }, { id: 'f', p: 2 }, { id: 'b', p: 1 }];
  const p2 = paginate(changed, { sortKey: 'p', limit: 5, after: p1.nextCursor });
  assert.deepEqual(ids(p2), ['f', 'a', 'c']);
  assert.equal(p2.nextCursor, null);
});

test('validação e imutabilidade', () => {
  assert.throws(() => paginate(ITEMS, { sortKey: 'p', limit: 0 }), RangeError);
  assert.throws(() => paginate(ITEMS, { sortKey: 'p', direction: 'up' }), RangeError);
  assert.throws(() => paginate(ITEMS, { limit: 2 }), TypeError);
  const c = paginate(ITEMS, { sortKey: 'p', limit: 1 }).nextCursor;
  assert.throws(() => paginate(ITEMS, { sortKey: 'id', limit: 1, after: c }), RangeError);
  assert.throws(() => paginate(ITEMS, { sortKey: 'p', limit: 1, after: c, direction: 'desc' }), RangeError);
  const copy = JSON.parse(JSON.stringify(ITEMS));
  paginate(ITEMS, { sortKey: 'p', limit: 3 });
  assert.deepEqual(ITEMS, copy);
});

test('collectAll devolve tudo na ordem, sem repetir', () => {
  assert.deepEqual(collectAll(ITEMS, { sortKey: 'p', limit: 1 }).map((i) => i.id), ['b', 'd', 'a', 'c']);
  assert.deepEqual(collectAll(ITEMS, { sortKey: 'p', limit: 3, direction: 'desc' }).map((i) => i.id), ['a', 'c', 'd', 'b']);
  assert.deepEqual(collectAll([], { sortKey: 'p' }), []);
});
