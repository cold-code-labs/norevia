import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queryKey } from '../src/keys.mjs';
import { TtlCache } from '../src/cache.mjs';
import { MemoryStore, Repository } from '../src/repo.mjs';

test('queryKey segue o formato canônico', () => {
  assert.equal(queryKey('user', { role: 'admin', page: 2 }), 'user?page=2&role=admin');
});

test('update invalida listas em cache', () => {
  const store = new MemoryStore([{ id: 1, role: 'admin' }, { id: 2, role: 'admin' }]);
  const repo = new Repository({ resource: 'user', store, cache: new TtlCache({ now: () => 0 }) });
  assert.equal(repo.list({ role: 'admin' }).length, 2);
  repo.update(2, { role: 'guest' });
  assert.deepEqual(repo.list({ role: 'admin' }), [{ id: 1, role: 'admin' }]);
});
