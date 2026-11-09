/**
 * Regras de recorrência no estilo RRULE (subconjunto): parse e formatação canônica.
 */
import { assertDate } from './civil.mjs';
import { WEEKDAY_CODES, codeToIso, isoToCode } from './weekdays.mjs';

export class RuleError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RuleError';
  }
}

const FREQS = ['DAILY', 'WEEKLY', 'MONTHLY'];
const KEYS = ['FREQ', 'INTERVAL', 'COUNT', 'UNTIL', 'BYDAY', 'BYMONTHDAY', 'WKST'];

function positive(text, key) {
  if (!/^\d+$/.test(text) || Number(text) < 1) throw new RuleError(`${key} inválido: ${text}`);
  return Number(text);
}

function parseUntil(text) {
  const mt = /^(\d{4})(\d{2})(\d{2})$/.exec(text);
  if (!mt) throw new RuleError(`UNTIL inválido: ${text}`);
  const date = { y: Number(mt[1]), m: Number(mt[2]), d: Number(mt[3]) };
  try {
    return assertDate(date);
  } catch {
    throw new RuleError(`UNTIL inválido: ${text}`);
  }
}

export function parseRule(text) {
  if (typeof text !== 'string') throw new TypeError('regra deve ser string');
  const fields = new Map();
  for (const part of text.split(';')) {
    const mt = /^([A-Z]+)=(.+)$/.exec(part);
    if (!mt) throw new RuleError(`parte malformada: ${JSON.stringify(part)}`);
    if (!KEYS.includes(mt[1])) throw new RuleError(`chave desconhecida: ${mt[1]}`);
    if (fields.has(mt[1])) throw new RuleError(`chave repetida: ${mt[1]}`);
    fields.set(mt[1], mt[2]);
  }
  const freq = fields.get('FREQ');
  if (!FREQS.includes(freq)) throw new RuleError(`FREQ ausente ou inválida: ${freq}`);
  const rule = { freq, interval: 1, count: null, until: null, byday: [], bymonthday: [], wkst: 'MO' };
  if (fields.has('INTERVAL')) rule.interval = positive(fields.get('INTERVAL'), 'INTERVAL');
  if (fields.has('COUNT')) rule.count = positive(fields.get('COUNT'), 'COUNT');
  if (fields.has('UNTIL')) rule.until = parseUntil(fields.get('UNTIL'));
  if (rule.count !== null && rule.until !== null) throw new RuleError('COUNT e UNTIL são mutuamente exclusivos');
  if (fields.has('WKST')) {
    const w = fields.get('WKST');
    if (!WEEKDAY_CODES.includes(w)) throw new RuleError(`WKST inválido: ${w}`);
    rule.wkst = w;
  }
  if (fields.has('BYDAY')) {
    if (freq === 'DAILY') throw new RuleError('BYDAY não se aplica a DAILY');
    rule.byday = fields.get('BYDAY').split(',').map((tok) => {
      const mt = /^([+-]?[1-5])?(MO|TU|WE|TH|FR|SA|SU)$/.exec(tok);
      if (!mt) throw new RuleError(`BYDAY inválido: ${tok}`);
      const n = mt[1] ? Number(mt[1]) : 0;
      if (n !== 0 && freq !== 'MONTHLY') throw new RuleError('ordinal em BYDAY só é aceito em MONTHLY');
      return { n, wd: codeToIso(mt[2]) };
    });
  }
  if (fields.has('BYMONTHDAY')) {
    if (freq !== 'MONTHLY') throw new RuleError('BYMONTHDAY só se aplica a MONTHLY');
    rule.bymonthday = fields.get('BYMONTHDAY').split(',').map((tok) => {
      if (!/^[+-]?\d{1,2}$/.test(tok)) throw new RuleError(`BYMONTHDAY inválido: ${tok}`);
      const md = Number(tok);
      if (md === 0 || md < -31 || md > 31) throw new RuleError(`BYMONTHDAY inválido: ${tok}`);
      return md;
    });
  }
  if (rule.byday.length && rule.bymonthday.length) throw new RuleError('BYDAY e BYMONTHDAY juntos não são suportados');
  return rule;
}

const pad = (v, w) => String(v).padStart(w, '0');

export function formatRule(rule) {
  const parts = [`FREQ=${rule.freq}`];
  if (rule.interval !== 1) parts.push(`INTERVAL=${rule.interval}`);
  if (rule.byday.length) parts.push('BYDAY=' + rule.byday.map(({ n, wd }) => (n ? String(n) : '') + isoToCode(wd)).join(','));
  if (rule.bymonthday.length) parts.push('BYMONTHDAY=' + rule.bymonthday.join(','));
  if (rule.wkst !== 'MO') parts.push(`WKST=${rule.wkst}`);
  if (rule.count !== null) parts.push(`COUNT=${rule.count}`);
  if (rule.until !== null) parts.push(`UNTIL=${pad(rule.until.y, 4)}${pad(rule.until.m, 2)}${pad(rule.until.d, 2)}`);
  return parts.join(';');
}
