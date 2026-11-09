/**
 * Consultas de agenda sobre regras de recorrência (datas como 'AAAA-MM-DD').
 */
import { addDays, compareDates, formatDate } from './civil.mjs';
import { isoWeek } from './weekdays.mjs';
import { occurrences, toDate } from './expand.mjs';

function exclusions(exdates) {
  if (!Array.isArray(exdates)) throw new TypeError('exdates deve ser array');
  return new Set(exdates.map((e) => formatDate(toDate(e))));
}

/** Ocorrências em [from, to] (ambos inclusivos), sem as datas excluídas. */
export function between(rule, dtstart, from, to, { exdates = [] } = {}) {
  const lo = toDate(from);
  const hi = toDate(to);
  if (compareDates(lo, hi) > 0) throw new RangeError('intervalo invertido');
  const ex = exclusions(exdates);
  return occurrences(rule, dtstart, { from: lo, to: addDays(hi, 1) })
    .map(formatDate)
    .filter((s) => !ex.has(s));
}

/** Primeira ocorrência estritamente posterior a `after`, ou null. */
export function nextAfter(rule, dtstart, after, { exdates = [] } = {}) {
  const ex = exclusions(exdates);
  const found = occurrences(rule, dtstart, { from: addDays(toDate(after), 1), limit: ex.size + 1 })
    .map(formatDate)
    .find((s) => !ex.has(s));
  return found ?? null;
}

const pad2 = (n) => String(n).padStart(2, '0');

/** Agrupa as ocorrências de [from, to] por semana ISO: { 'AAAA-Www': ['AAAA-MM-DD', ...] }. */
export function byIsoWeek(rule, dtstart, from, to, opts = {}) {
  const groups = {};
  for (const s of between(rule, dtstart, from, to, opts)) {
    const { year, week } = isoWeek(toDate(s));
    const key = `${year}-W${pad2(week)}`;
    (groups[key] ??= []).push(s);
  }
  return groups;
}

/** As `n` primeiras ocorrências (sem exclusões), como 'AAAA-MM-DD'. */
export function firstN(rule, dtstart, n) {
  if (!Number.isInteger(n) || n < 0) throw new RangeError(`n inválido: ${n}`);
  return occurrences(rule, dtstart, { limit: n }).map(formatDate);
}

/**
 * Agenda combinada de vários eventos { name, rule, dtstart, exdates? } em [from, to]:
 * lista de { date, name } ordenada por data e, no mesmo dia, por nome.
 */
export function agenda(events, from, to) {
  if (!Array.isArray(events)) throw new TypeError('events deve ser array');
  const items = [];
  for (const ev of events) {
    if (typeof ev?.name !== 'string' || !ev.name) throw new TypeError('evento sem nome');
    for (const date of between(ev.rule, ev.dtstart, from, to, { exdates: ev.exdates ?? [] })) items.push({ date, name: ev.name });
  }
  return items.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

/** Datas em [from, to] em que dois ou mais eventos coincidem: { 'AAAA-MM-DD': [nomes em ordem] }. */
export function conflicts(events, from, to) {
  const byDate = {};
  for (const { date, name } of agenda(events, from, to)) (byDate[date] ??= []).push(name);
  return Object.fromEntries(Object.entries(byDate).filter(([, names]) => names.length > 1));
}
