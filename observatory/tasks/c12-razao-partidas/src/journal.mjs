/**
 * Diário de partidas dobradas: plano de contas, lançamentos e estornos.
 * Cada linha gravada é { account, amount } com amount em centavos assinados
 * (débito positivo, crédito negativo).
 */
import { parseAmount, parseRate, convert, allocate, formatAmount } from './money.mjs';

export const ACCOUNT_TYPES = ['ativo', 'passivo', 'patrimonio', 'receita', 'despesa'];
export const ROUNDING_ACCOUNT = 'arredondamento';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function createJournal(accounts) {
  if (accounts === null || typeof accounts !== 'object') throw new TypeError('plano de contas deve ser objeto');
  const chart = {};
  for (const [code, type] of Object.entries(accounts)) {
    if (!ACCOUNT_TYPES.includes(type)) throw new RangeError(`tipo inválido para ${code}: ${type}`);
    chart[code] = type;
  }
  return { accounts: chart, entries: [], nextId: 1 };
}

export function accountType(journal, code) {
  if (!Object.hasOwn(journal.accounts, code)) throw new RangeError(`conta desconhecida: ${code}`);
  return journal.accounts[code];
}

function assertDate(date) {
  if (typeof date !== 'string' || !DATE_RE.test(date)) throw new RangeError(`data inválida: ${date}`);
}

function signedValue(line) {
  const hasDebit = Object.hasOwn(line, 'debit');
  const hasCredit = Object.hasOwn(line, 'credit');
  if (hasDebit === hasCredit) throw new RangeError('cada linha precisa de exatamente um entre debit e credit');
  const value = parseAmount(hasDebit ? line.debit : line.credit);
  if (value === 0) throw new RangeError('linha com valor zero');
  return hasDebit ? value : -value;
}

function expand(journal, line, amount) {
  if (line.split === undefined) {
    accountType(journal, line.account);
    return [{ account: line.account, amount }];
  }
  const codes = Object.keys(line.split);
  for (const code of codes) accountType(journal, code);
  const parts = allocate(amount, codes.map((code) => line.split[code]));
  return codes.map((code, i) => ({ account: code, amount: parts[i] }));
}

/**
 * Registra um lançamento. Linhas: { account | split, debit | credit }.
 * Com `rate`, os valores estão em moeda estrangeira e cada linha é convertida
 * (antes do rateio); o resíduo de arredondamento vai para ROUNDING_ACCOUNT.
 */
export function post(journal, { date, memo = '', lines, rate } = {}) {
  assertDate(date);
  if (!Array.isArray(lines) || lines.length < 2) throw new RangeError('lançamento precisa de ao menos duas linhas');
  const parsedRate = rate === undefined ? null : parseRate(rate);
  const out = [];
  for (const line of lines) {
    if (line === null || typeof line !== 'object') throw new TypeError('linha inválida');
    const amount = signedValue(line);
    for (const l of expand(journal, line, amount)) out.push(parsedRate ? { account: l.account, amount: convert(l.amount, parsedRate) } : l);
  }
  const sum = out.reduce((s, l) => s + l.amount, 0);
  if (sum !== 0) {
    if (!parsedRate) throw new RangeError(`lançamento desbalanceado em ${formatAmount(sum)}`);
    accountType(journal, ROUNDING_ACCOUNT);
    out.push({ account: ROUNDING_ACCOUNT, amount: -sum });
  }
  const entry = { id: journal.nextId++, date, memo: String(memo), lines: out };
  journal.entries.push(entry);
  return entry;
}

export function getEntry(journal, id) {
  const entry = journal.entries.find((e) => e.id === id);
  if (!entry) throw new RangeError(`lançamento inexistente: #${id}`);
  return entry;
}

/** Estorno: novo lançamento com as mesmas contas e valores com sinal trocado. */
export function reverse(journal, id, date) {
  const original = getEntry(journal, id);
  assertDate(date);
  if (original.reversedBy !== undefined) throw new Error(`lançamento #${id} já estornado`);
  if (original.reverses !== undefined) throw new Error(`lançamento #${id} é um estorno`);
  const entry = {
    id: journal.nextId++,
    date,
    memo: `estorno #${id}`,
    lines: original.lines.map((l) => ({ account: l.account, amount: l.amount === 0 ? 0 : -l.amount })),
    reverses: id,
  };
  original.reversedBy = entry.id;
  journal.entries.push(entry);
  return entry;
}
