import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createJournal, post } from '../src/journal.mjs';
import { statement, trialBalance, incomeStatement } from '../src/ledger.mjs';
import { cell, renderTrialBalance, renderStatement, renderIncome, renderJournal } from '../src/report.mjs';

test('cell: separador de milhar, sinal e alinhamento', () => {
  assert.equal(cell(123456789), '1,234,567.89');
  assert.equal(cell(-5), '-0.05');
  assert.equal(cell(-1205), '-12.05');
  assert.equal(cell(-12345678), '-123,456.78');
  assert.equal(cell(-100), '-1.00');
  assert.equal(cell(0), '0.00');
  assert.equal(cell(-99999), '-999.99');
  assert.equal(cell(-5, 8), '   -0.05');
  assert.equal(cell(100000, 3), '1,000.00');
  assert.throws(() => cell(0.5), RangeError);
});

function scenario() {
  const j = createJournal({ caixa: 'ativo', banco: 'ativo', capital: 'patrimonio', vendas: 'receita', aluguel: 'despesa', arredondamento: 'despesa' });
  post(j, { date: '2026-04-01', memo: 'aporte', lines: [{ account: 'caixa', debit: '1000.00' }, { account: 'capital', credit: '1000.00' }] });
  post(j, { date: '2026-04-02', memo: 'venda', lines: [{ account: 'caixa', debit: '250.40' }, { account: 'vendas', credit: '250.40' }] });
  post(j, { date: '2026-04-03', memo: 'devolucao', lines: [{ account: 'caixa', debit: '-0.45' }, { account: 'vendas', credit: '-0.45' }] });
  post(j, { date: '2026-04-04', memo: 'aluguel', lines: [{ account: 'aluguel', debit: '1300.00' }, { account: 'banco', credit: '1300.00' }] });
  post(j, { date: '2026-04-05', memo: 'fx', rate: '0.5', lines: [{ account: 'aluguel', debit: '0.03' }, { account: 'aluguel', debit: '0.03' }, { account: 'caixa', credit: '0.06' }] });
  return j;
}

test('renderStatement e renderIncome com valores negativos', () => {
  const j = scenario();
  assert.equal(renderStatement(statement(j, 'caixa', { from: '2026-04-02' })), [
    'extrato caixa',
    'saldo inicial | 1,000.00',
    '2026-04-02 | #2 venda | 250.40 | 1,250.40',
    '2026-04-03 | #3 devolucao | -0.45 | 1,249.95',
    '2026-04-05 | #5 fx | -0.03 | 1,249.92',
    'saldo final | 1,249.92',
  ].join('\n'));
  assert.equal(renderIncome(incomeStatement(j)), ['receitas | 249.95', 'despesas | 1,300.03', 'resultado | -1,050.08'].join('\n'));
});

test('renderTrialBalance com saldo credor em conta de ativo', () => {
  assert.equal(renderTrialBalance(trialBalance(scenario())), [
    'Conta                       Débito       Crédito',
    'caixa                     1,249.92          0.00',
    'banco                         0.00      1,300.00',
    'capital                       0.00      1,000.00',
    'vendas                        0.00        249.95',
    'aluguel                   1,300.04          0.00',
    'arredondamento                0.00          0.01',
    '------------------------------------------------',
    'TOTAL                     2,549.96      2,549.96',
  ].join('\n'));
});

test('renderJournal: linhas zeradas pelo câmbio', () => {
  const j = createJournal({ caixa: 'ativo', aluguel: 'despesa', arredondamento: 'despesa' });
  post(j, { date: '2026-04-09', memo: 'fx', rate: '0.5', lines: [{ account: 'aluguel', debit: '0.01' }, { account: 'aluguel', debit: '0.01' }, { account: 'caixa', credit: '0.02' }] });
  assert.equal(renderJournal(j), [
    '#1 2026-04-09 fx',
    '  - aluguel                       0.00',
    '  - aluguel                       0.00',
    '  C caixa                         0.01',
    '  D arredondamento                0.01',
  ].join('\n'));
});

test('renderJournal: lado D/C pelo sinal e valor absoluto', () => {
  assert.equal(renderJournal(scenario()).split('\n').slice(6, 9).join('\n'), [
    '#3 2026-04-03 devolucao',
    '  C caixa                         0.45',
    '  D vendas                        0.45',
  ].join('\n'));
});
