/**
 * Razão: saldos naturais por conta, balancete, extrato e resultado.
 */
import { accountType } from './journal.mjs';

const DEBIT_NORMAL = new Set(['ativo', 'despesa']);

/** +1 para contas de natureza devedora (ativo, despesa); -1 para as credoras. */
export function normalSign(type) {
  return DEBIT_NORMAL.has(type) ? 1 : -1;
}

function checkRange({ from, to } = {}) {
  for (const d of [from, to]) {
    if (d !== undefined && (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d))) throw new RangeError(`data inválida: ${d}`);
  }
  if (from !== undefined && to !== undefined && from > to) throw new RangeError('período invertido');
  return { from, to };
}

function ordered(journal) {
  return [...journal.entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id));
}

function inRange(date, { from, to }) {
  return (from === undefined || date >= from) && (to === undefined || date <= to);
}

/** Lançamentos do período, ordenados por (data, id). */
export function entriesBetween(journal, opts = {}) {
  const range = checkRange(opts);
  return ordered(journal).filter((e) => inRange(e.date, range));
}

/** Soma assinada (débito +) das linhas de `account` no período. */
function rawSum(journal, account, range) {
  let sum = 0;
  for (const e of journal.entries) {
    if (!inRange(e.date, range)) continue;
    for (const l of e.lines) if (l.account === account) sum += l.amount;
  }
  return sum;
}

export function balanceOf(journal, account, opts = {}) {
  const range = checkRange(opts);
  const sign = normalSign(accountType(journal, account));
  const v = sign * rawSum(journal, account, range);
  return v === 0 ? 0 : v;
}

/**
 * Balancete: uma linha por conta com movimento no período, na ordem do plano.
 * Saldo devedor (soma assinada > 0) na coluna débito; credor na coluna crédito.
 */
export function trialBalance(journal, opts = {}) {
  const range = checkRange(opts);
  const used = new Set();
  for (const e of journal.entries) if (inRange(e.date, range)) for (const l of e.lines) used.add(l.account);
  const rows = [];
  let totalDebit = 0;
  let totalCredit = 0;
  for (const account of Object.keys(journal.accounts)) {
    if (!used.has(account)) continue;
    const sign = normalSign(journal.accounts[account]);
    const natural = sign * rawSum(journal, account, range) || 0;
    const onDebit = natural === 0 ? sign > 0 : (sign > 0) === (natural > 0);
    const value = Math.abs(natural);
    const debit = onDebit ? value : 0;
    const credit = onDebit ? 0 : value;
    rows.push({ account, debit, credit });
    totalDebit += debit;
    totalCredit += credit;
  }
  return { rows, totalDebit, totalCredit };
}

/** Extrato da conta em sinal natural, com saldo corrido. */
export function statement(journal, account, opts = {}) {
  const range = checkRange(opts);
  const sign = normalSign(accountType(journal, account));
  let balance = 0;
  if (range.from !== undefined) {
    for (const e of journal.entries) {
      if (e.date < range.from) for (const l of e.lines) if (l.account === account) balance += sign * l.amount;
    }
  }
  const opening = balance === 0 ? 0 : balance;
  const rows = [];
  for (const e of ordered(journal)) {
    if (!inRange(e.date, range)) continue;
    for (const l of e.lines) {
      if (l.account !== account) continue;
      const amount = l.amount === 0 ? 0 : sign * l.amount;
      balance += amount;
      rows.push({ date: e.date, id: e.id, memo: e.memo, amount, balance: balance === 0 ? 0 : balance });
    }
  }
  return { account, opening, rows, closing: balance === 0 ? 0 : balance };
}

/** Receitas e despesas (sinal natural) do período e resultado = receitas - despesas. */
export function incomeStatement(journal, opts = {}) {
  const range = checkRange(opts);
  let revenue = 0;
  let expense = 0;
  for (const [account, type] of Object.entries(journal.accounts)) {
    if (type === 'receita') revenue -= rawSum(journal, account, range);
    else if (type === 'despesa') expense += rawSum(journal, account, range);
  }
  const fix = (v) => (v === 0 ? 0 : v);
  return { revenue: fix(revenue), expense: fix(expense), result: fix(revenue - expense) };
}

/**
 * Auditoria: devolve a lista de problemas (vazia se o diário está íntegro).
 * Cada lançamento deve ter ao menos duas linhas, contas do plano, valores
 * inteiros e soma assinada zero.
 */
export function checkIntegrity(journal) {
  const problems = [];
  const seen = new Set();
  for (const e of journal.entries) {
    if (seen.has(e.id)) problems.push(`#${e.id}: id repetido`);
    seen.add(e.id);
    if (!Array.isArray(e.lines) || e.lines.length < 2) {
      problems.push(`#${e.id}: menos de duas linhas`);
      continue;
    }
    let sum = 0;
    for (const l of e.lines) {
      if (!Object.hasOwn(journal.accounts, l.account)) problems.push(`#${e.id}: conta desconhecida ${l.account}`);
      if (!Number.isSafeInteger(l.amount)) problems.push(`#${e.id}: valor inválido em ${l.account}`);
      else sum += l.amount;
    }
    if (sum !== 0) problems.push(`#${e.id}: soma ${sum}`);
  }
  return problems;
}
