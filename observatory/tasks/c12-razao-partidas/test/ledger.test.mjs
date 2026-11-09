import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createJournal, post } from '../src/journal.mjs';
import { balanceOf, trialBalance, statement, incomeStatement, checkIntegrity, entriesBetween } from '../src/ledger.mjs';
import { closePeriod } from '../src/closing.mjs';

const CHART = { caixa: 'ativo', banco: 'ativo', fornecedores: 'passivo', capital: 'patrimonio', lucros: 'patrimonio', vendas: 'receita', descontos: 'receita', aluguel: 'despesa' };

function scenario() {
  const j = createJournal(CHART);
  post(j, { date: '2026-02-01', memo: 'aporte', lines: [{ account: 'caixa', debit: '1000.00' }, { account: 'capital', credit: '1000.00' }] });
  post(j, { date: '2026-02-03', memo: 'venda', lines: [{ account: 'caixa', debit: '250.40' }, { account: 'vendas', credit: '250.40' }] });
  post(j, { date: '2026-02-05', memo: 'devolucao parcial', lines: [{ account: 'caixa', debit: '-12.05' }, { account: 'vendas', credit: '-12.05' }] });
  post(j, { date: '2026-02-06', memo: 'desconto concedido', lines: [{ account: 'descontos', debit: '15.35' }, { account: 'caixa', credit: '15.35' }] });
  post(j, { date: '2026-02-07', memo: 'cheque especial', lines: [{ account: 'aluguel', debit: '300.25' }, { account: 'banco', credit: '300.25' }] });
  return j;
}

test('balanceOf: sinal natural por tipo de conta', () => {
  const j = scenario();
  assert.equal(balanceOf(j, 'caixa'), 122300);
  assert.equal(balanceOf(j, 'vendas'), 23835);
  assert.equal(balanceOf(j, 'descontos'), -1535);
  assert.equal(balanceOf(j, 'banco'), -30025);
  assert.equal(balanceOf(j, 'capital'), 100000);
  assert.equal(balanceOf(j, 'caixa', { from: '2026-02-04', to: '2026-02-05' }), -1205);
  assert.ok(Object.is(balanceOf(j, 'fornecedores'), 0));
  assert.throws(() => balanceOf(j, 'caixa', { from: '2026-02-05', to: '2026-02-01' }), RangeError);
  assert.throws(() => balanceOf(j, 'xx'), RangeError);
});

test('statement: extrato com saldo inicial e corrido', () => {
  const j = scenario();
  assert.deepEqual(statement(j, 'caixa', { from: '2026-02-03', to: '2026-02-06' }), {
    account: 'caixa', opening: 100000,
    rows: [
      { date: '2026-02-03', id: 2, memo: 'venda', amount: 25040, balance: 125040 },
      { date: '2026-02-05', id: 3, memo: 'devolucao parcial', amount: -1205, balance: 123835 },
      { date: '2026-02-06', id: 4, memo: 'desconto concedido', amount: -1535, balance: 122300 },
    ],
    closing: 122300,
  });
  assert.deepEqual(statement(j, 'vendas').rows.map((r) => r.amount), [25040, -1205]);
  post(j, { date: '2026-02-04', memo: 'venda retroativa', lines: [{ account: 'caixa', debit: '10.00' }, { account: 'vendas', credit: '10.00' }] });
  post(j, { date: '2026-02-02', memo: 'taxa retroativa', lines: [{ account: 'aluguel', debit: '1.00' }, { account: 'caixa', credit: '1.00' }] });
  const st = statement(j, 'caixa', { from: '2026-02-02' });
  assert.equal(st.opening, 100000);
  assert.deepEqual(st.rows.map((r) => [r.id, r.balance]), [[7, 99900], [2, 124940], [6, 125940], [3, 124735], [4, 123200]]);
  assert.equal(st.closing, 123200);
  assert.deepEqual(entriesBetween(j, { from: '2026-02-02', to: '2026-02-04' }).map((e) => e.id), [7, 2, 6]);
});

test('trialBalance: saldos credores em contas devedoras vão para a coluna crédito', () => {
  const tb = trialBalance(scenario());
  assert.deepEqual(tb, {
    rows: [
      { account: 'caixa', debit: 122300, credit: 0 },
      { account: 'banco', debit: 0, credit: 30025 },
      { account: 'capital', debit: 0, credit: 100000 },
      { account: 'vendas', debit: 0, credit: 23835 },
      { account: 'descontos', debit: 1535, credit: 0 },
      { account: 'aluguel', debit: 30025, credit: 0 },
    ],
    totalDebit: 153860, totalCredit: 153860,
  });
  assert.deepEqual(trialBalance(scenario(), { from: '2026-02-05', to: '2026-02-05' }).rows,
    [{ account: 'caixa', debit: 0, credit: 1205 }, { account: 'vendas', debit: 1205, credit: 0 }]);
});

test('incomeStatement e closePeriod com saldo natural negativo', () => {
  const j = scenario();
  assert.deepEqual(incomeStatement(j), { revenue: 22300, expense: 30025, result: -7725 });
  const e = closePeriod(j, { date: '2026-02-28', equity: 'lucros' });
  assert.deepEqual(e.lines, [
    { account: 'vendas', amount: 23835 },
    { account: 'descontos', amount: -1535 },
    { account: 'aluguel', amount: -30025 },
    { account: 'lucros', amount: 7725 },
  ]);
  assert.equal(e.memo, 'encerramento');
  assert.equal(balanceOf(j, 'lucros'), -7725);
  assert.deepEqual(incomeStatement(j), { revenue: 0, expense: 0, result: 0 });
  assert.equal(closePeriod(j, { date: '2026-02-28', equity: 'lucros' }), null);
  assert.throws(() => closePeriod(j, { date: '2026-02-28', equity: 'caixa' }), RangeError);
  assert.deepEqual(checkIntegrity(j), []);
});
