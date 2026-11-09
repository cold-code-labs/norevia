import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventStore, ConcurrencyError } from '../src/store.mjs';
import { initialState, apply, project } from '../src/project.mjs';
import { takeSnapshot, rebuild, AccountRepository } from '../src/snapshot.mjs';

const dep = (amount) => ({ type: 'deposited', data: { amount } });
const wd = (amount) => ({ type: 'withdrawn', data: { amount } });
const GOLD_EVENTS = [
  dep(10000), { type: 'interest', data: { bps: 100 } }, wd(5000), { type: 'limitSet', data: { limit: 2000 } },
  wd(7000), { type: 'interest', data: { bps: 100 } }, { type: 'frozen' }, wd(100), dep(1000), { type: 'unfrozen' }, wd(1200),
];
const GOLD_STATE = { balance: -900, status: 'open', overdraftLimit: 2000, rejected: 2 };

function goldStore() {
  const store = new EventStore();
  store.append('acc', GOLD_EVENTS.slice(0, 4), 0);
  store.append('acc', GOLD_EVENTS.slice(4), 4);
  return store;
}

test('store: versões e leitura em ordem crescente', () => {
  const store = goldStore();
  assert.equal(store.version('acc'), 11);
  assert.equal(store.version('outra'), 0);
  const all = store.read('acc');
  assert.deepEqual(all.map((e) => e.version), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.deepEqual(all[2], { streamId: 'acc', version: 3, type: 'withdrawn', data: { amount: 5000 } });
  assert.deepEqual(store.read('acc', 8).map((e) => [e.version, e.type]), [[9, 'deposited'], [10, 'unfrozen'], [11, 'withdrawn']]);
  assert.deepEqual(store.read('acc', 11), []);
  assert.deepEqual(store.read('acc', 50), []);
  assert.deepEqual(store.read('nada'), []);
});

test('store: concorrência otimista e validação', () => {
  const store = goldStore();
  assert.throws(() => store.append('acc', [dep(1)], 10), (e) => e instanceof ConcurrencyError && e.expected === 10 && e.actual === 11);
  assert.throws(() => store.append('novo', [dep(1)], 1), ConcurrencyError);
  assert.equal(store.append('novo', [dep(1), dep(2)], 0), 2);
  assert.throws(() => store.append('acc', [], 11), TypeError);
  assert.throws(() => store.append('acc', [{ data: {} }], 11), TypeError);
  assert.throws(() => store.read('acc', -1), RangeError);
  assert.deepEqual(store.streamIds(), ['acc', 'novo']);
});

test('projeção: sequência dourada (a ordem importa)', () => {
  assert.deepEqual(project(GOLD_EVENTS), GOLD_STATE);
  assert.deepEqual(project(GOLD_EVENTS.slice(0, 3)), { balance: 5100, status: 'open', overdraftLimit: 0, rejected: 0 });
});

test('projeção: regras de cada evento e imutabilidade', () => {
  const init = initialState();
  assert.deepEqual(init, { balance: 0, status: 'open', overdraftLimit: 0, rejected: 0 });
  assert.deepEqual(project([dep(300), wd(500)], init), { balance: 300, status: 'open', overdraftLimit: 0, rejected: 1 });
  assert.deepEqual(init, initialState());
  assert.deepEqual(project([dep(1000), { type: 'closed' }, dep(5), wd(5)]), { balance: 1000, status: 'closed', overdraftLimit: 0, rejected: 2 });
  assert.deepEqual(project([{ type: 'limitSet', data: { limit: 100 } }, wd(100), { type: 'interest', data: { bps: 5000 } }]).balance, -100);
  assert.deepEqual(project([{ type: 'frozen' }, { type: 'closed' }, { type: 'unfrozen' }]).status, 'closed');
  assert.deepEqual(apply({ ...init, balance: 999 }, { type: 'interest', data: { bps: 100 } }).balance, 1008);
  assert.throws(() => apply(init, { type: 'teleported' }), /teleported/);
  assert.throws(() => apply(init, dep(0)), TypeError);
  assert.deepEqual(project([], { ...GOLD_STATE }), GOLD_STATE);
});

test('snapshot: takeSnapshot do stream dourado', () => {
  const store = goldStore();
  assert.deepEqual(takeSnapshot(store, 'acc'), { streamId: 'acc', version: 11, state: GOLD_STATE });
  assert.deepEqual(takeSnapshot(store, 'vazio'), { streamId: 'vazio', version: 0, state: initialState() });
});

test('snapshot: rebuild a partir de um snapshot antigo', () => {
  const store = goldStore();
  const old = { streamId: 'acc', version: 4, state: { balance: 5100, status: 'open', overdraftLimit: 2000, rejected: 0 } };
  assert.deepEqual(rebuild(store, old), { streamId: 'acc', version: 11, state: GOLD_STATE });
  const now = { streamId: 'acc', version: 11, state: GOLD_STATE };
  assert.deepEqual(rebuild(store, now), now);
});

test('snapshot: rebuild de snapshot recente após novos eventos', () => {
  const store = goldStore();
  const snap = takeSnapshot(store, 'acc');
  store.append('acc', [dep(5000), { type: 'interest', data: { bps: 1000 } }], 11);
  assert.deepEqual(rebuild(store, snap), { streamId: 'acc', version: 13, state: { ...GOLD_STATE, balance: 4510 } });
  assert.deepEqual(rebuild(store, snap), takeSnapshot(store, 'acc'));
});

test('repositório: snapshots periódicos', () => {
  const store = new EventStore();
  const repo = new AccountRepository(store, { snapshotEvery: 3 });
  assert.equal(repo.execute('c', () => [dep(1000)]), 1);
  assert.equal(repo.execute('c', () => [dep(2000)]), 2);
  assert.equal(repo.execute('c', () => [wd(500)]), 3);
  assert.equal(repo.snapshotOf('c'), null);
  assert.deepEqual(repo.load('c'), { version: 3, state: { balance: 2500, status: 'open', overdraftLimit: 0, rejected: 0 } });
  assert.deepEqual(repo.snapshotOf('c'), { streamId: 'c', version: 3, state: { balance: 2500, status: 'open', overdraftLimit: 0, rejected: 0 } });
  assert.equal(repo.execute('c', () => [{ type: 'interest', data: { bps: 1000 } }]), 4);
  assert.equal(repo.load('c').version, 4);
  assert.equal(repo.snapshotOf('c').version, 3);
  store.append('c', [{ type: 'frozen' }, wd(100)], 4);
  assert.deepEqual(repo.load('c'), { version: 6, state: { balance: 2750, status: 'frozen', overdraftLimit: 0, rejected: 1 } });
  assert.equal(repo.snapshotOf('c').version, 6);
});

test('repositório: conflito de escrita e comando sem eventos', () => {
  const store = goldStore();
  const repo = new AccountRepository(store);
  assert.equal(repo.execute('acc', () => []), 11);
  assert.throws(
    () => repo.execute('acc', () => { store.append('acc', [dep(1)], store.version('acc')); return [wd(1)]; }),
    (e) => e instanceof ConcurrencyError && e.expected === 11 && e.actual === 12,
  );
  assert.equal(store.version('acc'), 12);
  assert.deepEqual(repo.load('acc'), { version: 12, state: { ...GOLD_STATE, balance: -899 } });
});

test('repositório: carregar com snapshots dá o mesmo que projetar tudo', () => {
  const store = new EventStore();
  const repos = [1, 2, 5].map((n) => new AccountRepository(store, { snapshotEvery: n }));
  const script = [dep(800), { type: 'limitSet', data: { limit: 300 } }, wd(1000), wd(200), { type: 'interest', data: { bps: 300 } }, dep(700), { type: 'interest', data: { bps: 250 } }, { type: 'frozen' }, wd(50), { type: 'unfrozen' }, wd(1300), wd(300)];
  script.forEach((e, i) => {
    store.append('z', [e], i);
    const full = takeSnapshot(store, 'z');
    assert.equal(full.version, i + 1);
    for (const r of repos) assert.deepEqual(r.load('z'), { version: i + 1, state: full.state });
  });
  assert.deepEqual(repos[0].load('z').state, { balance: 212, status: 'open', overdraftLimit: 300, rejected: 3 });
});
