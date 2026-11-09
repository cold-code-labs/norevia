import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TtlCache } from '../src/cache-chaves/cache.mjs';
import { MemoryStore, Repository } from '../src/cache-chaves/repo.mjs';

function setup(ttlSeconds = 30) {
  const c = { t: 0 };
  const cache = new TtlCache({ now: () => c.t });
  const store = new MemoryStore([
    { id: 1, name: 'Ana', role: 'admin', active: true },
    { id: 2, name: 'Bia', role: 'admin', active: false },
    { id: 3, name: 'Caio', role: 'user', active: true },
  ]);
  const repo = new Repository({ resource: 'user', store, cache, ttlSeconds });
  return { c, cache, store, repo };
}

test('repo: leituras ficam em cache por exatamente ttlSeconds', () => {
  const { c, store, repo } = setup(30);
  repo.get(1);
  repo.get(1);
  assert.equal(store.calls.get, 1);
  c.t = 29_999;
  repo.get(1);
  assert.equal(store.calls.get, 1);
  c.t = 30_000;
  repo.get(1);
  assert.equal(store.calls.get, 2);
});

test('repo: update invalida a entidade e as consultas do recurso', () => {
  const { store, repo } = setup();
  assert.deepEqual(repo.list({ role: 'admin' }).map((r) => r.id), [1, 2]);
  assert.equal(repo.list({}).length, 3);
  assert.equal(repo.get(2).role, 'admin');
  repo.update(2, { role: 'user' });
  assert.deepEqual(repo.list({ role: 'admin' }).map((r) => r.id), [1]);
  assert.deepEqual(repo.list({ role: 'user' }).map((r) => r.id), [2, 3]);
  assert.equal(repo.get(2).role, 'user');
  assert.equal(store.calls.list, 4);
});

test('repo: update preserva no cache as outras entidades', () => {
  const { store, repo } = setup();
  repo.get(1);
  repo.get(3);
  repo.update(1, { name: 'Ana Maria' });
  assert.equal(repo.get(3).name, 'Caio');
  assert.equal(store.calls.get, 2);
  assert.equal(repo.get(1).name, 'Ana Maria');
  assert.equal(store.calls.get, 3);
});

test('repo: grava sob as chaves canônicas', () => {
  const { cache, repo } = setup();
  repo.list({ role: 'admin', active: true });
  repo.get(3);
  assert.deepEqual(cache.keys(), ['user?active=true&role=admin', 'user:3']);
});

test('repo: recursos de nome parecido no mesmo cache não interferem', () => {
  const { cache, repo } = setup();
  const teamStore = new MemoryStore([{ id: 1, name: 'Equipe' }]);
  const users = new Repository({ resource: 'users', store: teamStore, cache, ttlSeconds: 30 });
  users.list({});
  users.get(1);
  repo.list({});
  repo.update(1, { active: false });
  users.list({});
  users.get(1);
  assert.equal(teamStore.calls.list, 1);
  assert.equal(teamStore.calls.get, 1);
});

test('repo: registro inexistente não é cacheado', () => {
  const { store, repo } = setup();
  assert.equal(repo.get(99), undefined);
  assert.equal(repo.get(99), undefined);
  assert.equal(store.calls.get, 2);
});
