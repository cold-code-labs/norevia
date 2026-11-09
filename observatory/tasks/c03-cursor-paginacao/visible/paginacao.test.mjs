import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listPage, createEndpoint } from '../src/server.mjs';
import { fetchAll } from '../src/client.mjs';

const DATA = [
  { id: 'a1', score: 90 }, { id: 'b2', score: 75 }, { id: 'c3', score: 90 }, { id: 'd4', score: 60 },
  { id: 'e5', score: 75 }, { id: 'f6', score: 75 }, { id: 'g7', score: 40 }, { id: 'h8', score: 60 },
];

test('paginar de 3 em 3 devolve o mesmo que uma página única', async () => {
  const all = await fetchAll(createEndpoint(DATA), { limit: 3 });
  assert.deepEqual(all, listPage(DATA, { limit: 100 }).items);
});

test('primeira página segue a ordem canônica', () => {
  assert.deepEqual(listPage(DATA, { limit: 3 }).items.map((it) => it.id), ['a1', 'c3', 'b2']);
});
