/**
 * Durations in milliseconds ↔ compact text ('1h30m', '250ms').
 */
const UNITS = { d: 86_400_000, h: 3_600_000, m: 60_000, s: 1000, ms: 1 };

/**
 * parseDuration(text): sequence of <integer><unit> parts, units d, h, m, s, ms,
 * with optional spaces between number, unit and parts. The parts are added up.
 * Empty text or text with any unrecognized stretch → SyntaxError.
 */
export function parseDuration(text) {
  const s = text.trim();
  if (s === '') throw new SyntaxError('empty duration');
  const part = /(\d+)\s*(d|h|m|s|ms)\s*/y;
  let total = 0;
  while (part.lastIndex < s.length) {
    const m = part.exec(s);
    if (!m) throw new SyntaxError(`invalid duration: ${text}`);
    total += Number(m[1]) * UNITS[m[2]];
  }
  return total;
}

/**
 * formatDuration(ms): ms integer >= 0 (otherwise RangeError).
 * Below 1 s → '<n>ms'. Otherwise, parts 'Nd', 'Nh', 'Nm', 'Ns' separated by
 * a space, omitting the zero ones; the fraction of a second is discarded.
 */
export function formatDuration(ms) {
  if (!Number.isInteger(ms) || ms < 0) throw new RangeError('ms must be a non-negative integer');
  if (ms < 1000) return `${ms}ms`;
  const parts = [];
  let rest = ms;
  for (const unit of ['d', 'h', 'm', 's']) {
    const n = Math.floor(rest / UNITS[unit]);
    rest -= n * UNITS[unit];
    if (n > 0) parts.push(`${n}${unit}`);
  }
  return parts.join(' ');
}
