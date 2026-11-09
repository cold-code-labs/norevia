import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventStore } from '../src/eventos-projecao/store.mjs';
import { AccountRepository } from '../src/eventos-projecao/snapshot.mjs';

test('read devolve os eventos posteriores a fromVersion', () => {
  const s = new EventStore();
  s.append('c1', [{ type: 'deposited', data: { amount: 500 } }, { type: 'withdrawn', data: { amount: 200 } }], 0);
  s.append('c1', [{ type: 'interest', data: { bps: 50 } }], 2);
  assert.deepEqual(s.read('c1', 1).map((e) => [e.version, e.type]), [[2, 'withdrawn'], [3, 'interest']]);
});

test('repositório executa comandos e recarrega o estado', () => {
  const store = new EventStore();
  const repo = new AccountRepository(store, { snapshotEvery: 2 });
  repo.execute('c', () => [{ type: 'deposited', data: { amount: 10000 } }]);
  repo.execute('c', () => [{ type: 'withdrawn', data: { amount: 3000 } }]);
  repo.execute('c', (st) => (st.balance >= 5000 ? [{ type: 'interest', data: { bps: 200 } }] : []));
  repo.execute('c', () => [{ type: 'withdrawn', data: { amount: 8000 } }]);
  assert.deepEqual(repo.load('c'), { version: 4, state: { balance: 7140, status: 'open', overdraftLimit: 0, rejected: 1 } });
});
