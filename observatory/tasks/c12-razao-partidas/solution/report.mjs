/**
 * Relatórios em texto: balancete, extrato e demonstração de resultado.
 */

/** Centavos → "1,234,567.89" / "-0.05", alinhado à direita em `width` colunas. */
export function cell(minor, width = 0) {
  if (!Number.isSafeInteger(minor)) throw new RangeError(`valor em centavos inválido: ${minor}`);
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / 100);
  const cents = String(abs % 100).padStart(2, '0');
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const text = `${minor < 0 ? '-' : ''}${grouped}.${cents}`;
  return text.padStart(width);
}

const ACCOUNT_W = 20;
const MONEY_W = 14;

export function renderTrialBalance(tb) {
  const lines = ['Conta'.padEnd(ACCOUNT_W) + 'Débito'.padStart(MONEY_W) + 'Crédito'.padStart(MONEY_W)];
  for (const row of tb.rows) {
    lines.push(row.account.padEnd(ACCOUNT_W) + cell(row.debit, MONEY_W) + cell(row.credit, MONEY_W));
  }
  lines.push('-'.repeat(ACCOUNT_W + 2 * MONEY_W));
  lines.push('TOTAL'.padEnd(ACCOUNT_W) + cell(tb.totalDebit, MONEY_W) + cell(tb.totalCredit, MONEY_W));
  return lines.join('\n');
}

export function renderStatement(st) {
  const lines = [`extrato ${st.account}`, `saldo inicial | ${cell(st.opening)}`];
  for (const r of st.rows) lines.push(`${r.date} | #${r.id} ${r.memo} | ${cell(r.amount)} | ${cell(r.balance)}`);
  lines.push(`saldo final | ${cell(st.closing)}`);
  return lines.join('\n');
}

export function renderIncome(is) {
  return [`receitas | ${cell(is.revenue)}`, `despesas | ${cell(is.expense)}`, `resultado | ${cell(is.result)}`].join('\n');
}

/** Diário: cada lançamento seguido das linhas "D"/"C" com o valor absoluto. */
export function renderJournal(journal) {
  const lines = [];
  for (const e of journal.entries) {
    lines.push(`#${e.id} ${e.date} ${e.memo}`);
    for (const l of e.lines) {
      const side = l.amount > 0 ? 'D' : l.amount < 0 ? 'C' : '-';
      lines.push(`  ${side} ${l.account.padEnd(ACCOUNT_W)}${cell(Math.abs(l.amount), MONEY_W)}`);
    }
  }
  return lines.join('\n');
}
