/**
 * 5-field cron expression engine, without time zone.
 *
 * Instants are plain objects `{ year, month, day, hour, minute }` with
 * integers (month 1–12, day 1–31, hour 0–23, minute 0–59); there are no seconds nor
 * time zones. All calendar arithmetic is proleptic Gregorian and done right
 * here, without `Date`.
 */

export class CronError extends Error {
  /**
   * @param {string} message
   * @param {string|null} field name of the problematic field, or null when the
   *   error is structural (number of fields).
   */
  constructor(message, field = null) {
    super(message);
    this.name = 'CronError';
    this.field = field;
  }
}

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/**
 * Fields in expression order. `max` is the largest value accepted literally;
 * `starMax` is the largest value covered by `*` (in the day of week, 7 is accepted
 * as a synonym for Sunday, but `*` covers only 0–6).
 */
const FIELDS = [
  { name: 'minute', min: 0, max: 59, starMax: 59 },
  { name: 'hour', min: 0, max: 23, starMax: 23 },
  { name: 'dayOfMonth', min: 1, max: 31, starMax: 31 },
  { name: 'month', min: 1, max: 12, starMax: 12, names: MONTH_NAMES, nameBase: 1 },
  { name: 'dayOfWeek', min: 0, max: 7, starMax: 6, names: DAY_NAMES, nameBase: 0, sundayAlias: true },
];

/** How many years, starting from `from`, `next`/`prev` examine before giving up. */
export const SEARCH_YEARS = 100;

// ---------------------------------------------------------------- calendar

export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function daysInMonth(year, month) {
  return month === 2 && isLeapYear(year) ? 29 : MONTH_DAYS[month - 1];
}

/** Day of week (0 = Sunday … 6 = Saturday), Sakamoto's method. */
export function dayOfWeek(year, month, day) {
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const y = month < 3 ? year - 1 : year;
  return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[month - 1] + day) % 7;
}

/** Orders instants: negative if `a` comes before `b`, 0 if equal. */
export function compareTime(a, b) {
  return a.year - b.year || a.month - b.month || a.day - b.day || a.hour - b.hour || a.minute - b.minute;
}

function checkTime(t) {
  if (t === null || typeof t !== 'object') throw new TypeError('instante deve ser um objeto');
  const { year, month, day, hour, minute } = t;
  for (const [k, v] of Object.entries({ year, month, day, hour, minute })) {
    if (!Number.isInteger(v)) throw new RangeError(`${k} deve ser inteiro`);
  }
  if (year < 1 || year > 9999) throw new RangeError('year fora de 1-9999');
  if (month < 1 || month > 12) throw new RangeError('month fora de 1-12');
  if (day < 1 || day > daysInMonth(year, month)) throw new RangeError('day inexistente no mês');
  if (hour < 0 || hour > 23) throw new RangeError('hour fora de 0-23');
  if (minute < 0 || minute > 59) throw new RangeError('minute fora de 0-59');
}

// ------------------------------------------------------------------ parsing

function parseValue(token, spec) {
  if (/^\d+$/.test(token)) {
    const v = Number(token);
    if (v < spec.min || v > spec.max) {
      throw new CronError(`${spec.name}: ${v} fora de ${spec.min}-${spec.max}`, spec.name);
    }
    return v;
  }
  if (spec.names) {
    const i = spec.names.indexOf(token.toUpperCase());
    if (i !== -1) return i + spec.nameBase;
  }
  throw new CronError(`${spec.name}: valor inválido "${token}"`, spec.name);
}

/** Expands an item (`*`, `N`, `N-M`, each with optional `/S`) into `out`. */
function expandItem(item, spec, out) {
  const [base, stepText, extra] = item.split('/');
  if (extra !== undefined) throw new CronError(`${spec.name}: "${item}" tem mais de uma barra`, spec.name);
  let step = 1;
  if (stepText !== undefined) {
    if (!/^\d+$/.test(stepText) || Number(stepText) < 1) {
      throw new CronError(`${spec.name}: passo inválido "${stepText}"`, spec.name);
    }
    step = Number(stepText);
  }
  let lo;
  let hi;
  if (base === '*') {
    lo = spec.min;
    hi = spec.starMax;
  } else {
    const bounds = base.split('-');
    if (bounds.length > 2) throw new CronError(`${spec.name}: intervalo inválido "${base}"`, spec.name);
    lo = parseValue(bounds[0], spec);
    if (bounds.length === 2) hi = parseValue(bounds[1], spec);
    else hi = stepText === undefined ? lo : spec.starMax;
  }
  if (lo > hi) throw new CronError(`${spec.name}: intervalo vazio "${item}"`, spec.name);
  for (let v = lo; v <= hi; v += step) out.add(spec.sundayAlias && v === 7 ? 0 : v);
}

function parseField(text, spec) {
  const values = new Set();
  for (const item of text.split(',')) {
    if (item === '') throw new CronError(`${spec.name}: item vazio em "${text}"`, spec.name);
    expandItem(item, spec, values);
  }
  return { restricted: !text.startsWith('*'), values: [...values].sort((a, b) => a - b) };
}

/**
 * Interprets an expression. Returns, for each field, `{ restricted, values }`
 * with the allowed values in ascending order (always a new object).
 */
export function parse(expr) {
  if (typeof expr !== 'string') throw new TypeError('a expressão deve ser uma string');
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== FIELDS.length) {
    throw new CronError(`esperados 5 campos, encontrados ${parts[0] === '' ? 0 : parts.length}`);
  }
  const out = {};
  FIELDS.forEach((spec, i) => {
    out[spec.name] = parseField(parts[i], spec);
  });
  return out;
}

const cache = new Map();

function compile(expr) {
  let c = cache.get(expr);
  if (!c) {
    c = parse(expr);
    cache.set(expr, c);
  }
  return c;
}

// ---------------------------------------------------------------- evaluation

function dayMatches(c, y, m, d) {
  const domOk = c.dayOfMonth.values.includes(d);
  const dowOk = c.dayOfWeek.values.includes(dayOfWeek(y, m, d));
  if (c.dayOfMonth.restricted && c.dayOfWeek.restricted) return domOk || dowOk;
  return domOk && dowOk;
}

/** Does the instant `t` satisfy the expression? */
export function matches(expr, t) {
  const c = compile(expr);
  checkTime(t);
  return c.minute.values.includes(t.minute) && c.hour.values.includes(t.hour)
    && c.month.values.includes(t.month) && dayMatches(c, t.year, t.month, t.day);
}

/** First allowed time strictly after h0:m0 on the same day. */
function timeAfter(c, h0, m0) {
  for (const h of c.hour.values) {
    if (h < h0) continue;
    for (const mi of c.minute.values) {
      if (h > h0 || mi > m0) return [h, mi];
    }
  }
  return null;
}

/** Last allowed time strictly before h0:m0 on the same day. */
function timeBefore(c, h0, m0) {
  const hours = c.hour.values;
  const mins = c.minute.values;
  for (let i = hours.length - 1; i >= 0; i--) {
    if (hours[i] > h0) continue;
    for (let j = mins.length - 1; j >= 0; j--) {
      if (hours[i] < h0 || mins[j] < m0) return [hours[i], mins[j]];
    }
  }
  return null;
}

/** First occurrence strictly after `from`, or null. */
export function next(expr, from) {
  const c = compile(expr);
  checkTime(from);
  const lastYear = from.year + SEARCH_YEARS;
  let y = from.year;
  let m = from.month;
  let d = from.day;
  let sameDay = true;
  while (y <= lastYear) {
    if (!c.month.values.includes(m)) {
      if (m === 12) { y += 1; m = 1; } else m += 1;
      d = 1;
      sameDay = false;
      continue;
    }
    if (dayMatches(c, y, m, d)) {
      const hm = sameDay ? timeAfter(c, from.hour, from.minute) : [c.hour.values[0], c.minute.values[0]];
      if (hm) return { year: y, month: m, day: d, hour: hm[0], minute: hm[1] };
    }
    if (d < daysInMonth(y, m)) d += 1;
    else if (m < 12) { m += 1; d = 1; } else { y += 1; m = 1; d = 1; }
    sameDay = false;
  }
  return null;
}

/** Last occurrence strictly before `from`, or null. */
export function prev(expr, from) {
  const c = compile(expr);
  checkTime(from);
  const firstYear = Math.max(1, from.year - SEARCH_YEARS);
  const lastHour = c.hour.values[c.hour.values.length - 1];
  const lastMinute = c.minute.values[c.minute.values.length - 1];
  let y = from.year;
  let m = from.month;
  let d = from.day;
  let sameDay = true;
  while (y >= firstYear) {
    if (!c.month.values.includes(m)) {
      if (m === 1) { y -= 1; m = 12; } else m -= 1;
      d = daysInMonth(y, m);
      sameDay = false;
      continue;
    }
    if (dayMatches(c, y, m, d)) {
      const hm = sameDay ? timeBefore(c, from.hour, from.minute) : [lastHour, lastMinute];
      if (hm) return { year: y, month: m, day: d, hour: hm[0], minute: hm[1] };
    }
    if (d > 1) d -= 1;
    else if (m > 1) { m -= 1; d = daysInMonth(y, m); } else { y -= 1; m = 12; d = 31; }
    sameDay = false;
  }
  return null;
}

/** The next `n` occurrences after `from` (fewer, if the search runs out). */
export function nextN(expr, from, n) {
  compile(expr);
  checkTime(from);
  if (!Number.isInteger(n) || n < 0) throw new RangeError('n deve ser inteiro >= 0');
  const out = [];
  let t = from;
  while (out.length < n) {
    t = next(expr, t);
    if (t === null) break;
    out.push(t);
  }
  return out;
}

/** Occurrences `t` with `from < t <= to`, in order, at most `limit`. */
export function between(expr, from, to, limit = 1000) {
  compile(expr);
  checkTime(from);
  checkTime(to);
  if (!Number.isInteger(limit) || limit < 0) throw new RangeError('limit deve ser inteiro >= 0');
  const out = [];
  let t = from;
  while (out.length < limit) {
    t = next(expr, t);
    if (t === null || compareTime(t, to) > 0) break;
    out.push(t);
  }
  return out;
}

// ------------------------------------------------------------ normalization

function compress(values) {
  const out = [];
  for (let i = 0; i < values.length;) {
    let j = i;
    while (j + 1 < values.length && values[j + 1] === values[j] + 1) j++;
    if (j - i >= 2) out.push(`${values[i]}-${values[j]}`);
    else for (let k = i; k <= j; k++) out.push(String(values[k]));
    i = j + 1;
  }
  return out.join(',');
}

/** Canonical form: `*` for unrestricted fields, compacted list for the others. */
export function normalize(expr) {
  const c = compile(expr);
  return FIELDS.map((spec) => {
    const f = c[spec.name];
    return f.restricted ? compress(f.values) : '*';
  }).join(' ');
}
