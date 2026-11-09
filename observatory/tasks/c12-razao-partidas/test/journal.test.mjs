import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createJournal, post, reverse, getEntry } from '../src/journal.mjs';
import { checkIntegrity } from '../src/ledger.mjs';

const CHART = { caixa: 'ativo', capital: 'patrimonio', vendas: 'receita', aluguel: 'despesa', 'aluguel-loja': 'despesa', 'aluguel-escritorio': 'despesa', arredondamento: 'despesa' };

test('post: convenção de sinais (débito +, crédito -), inclusive valores negativos', () => {
  const j = createJournal(CHART);
  assert.deepEqual(post(j, { date: '2026-01-05', memo: 'venda', lines: [{ account: 'caixa', debit: '250.40' }, { account: 'vendas', credit: '250.40' }] }),
    { id: 1, date: '2026-01-05', memo: 'venda', lines: [{ account: 'caixa', amount: 25040 }, { account: 'vendas', amount: -25040 }] });
  assert.deepEqual(post(j, { date: '2026-01-07', memo: 'devolucao parcial', lines: [{ account: 'caixa', debit: '-12.05' }, { account: 'vendas', credit: '-12.05' }] }).lines,
    [{ account: 'caixa', amount: -1205 }, { account: 'vendas', amount: 1205 }]);
  assert.deepEqual(post(j, { date: '2026-01-08', lines: [{ account: 'caixa', debit: '-0.30' }, { account: 'caixa', debit: '10.00' }, { account: 'vendas', credit: '9.70' }] }).lines,
    [{ account: 'caixa', amount: -30 }, { account: 'caixa', amount: 1000 }, { account: 'vendas', amount: -970 }]);
  assert.throws(() => post(j, { date: '2026-01-08', lines: [{ account: 'caixa', debit: '10.00' }, { account: 'caixa', debit: '-2.05' }, { account: 'vendas', credit: '7.94' }] }), RangeError);
  assert.throws(() => post(j, { date: '2026-01-08', lines: [{ account: 'caixa', debit: '1.00' }, { account: 'nada', credit: '1.00' }] }), RangeError);
  assert.throws(() => post(j, { date: '2026-01-08', lines: [{ account: 'caixa', debit: '0.00' }, { account: 'vendas', credit: '0.00' }] }), RangeError);
  assert.throws(() => post(j, { date: '2026-01-08', lines: [{ account: 'caixa', debit: '1.00', credit: '1.00' }, { account: 'vendas', credit: '1.00' }] }), RangeError);
  assert.throws(() => post(j, { date: '8/1/2026', lines: [{ account: 'caixa', debit: '1.00' }, { account: 'vendas', credit: '1.00' }] }), RangeError);
  assert.deepEqual(checkIntegrity(j), []);
});

test('post com câmbio: arredondamento bancário por linha e resíduo', () => {
  const j = createJournal(CHART);
  assert.deepEqual(post(j, { date: '2026-01-10', memo: 'fx', rate: '0.5', lines: [{ account: 'aluguel', debit: '0.07' }, { account: 'caixa', credit: '0.07' }] }).lines,
    [{ account: 'aluguel', amount: 4 }, { account: 'caixa', amount: -4 }]);
  assert.deepEqual(post(j, { date: '2026-01-11', rate: '0.5', lines: [{ account: 'aluguel', debit: '0.03' }, { account: 'aluguel', debit: '0.03' }, { account: 'caixa', credit: '0.06' }] }).lines,
    [{ account: 'aluguel', amount: 2 }, { account: 'aluguel', amount: 2 }, { account: 'caixa', amount: -3 }, { account: 'arredondamento', amount: -1 }]);
  assert.deepEqual(post(j, { date: '2026-01-12', rate: '0.1', lines: [{ account: 'aluguel', debit: '0.35' }, { account: 'caixa', credit: '0.35' }] }).lines,
    [{ account: 'aluguel', amount: 4 }, { account: 'caixa', amount: -4 }]);
  assert.deepEqual(post(j, { date: '2026-01-12', rate: '5.4321', lines: [{ account: 'caixa', debit: '10.05' }, { account: 'vendas', credit: '10.05' }] }).lines,
    [{ account: 'caixa', amount: 5459 }, { account: 'vendas', amount: -5459 }]);
  assert.deepEqual(checkIntegrity(j), []);
  const k = createJournal({ caixa: 'ativo', aluguel: 'despesa' });
  assert.throws(() => post(k, { date: '2026-01-11', rate: '0.5', lines: [{ account: 'aluguel', debit: '0.03' }, { account: 'aluguel', debit: '0.03' }, { account: 'caixa', credit: '0.06' }] }), RangeError);
});

test('post com rateio e estorno', () => {
  const j = createJournal(CHART);
  const e = post(j, { date: '2026-01-09', memo: 'aluguel', lines: [{ split: { 'aluguel-loja': 2, 'aluguel-escritorio': 1 }, debit: '-0.10' }, { account: 'caixa', credit: '-0.10' }] });
  assert.deepEqual(e.lines, [{ account: 'aluguel-loja', amount: -7 }, { account: 'aluguel-escritorio', amount: -3 }, { account: 'caixa', amount: 10 }]);
  const r = reverse(j, 1, '2026-01-20');
  assert.deepEqual(r, { id: 2, date: '2026-01-20', memo: 'estorno #1', lines: [{ account: 'aluguel-loja', amount: 7 }, { account: 'aluguel-escritorio', amount: 3 }, { account: 'caixa', amount: -10 }], reverses: 1 });
  assert.equal(getEntry(j, 1).reversedBy, 2);
  assert.throws(() => reverse(j, 1, '2026-01-21'), Error);
  assert.throws(() => reverse(j, 2, '2026-01-21'), Error);
  assert.throws(() => reverse(j, 9, '2026-01-21'), RangeError);
  const f = post(j, { date: '2026-01-21', rate: '0.5', lines: [{ split: { 'aluguel-loja': 1, 'aluguel-escritorio': 1 }, debit: '0.07' }, { account: 'caixa', credit: '0.07' }] });
  assert.deepEqual(f.lines, [{ account: 'aluguel-loja', amount: 2 }, { account: 'aluguel-escritorio', amount: 2 }, { account: 'caixa', amount: -4 }]);
  const s = post(j, { date: '2026-01-21', lines: [{ split: { 'aluguel-loja': 1, 'aluguel-escritorio': 2 }, debit: '1.00' }, { account: 'caixa', credit: '1.00' }] });
  assert.deepEqual(s.lines, [{ account: 'aluguel-loja', amount: 33 }, { account: 'aluguel-escritorio', amount: 67 }, { account: 'caixa', amount: -100 }]);
  const g = post(j, { date: '2026-01-22', rate: '0.5', lines: [{ split: { 'aluguel-loja': 1, 'aluguel-escritorio': 1 }, debit: '0.06' }, { account: 'caixa', credit: '0.06' }] });
  assert.deepEqual(g.lines, [{ account: 'aluguel-loja', amount: 2 }, { account: 'aluguel-escritorio', amount: 1 }, { account: 'caixa', amount: -3 }]);
  const h = post(j, { date: '2026-01-23', rate: '0.5', lines: [{ split: { 'aluguel-loja': 1, 'aluguel-escritorio': 1 }, credit: '0.06' }, { account: 'caixa', debit: '0.06' }] });
  assert.deepEqual(h.lines, [{ account: 'aluguel-loja', amount: -2 }, { account: 'aluguel-escritorio', amount: -1 }, { account: 'caixa', amount: 3 }]);
});
