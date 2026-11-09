/**
 * Encerramento de período: zera as contas de resultado (receitas e despesas)
 * transferindo o resultado líquido para uma conta de patrimônio.
 */
import { post, accountType } from './journal.mjs';
import { balanceOf } from './ledger.mjs';
import { formatAmount } from './money.mjs';

function naturalLine(account, type, natural) {
  // Para zerar o saldo natural, lança-se o valor do lado oposto ao da natureza da conta.
  const text = formatAmount(natural);
  return type === 'receita' ? { account, debit: text } : { account, credit: text };
}

/**
 * Gera (e registra) o lançamento de encerramento na data `date`, considerando
 * os lançamentos de `from` (inclusive, opcional) até `date` (inclusive).
 * Devolve o lançamento criado, ou null se não há saldo a encerrar.
 */
export function closePeriod(journal, { date, equity, from } = {}) {
  if (accountType(journal, equity) !== 'patrimonio') throw new RangeError(`conta de encerramento deve ser de patrimônio: ${equity}`);
  const range = from === undefined ? { to: date } : { from, to: date };
  const lines = [];
  let result = 0;
  for (const [account, type] of Object.entries(journal.accounts)) {
    if (type !== 'receita' && type !== 'despesa') continue;
    const natural = balanceOf(journal, account, range);
    if (natural === 0) continue;
    lines.push(naturalLine(account, type, natural));
    result += type === 'receita' ? natural : -natural;
  }
  if (lines.length === 0) return null;
  if (result > 0) lines.push({ account: equity, credit: formatAmount(result) });
  else if (result < 0) lines.push({ account: equity, debit: formatAmount(-result) });
  return post(journal, { date, memo: 'encerramento', lines });
}
