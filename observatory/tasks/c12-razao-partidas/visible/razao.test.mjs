import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createJournal, post } from '../src/journal.mjs';
import { balanceOf, statement, trialBalance } from '../src/ledger.mjs';
import { renderStatement, renderTrialBalance } from '../src/report.mjs';

const CHART = { caixa: 'ativo', capital: 'patrimonio', vendas: 'receita', aluguel: 'despesa' };

function scenario() {
  const j = createJournal(CHART);
  post(j, { date: '2026-03-02', memo: 'venda', lines: [{ account: 'caixa', debit: '250.40' }, { account: 'vendas', credit: '250.40' }] });
  post(j, { date: '2026-03-04', memo: 'devolucao', lines: [{ account: 'caixa', debit: '-12.05' }, { account: 'vendas', credit: '-12.05' }] });
  post(j, { date: '2026-03-06', memo: 'devolucao', lines: [{ account: 'caixa', debit: '-123.45' }, { account: 'vendas', credit: '-123.45' }] });
  return j;
}

test('round-trip: o extrato mostra os valores lançados', () => {
  const lines = renderStatement(statement(scenario(), 'caixa')).split('\n');
  const amounts = lines.filter((l) => /^\d{4}-/.test(l)).map((l) => l.split(' | ')[2]);
  assert.deepEqual(amounts, ['250.40', '-12.05', '-123.45']);
});

test('saldo do caixa após devolução parcial', () => {
  const j = scenario();
  assert.equal(balanceOf(j, 'caixa'), 11490);
  assert.equal(balanceOf(j, 'vendas'), 11490);
  assert.equal(renderStatement(statement(j, 'caixa')).split('\n').at(-1), 'saldo final | 114.90');
});

test('balancete simples', () => {
  const j = createJournal(CHART);
  post(j, { date: '2026-03-01', memo: 'aporte', lines: [{ account: 'caixa', debit: '5000.00' }, { account: 'capital', credit: '5000.00' }] });
  post(j, { date: '2026-03-03', memo: 'aluguel', lines: [{ account: 'aluguel', debit: '1200.10' }, { account: 'caixa', credit: '1200.10' }] });
  assert.equal(renderTrialBalance(trialBalance(j)), [
    'Conta                       Débito       Crédito',
    'caixa                     3,799.90          0.00',
    'capital                       0.00      5,000.00',
    'aluguel                   1,200.10          0.00',
    '------------------------------------------------',
    'TOTAL                     5,000.00      5,000.00',
  ].join('\n'));
});
