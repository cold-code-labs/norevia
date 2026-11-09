/**
 * Dias úteis: segunda a sexta que não estão na lista de feriados.
 * Datas de entrada podem ser strings 'YYYY-MM-DD' ou objetos Date (meia-noite UTC);
 * feriados são strings 'YYYY-MM-DD'; as saídas são strings 'YYYY-MM-DD'.
 */
const DAY = 86_400_000;

function toDate(x) {
  const d = x instanceof Date ? new Date(x.getTime()) : new Date(`${x}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new RangeError(`invalid date: ${x}`);
  return d;
}

const toISO = (d) => d.toISOString().slice(0, 10);

export function isBusinessDay(date, holidays = []) {
  const d = toDate(date);
  const wd = d.getUTCDay();
  return wd !== 0 && wd !== 6 && !holidays.includes(toISO(d));
}

/**
 * Avança (n > 0) ou recua (n < 0) |n| dias úteis a partir de `date` (o próprio dia
 * não conta). n = 0 devolve a própria data.
 */
export function addBusinessDays(date, n, holidays = []) {
  if (!Number.isInteger(n)) throw new RangeError('n must be an integer');
  let d = toDate(date);
  const step = n < 0 ? -1 : 1;
  for (let left = Math.abs(n); left > 0; ) {
    d = new Date(d.getTime() + step * DAY);
    if (isBusinessDay(d, holidays)) left--;
  }
  return toISO(d);
}

/**
 * Quantidade de dias úteis d com a < d <= b; se b < a, o negativo da quantidade
 * com b < d <= a.
 */
export function businessDaysBetween(a, b, holidays = []) {
  let from = toDate(a);
  let to = toDate(b);
  const sign = to < from ? -1 : 1;
  if (sign < 0) [from, to] = [to, from];
  let count = 0;
  for (let t = from.getTime() + DAY; t <= to.getTime(); t += DAY) {
    if (isBusinessDay(new Date(t), holidays)) count++;
  }
  return sign * count;
}
