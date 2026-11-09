/**
 * Business days: Monday to Friday that are not in the list of holidays.
 * Input dates may be 'YYYY-MM-DD' strings or Date objects (UTC midnight);
 * holidays are 'YYYY-MM-DD' strings; outputs are 'YYYY-MM-DD' strings.
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
 * Moves forward (n > 0) or back (n < 0) |n| business days from `date` (the day itself
 * does not count). n = 0 returns the date itself.
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
 * Number of business days d with a < d <= b; if b < a, the negative of the number
 * with b < d <= a.
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
