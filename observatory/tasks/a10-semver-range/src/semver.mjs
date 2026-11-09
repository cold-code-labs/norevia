/**
 * Semantic versions (SemVer 2.0.0) and dependency range resolution.
 *
 * A parsed version is an object
 *   { major, minor, patch, prerelease: (number|string)[], build: string[], version }
 * where `version` is the canonical form "M.m.p[-pre]" (without build).
 *
 * A parsed range is an array of sets (OR); each set is an array of
 * comparators (AND) in the format { op, semver } with op ∈ '<' '<=' '>' '>=' '='.
 */

const NUM = '0|[1-9]\\d*';
const PRE_ID = '(?:0|[1-9]\\d*|\\d*[A-Za-z-][0-9A-Za-z-]*)';
const PRE = `${PRE_ID}(?:\\.${PRE_ID})*`;
const BUILD = '[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*';
const XNUM = `${NUM}|[xX*]`;

const FULL_RE = new RegExp(`^v?(${NUM})\\.(${NUM})\\.(${NUM})(?:-(${PRE}))?(?:\\+(${BUILD}))?$`);
const PARTIAL_RE = new RegExp(`^v?(${XNUM})(?:\\.(${XNUM})(?:\\.(${XNUM})(?:-(${PRE}))?(?:\\+(${BUILD}))?)?)?$`);

function toNum(s) {
  const n = Number(s);
  return Number.isSafeInteger(n) ? n : null;
}

function splitPre(s) {
  if (!s) return [];
  return s.split('.').map((id) => (/^\d+$/.test(id) ? toNum(id) : id));
}

function canonical(major, minor, patch, prerelease) {
  const core = `${major}.${minor}.${patch}`;
  return prerelease.length ? `${core}-${prerelease.join('.')}` : core;
}

function make(major, minor, patch, prerelease = [], build = []) {
  return { major, minor, patch, prerelease, build, version: canonical(major, minor, patch, prerelease) };
}

/**
 * Parses a full version. Accepts surrounding whitespace and a leading "v".
 * Returns null for any invalid input (including non-strings).
 */
export function parse(input) {
  if (typeof input !== 'string') return null;
  const m = FULL_RE.exec(input.trim());
  if (!m) return null;
  const [major, minor, patch] = [m[1], m[2], m[3]].map(toNum);
  const prerelease = splitPre(m[4]);
  if (major === null || minor === null || patch === null || prerelease.includes(null)) return null;
  return make(major, minor, patch, prerelease, m[5] ? m[5].split('.') : []);
}

/** Canonical version (without build) or null if invalid. */
export function valid(input) {
  const v = parse(input);
  return v ? v.version : null;
}

function coerce(v) {
  if (v && typeof v === 'object' && typeof v.major === 'number') return v;
  const p = parse(v);
  if (!p) throw new TypeError(`invalid version: ${String(v)}`);
  return p;
}

function compareIdentifiers(a, b) {
  const an = typeof a === 'number';
  const bn = typeof b === 'number';
  if (an && bn) return a === b ? 0 : a < b ? -1 : 1;
  if (an) return -1;
  if (bn) return 1;
  return a === b ? 0 : a < b ? -1 : 1;
}

function comparePre(a, b) {
  if (!a.length && !b.length) return 0;
  if (!a.length) return 1;
  if (!b.length) return -1;
  for (let i = 0; ; i++) {
    if (i >= a.length && i >= b.length) return 0;
    if (i >= a.length) return -1;
    if (i >= b.length) return 1;
    const c = compareIdentifiers(a[i], b[i]);
    if (c !== 0) return c;
  }
}

/**
 * SemVer precedence: -1, 0 or 1. Build is ignored. Accepts strings or parsed
 * versions; invalid string → TypeError.
 */
export function compare(a, b) {
  const x = coerce(a);
  const y = coerce(b);
  for (const k of ['major', 'minor', 'patch']) {
    if (x[k] !== y[k]) return x[k] < y[k] ? -1 : 1;
  }
  return comparePre(x.prerelease, y.prerelease);
}

/**
 * Increments a version. `kind` ∈ 'major' | 'minor' | 'patch' | 'prerelease'.
 * The build is always discarded. Returns the canonical version.
 */
export function bump(version, kind) {
  const v = coerce(version);
  const { major, minor, patch } = v;
  const pre = v.prerelease;
  switch (kind) {
    case 'major':
      if (pre.length && minor === 0 && patch === 0) return canonical(major, 0, 0, []);
      return canonical(major + 1, 0, 0, []);
    case 'minor':
      if (pre.length && patch === 0) return canonical(major, minor, 0, []);
      return canonical(major, minor + 1, 0, []);
    case 'patch':
      if (pre.length) return canonical(major, minor, patch, []);
      return canonical(major, minor, patch + 1, []);
    case 'prerelease': {
      if (!pre.length) return canonical(major, minor, patch + 1, [0]);
      const next = pre.slice();
      const last = next[next.length - 1];
      if (typeof last === 'number') next[next.length - 1] = last + 1;
      else next.push(0);
      return canonical(major, minor, patch, next);
    }
    default:
      throw new RangeError(`unknown bump kind: ${kind}`);
  }
}

/** Sorted copy (ascending, stable); does not change the input. Invalid → TypeError. */
export function sort(versions) {
  const items = versions.map((s, i) => ({ s, v: coerce(s), i }));
  items.sort((a, b) => compare(a.v, b.v) || a.i - b.i);
  return items.map((e) => e.s);
}

// ---------------------------------------------------------------- ranges

function cmp(op, major, minor, patch, prerelease = []) {
  return { op, semver: make(major, minor, patch, prerelease) };
}

const ANY = () => cmp('>=', 0, 0, 0);
const NONE = () => cmp('<', 0, 0, 0);

function parsePartial(text) {
  const m = PARTIAL_RE.exec(text);
  if (!m) throw new SyntaxError(`invalid version in range: ${text}`);
  const parts = [m[1], m[2], m[3]].map((p) => (p === undefined || /^[xX*]$/.test(p) ? null : toNum(p)));
  const firstWild = parts.indexOf(null);
  if (firstWild !== -1 && parts.slice(firstWild).some((p) => p !== null)) {
    throw new SyntaxError(`invalid wildcard position: ${text}`);
  }
  const pre = splitPre(m[4]);
  if (pre.length && firstWild !== -1) throw new SyntaxError(`prerelease on partial version: ${text}`);
  return { M: parts[0], m: parts[1], p: parts[2], pre };
}

function primitive(op, P) {
  const { M, m, p, pre } = P;
  if (p !== null) {
    return [cmp(op || '=', M, m, p, pre)];
  }
  switch (op) {
    case '':
    case '=':
      if (M === null) return [ANY()];
      if (m === null) return [cmp('>=', M, 0, 0), cmp('<', M + 1, 0, 0)];
      return [cmp('>=', M, m, 0), cmp('<', M, m + 1, 0)];
    case '>=':
      if (M === null) return [ANY()];
      return [cmp('>=', M, m ?? 0, 0)];
    case '>':
      if (M === null) return [NONE()];
      if (m === null) return [cmp('>=', M + 1, 0, 0)];
      return [cmp('>=', M, m + 1, 0)];
    case '<':
      if (M === null) return [NONE()];
      return [cmp('<', M, m ?? 0, 0)];
    case '<=':
      if (M === null) return [ANY()];
      if (m === null) return [cmp('<', M + 1, 0, 0)];
      return [cmp('<', M, m + 1, 0)];
    default:
      throw new SyntaxError(`unknown operator: ${op}`);
  }
}

function tilde(P) {
  const { M, m, p, pre } = P;
  if (M === null) return [ANY()];
  if (m === null) return [cmp('>=', M, 0, 0), cmp('<', M + 1, 0, 0)];
  return [cmp('>=', M, m, p ?? 0, pre), cmp('<', M, m + 1, 0)];
}

function caret(P) {
  const { M, m, p, pre } = P;
  if (M === null) return [ANY()];
  if (m === null) return [cmp('>=', M, 0, 0), cmp('<', M + 1, 0, 0)];
  const lower = cmp('>=', M, m, p ?? 0, pre);
  if (M > 0) return [lower, cmp('<', M + 1, 0, 0)];
  if (m > 0 || p === null) return [lower, cmp('<', 0, m + 1, 0)];
  return [lower, cmp('<', 0, 0, p + 1)];
}

function hyphen(a, b) {
  const A = parsePartial(a);
  const B = parsePartial(b);
  const out = [cmp('>=', A.M ?? 0, A.m ?? 0, A.p ?? 0, A.pre)];
  if (B.M === null) return out;
  if (B.m === null) out.push(cmp('<', B.M + 1, 0, 0));
  else if (B.p === null) out.push(cmp('<', B.M, B.m + 1, 0));
  else out.push(cmp('<=', B.M, B.m, B.p, B.pre));
  return out;
}

function parseSet(text) {
  const s = text.trim().replace(/(<=|>=|<|>|=|~|\^)\s+/g, '$1');
  if (s === '') return [ANY()];
  const hy = /^(\S+)\s+-\s+(\S+)$/.exec(s);
  if (hy) return hyphen(hy[1], hy[2]);
  const out = [];
  for (const tok of s.split(/\s+/)) {
    const m = /^(<=|>=|<|>|=|~|\^)?(.*)$/.exec(tok);
    const op = m[1] ?? '';
    const P = parsePartial(m[2]);
    if (op === '~') out.push(...tilde(P));
    else if (op === '^') out.push(...caret(P));
    else out.push(...primitive(op, P));
  }
  return out;
}

/**
 * Parses a range ("^1.2.3 || >=2.0.0 <3", "1.2 - 2", "~0.4", "*", "").
 * Non-string → TypeError; invalid syntax → SyntaxError.
 */
export function parseRange(range) {
  if (typeof range !== 'string') throw new TypeError('range must be a string');
  return range.split('||').map(parseSet);
}

/** Normalized form: comparators separated by ' ', sets by ' || '. */
export function formatRange(range) {
  const sets = typeof range === 'string' ? parseRange(range) : range;
  return sets.map((set) => set.map((c) => c.op + c.semver.version).join(' ')).join(' || ');
}

function testComparator(c, v) {
  const r = compare(v, c.semver);
  switch (c.op) {
    case '<': return r < 0;
    case '<=': return r <= 0;
    case '>': return r > 0;
    case '>=': return r >= 0;
    default: return r === 0;
  }
}

function testSet(set, v) {
  for (const c of set) if (!testComparator(c, v)) return false;
  if (v.prerelease.length === 0) return true;
  for (const c of set) {
    const s = c.semver;
    if (s.major === v.major && s.minor === v.minor && s.patch === v.patch) return true;
  }
  return false;
}

function toSets(range) {
  return typeof range === 'string' ? parseRange(range) : range;
}

/** true if `version` satisfies some set of the range; invalid version → false. */
export function satisfies(version, range) {
  const sets = toSets(range);
  const v = parse(typeof version === 'string' ? version : version?.version ?? '');
  if (!v) return false;
  return sets.some((set) => testSet(set, v));
}

function pick(versions, range, sign) {
  const sets = toSets(range);
  let best = null;
  let bestV = null;
  for (const s of versions) {
    const v = parse(s);
    if (!v || !sets.some((set) => testSet(set, v))) continue;
    if (bestV === null || compare(v, bestV) * sign > 0) {
      best = s;
      bestV = v;
    }
  }
  return best;
}

/** Highest version in the list that satisfies the range (original string) or null. */
export function maxSatisfying(versions, range) {
  return pick(versions, range, 1);
}

/** Lowest version in the list that satisfies the range (original string) or null. */
export function minSatisfying(versions, range) {
  return pick(versions, range, -1);
}
