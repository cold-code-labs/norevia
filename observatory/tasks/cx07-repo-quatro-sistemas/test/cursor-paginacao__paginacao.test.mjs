import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortItems, rankOf, compareItems } from '../src/cursor-paginacao/order.mjs';
import { encodeCursor, decodeCursor, compareToKey } from '../src/cursor-paginacao/cursor.mjs';
import { listPage, createEndpoint } from '../src/cursor-paginacao/server.mjs';
import { fetchAll, iteratePages, findFirst } from '../src/cursor-paginacao/client.mjs';

const DATA = [
  { id: 'a1', score: 90 }, { id: 'b2', score: 75 }, { id: 'c3', score: 90 }, { id: 'd4', score: 60 },
  { id: 'e5', score: 75 }, { id: 'f6', score: 75 }, { id: 'g7', score: 40 }, { id: 'h8', score: 60 },
];
const ids = (xs) => xs.map((it) => it.id);

function bigData() {
  const out = [];
  for (let i = 0; i < 40; i++) out.push({ id: `ag${String((i * 17) % 40).padStart(2, '0')}`, score: (i * 7) % 5 });
  return out;
}

test('ordem canônica: score decrescente, id crescente', () => {
  assert.deepEqual(ids(sortItems(DATA)), ['a1', 'c3', 'b2', 'e5', 'f6', 'd4', 'h8', 'g7']);
  assert.equal(rankOf(DATA, 'e5'), 4);
  assert.equal(rankOf(DATA, 'zz'), 0);
  assert.ok(compareItems({ id: 'b', score: 1 }, { id: 'a', score: 2 }) > 0);
  assert.ok(compareItems({ id: 'a', score: 1 }, { id: 'b', score: 1 }) < 0);
});

test('cursor: tokens dourados e validação', () => {
  assert.equal(encodeCursor({ id: 'b2', score: 75 }), 'Wzc1LCJiMiJd');
  assert.equal(encodeCursor({ id: 'x', score: -1.5 }), 'Wy0xLjUsIngiXQ');
  assert.deepEqual(decodeCursor('WzYwLCJkNCJd'), { score: 60, id: 'd4' });
  assert.throws(() => decodeCursor('não é cursor'), SyntaxError);
  assert.throws(() => decodeCursor(encodeCursor({ id: '', score: 1 })), SyntaxError);
});

test('compareToKey: posição relativa à chave', () => {
  const key = { score: 75, id: 'b2' };
  assert.ok(compareToKey({ id: 'e5', score: 75 }, key) > 0);
  assert.ok(compareToKey({ id: 'a1', score: 90 }, key) < 0);
  assert.ok(compareToKey({ id: 'd4', score: 60 }, key) > 0);
  assert.equal(compareToKey({ id: 'b2', score: 75 }, key), 0);
  assert.ok(compareToKey({ id: 'b2', score: 75 }, { score: 75, id: 'c9' }) < 0);
});

test('listPage: as três páginas douradas', () => {
  const p1 = listPage(DATA, { limit: 3 });
  assert.deepEqual([ids(p1.items), p1.nextCursor], [['a1', 'c3', 'b2'], 'Wzc1LCJiMiJd']);
  const p2 = listPage(DATA, { limit: 3, cursor: 'Wzc1LCJiMiJd' });
  assert.deepEqual([ids(p2.items), p2.nextCursor], [['e5', 'f6', 'd4'], 'WzYwLCJkNCJd']);
  const p3 = listPage(DATA, { limit: 3, cursor: 'WzYwLCJkNCJd' });
  assert.deepEqual([ids(p3.items), p3.nextCursor], [['h8', 'g7'], null]);
});

test('listPage: cursor de item que não existe mais', () => {
  // [75, "z9"] fica entre f6 e d4 na ordem canônica
  const p = listPage(DATA, { limit: 3, cursor: 'Wzc1LCJ6OSJd' });
  assert.deepEqual([ids(p.items), p.nextCursor], [['d4', 'h8', 'g7'], null]);
});

test('cliente: segue nextCursor de um endpoint qualquer', async () => {
  const pages = {
    start: { items: [{ id: 1 }, { id: 2 }], nextCursor: 'p2' },
    p2: { items: [{ id: 3 }, { id: 4 }], nextCursor: 'p3' },
    p3: { items: [{ id: 5 }], nextCursor: null },
  };
  const queries = [];
  const fetchPage = async (q) => { queries.push(q); return pages[q.cursor ?? 'start']; };
  assert.deepEqual(await fetchAll(fetchPage, { limit: 2 }), [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]);
  assert.deepEqual(queries, [{ limit: 2, cursor: null }, { limit: 2, cursor: 'p2' }, { limit: 2, cursor: 'p3' }]);
});

test('iteratePages: páginas cheias, índices e número de chamadas', async () => {
  const ep = createEndpoint(DATA);
  const got = [];
  for await (const page of iteratePages(ep, { limit: 3 })) got.push([page.index, ids(page.items)]);
  assert.deepEqual(got, [[0, ['a1', 'c3', 'b2']], [1, ['e5', 'f6', 'd4']], [2, ['h8', 'g7']]]);
  assert.equal(ep.calls, 3);
});

test('integração: limit 1 percorre tudo com uma chamada por item', async () => {
  const ep = createEndpoint(DATA);
  assert.deepEqual(ids(await fetchAll(ep, { limit: 1 })), ['a1', 'c3', 'b2', 'e5', 'f6', 'd4', 'h8', 'g7']);
  assert.equal(ep.calls, 8);
});

test('integração: paginar equivale a uma página única (vários limites)', async () => {
  const single = listPage(DATA, { limit: 100 }).items;
  for (const limit of [2, 3, 5, 8, 20]) {
    assert.deepEqual(await fetchAll(createEndpoint(DATA), { limit }), single, `limit=${limit}`);
  }
});

test('integração: muitos empates, entrada embaralhada', async () => {
  const data = bigData();
  const single = listPage(data, { limit: 100 }).items;
  assert.equal(single.length, 40);
  for (const limit of [3, 7]) {
    assert.deepEqual(await fetchAll(createEndpoint(data), { limit }), single, `limit=${limit}`);
  }
});

test('findFirst para de buscar ao encontrar', async () => {
  const ep = createEndpoint(DATA);
  const hit = await findFirst(ep, (it) => it.score < 70, { limit: 3 });
  assert.deepEqual(hit, { id: 'd4', score: 60 });
  assert.equal(ep.calls, 2);
});

test('erros de limit, cursor e laço de cursores', async () => {
  for (const limit of [0, 101, 2.5]) assert.throws(() => listPage(DATA, { limit }), RangeError);
  assert.throws(() => listPage(DATA, { limit: 3, cursor: '!!' }), SyntaxError);
  const loop = async () => ({ items: [{ id: 1 }], nextCursor: 'mesmo' });
  await assert.rejects(fetchAll(loop, { limit: 1 }), /cursor repetido/);
});
