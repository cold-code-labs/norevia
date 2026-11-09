/**
 * Access-control policy evaluator.
 *
 * A policy is `{ name?, statements: Statement[] }`. Each statement
 * (`Statement`) has the form:
 *
 *   {
 *     id?: string,
 *     effect: 'allow' | 'deny',
 *     principals?: string[],      // '*', 'user:<id>', 'group:<name>'
 *     actions?: string[],         // exactly one of actions / notActions
 *     notActions?: string[],
 *     resources?: string[],       // omitted = ['**']
 *     conditions?: { key, op, value }[],
 *   }
 *
 * A request is `{ principal, action, resource, context? }`, where
 * `principal` is `{ id, groups? }` or `null` (anonymous).
 *
 * The combination is deny-overrides: any applicable `deny` wins; without a `deny`,
 * any applicable `allow` grants; with neither, the deny is implicit.
 */

const EFFECTS = new Set(['allow', 'deny']);
const OPERATORS = new Set(['eq', 'ne', 'in', 'notIn', 'prefix', 'lt', 'lte', 'gt', 'gte', 'between']);
const LIST_FIELDS = ['principals', 'actions', 'notActions', 'resources'];

function hasOwn(obj, key) {
  return obj != null && Object.prototype.hasOwnProperty.call(obj, key);
}

function isNum(x) {
  return typeof x === 'number' && Number.isFinite(x);
}

/**
 * Matches a single segment against a pattern in which each `*` stands for zero or more
 * arbitrary characters. The other characters are literals.
 * @param {string} pattern
 * @param {string} value
 * @returns {boolean}
 */
export function matchSegment(pattern, value) {
  let p = 0;
  let v = 0;
  let star = -1;
  let mark = 0;
  while (v < value.length) {
    if (p < pattern.length && pattern[p] === '*') {
      star = p;
      mark = v;
      p++;
    } else if (p < pattern.length && pattern[p] === value[v]) {
      p++;
      v++;
    } else if (star !== -1) {
      p = star + 1;
      mark++;
      v = mark;
    } else {
      return false;
    }
  }
  while (p < pattern.length && pattern[p] === '*') p++;
  return p === pattern.length;
}

function matchSegments(patterns, values, pi, vi) {
  while (pi < patterns.length) {
    const seg = patterns[pi];
    if (seg === '**') {
      if (pi === patterns.length - 1) return true;
      for (let k = vi; k <= values.length; k++) {
        if (matchSegments(patterns, values, pi + 1, k)) return true;
      }
      return false;
    }
    if (vi >= values.length || !matchSegment(seg, values[vi])) return false;
    pi++;
    vi++;
  }
  return vi === values.length;
}

/**
 * Matches `value` against `pattern`, both split into segments by `separator`.
 * A pattern segment equal to `**` matches zero or more whole segments;
 * any other segment matches exactly one segment (via `matchSegment`).
 * @param {string} pattern
 * @param {string} value
 * @param {{ separator?: string, ignoreCase?: boolean }} [options]
 */
export function matchPattern(pattern, value, { separator = '/', ignoreCase = false } = {}) {
  if (typeof pattern !== 'string' || typeof value !== 'string') return false;
  const p = ignoreCase ? pattern.toLowerCase() : pattern;
  const v = ignoreCase ? value.toLowerCase() : value;
  return matchSegments(p.split(separator), v.split(separator), 0, 0);
}

/** Actions: segments separated by `:`, case-insensitive. */
export function matchAction(pattern, action) {
  return matchPattern(pattern, action, { separator: ':', ignoreCase: true });
}

/** Resources: segments separated by `/`, case-sensitive. */
export function matchResource(pattern, resource) {
  return matchPattern(pattern, resource, { separator: '/' });
}

/**
 * Omitted `principals` matches any request, including anonymous ones. Otherwise,
 * it is enough for one item to match: `'*'` (any authenticated principal),
 * `'user:<id>'` (exact id) or `'group:<name>'` (name present in `groups`).
 */
export function matchPrincipal(principals, principal) {
  if (principals === undefined) return true;
  if (!principal || typeof principal.id !== 'string') return false;
  const groups = Array.isArray(principal.groups) ? principal.groups : [];
  return principals.some((p) => {
    if (p === '*') return true;
    if (p.startsWith('user:')) return p.slice(5) === principal.id;
    if (p.startsWith('group:')) return groups.includes(p.slice(6));
    return false;
  });
}

/**
 * Evaluates a condition against the context. An absent (not own) key or one with
 * value `undefined` makes the condition false, whatever the operator.
 */
export function testCondition(cond, context = {}) {
  if (!hasOwn(context, cond.key) || context[cond.key] === undefined) return false;
  const a = context[cond.key];
  const v = cond.value;
  switch (cond.op) {
    case 'eq': return a === v;
    case 'ne': return a !== v;
    case 'in': return Array.isArray(v) && v.some((x) => x === a);
    case 'notIn': return Array.isArray(v) && !v.some((x) => x === a);
    case 'prefix': return typeof a === 'string' && typeof v === 'string' && a.startsWith(v);
    case 'lt': return isNum(a) && isNum(v) && a < v;
    case 'lte': return isNum(a) && isNum(v) && a <= v;
    case 'gt': return isNum(a) && isNum(v) && a > v;
    case 'gte': return isNum(a) && isNum(v) && a >= v;
    case 'between': {
      if (!isNum(a) || v == null || !isNum(v.min) || !isNum(v.max)) return false;
      const lowOk = v.exclusiveMin ? a > v.min : a >= v.min;
      const highOk = v.exclusiveMax ? a < v.max : a <= v.max;
      return lowOk && highOk;
    }
    default: return false;
  }
}

function statementId(st, index) {
  return typeof st.id === 'string' && st.id !== '' ? st.id : `#${index}`;
}

/**
 * Checks, in the order principal → action → resource → conditions, whether the statement
 * applies. Returns `null` when it applies or the name of the first check
 * that failed: 'principal', 'action', 'resource' or 'condition:<index>'.
 */
function checkStatement(st, request) {
  if (!matchPrincipal(st.principals, request.principal)) return 'principal';
  const action = request.action;
  if (st.actions !== undefined) {
    if (!st.actions.some((p) => matchAction(p, action))) return 'action';
  } else if (st.notActions.some((p) => matchAction(p, action))) {
    return 'action';
  }
  const resources = st.resources ?? ['**'];
  if (!resources.some((p) => matchResource(p, request.resource))) return 'resource';
  const conditions = st.conditions ?? [];
  const context = request.context ?? {};
  for (let i = 0; i < conditions.length; i++) {
    if (!testCondition(conditions[i], context)) return `condition:${i}`;
  }
  return null;
}

/**
 * Validates the structure of the policy. Returns the list of error messages (empty
 * when valid), in statement order.
 * @returns {string[]}
 */
export function validatePolicy(policy) {
  if (!policy || !Array.isArray(policy.statements)) return ['statements deve ser um array'];
  const errors = [];
  const seen = new Set();
  policy.statements.forEach((st, i) => {
    const where = `#${i}`;
    if (!st || typeof st !== 'object') {
      errors.push(`${where}: instrução inválida`);
      return;
    }
    if (!EFFECTS.has(st.effect)) errors.push(`${where}: effect inválido`);
    if ((st.actions !== undefined) === (st.notActions !== undefined)) {
      errors.push(`${where}: use exatamente um de actions/notActions`);
    }
    for (const k of LIST_FIELDS) {
      if (st[k] !== undefined && !(Array.isArray(st[k]) && st[k].every((s) => typeof s === 'string'))) {
        errors.push(`${where}: ${k} deve ser um array de strings`);
      }
    }
    if (st.id !== undefined) {
      if (seen.has(st.id)) errors.push(`${where}: id duplicado "${st.id}"`);
      seen.add(st.id);
    }
    for (const c of st.conditions ?? []) {
      if (!OPERATORS.has(c?.op)) errors.push(`${where}: operador desconhecido "${c?.op}"`);
    }
  });
  return errors;
}

function assertUsable(policy, request) {
  const errors = validatePolicy(policy);
  if (errors.length) throw new TypeError(errors[0]);
  if (!request || typeof request.action !== 'string' || typeof request.resource !== 'string') {
    throw new TypeError('requisição inválida');
  }
}

function collect(policy, request) {
  const allows = [];
  const denies = [];
  policy.statements.forEach((st, i) => {
    if (checkStatement(st, request) !== null) return;
    (st.effect === 'deny' ? denies : allows).push(statementId(st, i));
  });
  return { allows, denies };
}

function decide(allows, denies) {
  if (denies.length) return { decision: 'deny', reason: 'explicit-deny', matched: denies };
  if (allows.length) return { decision: 'allow', reason: 'allowed', matched: allows };
  return { decision: 'deny', reason: 'implicit-deny', matched: [] };
}

/**
 * Decides the request against a policy.
 * @returns {{ decision: 'allow'|'deny', reason: 'allowed'|'explicit-deny'|'implicit-deny', matched: string[] }}
 */
export function evaluate(policy, request) {
  assertUsable(policy, request);
  const { allows, denies } = collect(policy, request);
  return decide(allows, denies);
}

/** Shortcut: `true` iff `evaluate(...).decision === 'allow'`. */
export function isAllowed(policy, request) {
  return evaluate(policy, request).decision === 'allow';
}

/**
 * Combines several policies with deny-overrides. The ids get the prefix
 * `<policy name>/` (or `#<policy index>/` when unnamed).
 */
export function evaluateAll(policies, request) {
  const allows = [];
  const denies = [];
  policies.forEach((policy, pi) => {
    assertUsable(policy, request);
    const prefix = typeof policy.name === 'string' && policy.name !== '' ? policy.name : `#${pi}`;
    const r = collect(policy, request);
    for (const id of r.allows) allows.push(`${prefix}/${id}`);
    for (const id of r.denies) denies.push(`${prefix}/${id}`);
  });
  return decide(allows, denies);
}

/**
 * Traces each statement, in policy order.
 * @returns {{ id: string, effect: string, applies: boolean, failed: string|null }[]}
 */
export function explain(policy, request) {
  assertUsable(policy, request);
  return policy.statements.map((st, i) => {
    const failed = checkStatement(st, request);
    return { id: statementId(st, i), effect: st.effect, applies: failed === null, failed };
  });
}

/**
 * Among `actions`, returns the ones allowed for `request` (without `action`), in
 * input order, without repetitions: actions that are equal ignoring case count
 * as the same and the spelling of the first occurrence wins.
 */
export function allowedActions(policy, request, actions) {
  const seen = new Set();
  const out = [];
  for (const action of actions) {
    const key = action.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (isAllowed(policy, { ...request, action })) out.push(action);
  }
  return out;
}
