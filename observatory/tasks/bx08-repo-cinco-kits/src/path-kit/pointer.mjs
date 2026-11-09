/**
 * JSON Pointer (RFC 6901): conversão entre texto e lista de tokens e leitura
 * de valores dentro de documentos JSON.
 */

const INDEX_RE = /^[0-9]+$/;
const MISSING = Symbol('missing');

function decodeToken(token) {
  if (/~(?![01])/.test(token)) throw new SyntaxError(`escape inválido no token "${token}"`);
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

/** Escapa um token: `~` → `~0` e `/` → `~1`. */
export function escapeToken(token) {
  return String(token).replace(/~/g, '~0').replace(/\//g, '~1');
}

/** `''` → `[]`; `'/a~1b/0'` → `['a/b', '0']`. */
export function parsePointer(pointer) {
  if (typeof pointer !== 'string') throw new TypeError('o ponteiro deve ser uma string');
  if (pointer === '') return [];
  if (pointer[0] !== '/') throw new SyntaxError(`ponteiro deve começar com "/": ${pointer}`);
  return pointer.slice(1).split('/').map(decodeToken);
}

/** Inverso de `parsePointer`. */
export function formatPointer(tokens) {
  if (!Array.isArray(tokens)) throw new TypeError('tokens deve ser um array');
  return tokens.map((t) => '/' + escapeToken(t)).join('');
}

function step(container, token) {
  if (Array.isArray(container)) {
    if (!INDEX_RE.test(token)) return MISSING;
    const i = Number(token);
    return i < container.length ? container[i] : MISSING;
  }
  if (container !== null && typeof container === 'object' && Object.hasOwn(container, token)) {
    return container[token];
  }
  return MISSING;
}

function resolve(doc, pointer) {
  let cur = doc;
  for (const token of parsePointer(pointer)) {
    cur = step(cur, token);
    if (cur === MISSING) return MISSING;
  }
  return cur;
}

/** Valor apontado por `pointer`, ou `fallback` se o caminho não existir. */
export function getAt(doc, pointer, fallback = undefined) {
  const v = resolve(doc, pointer);
  return v === MISSING ? fallback : v;
}

/** `true` se o caminho existe (mesmo que o valor seja `undefined`). */
export function hasAt(doc, pointer) {
  return resolve(doc, pointer) !== MISSING;
}

/** `true` se `ancestor` é igual a `pointer` ou aponta para um ancestral dele. */
export function covers(ancestor, pointer) {
  const a = parsePointer(ancestor);
  const p = parsePointer(pointer);
  return a.length <= p.length && a.every((t, i) => t === p[i]);
}
