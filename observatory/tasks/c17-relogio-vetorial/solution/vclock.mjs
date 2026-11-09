/**
 * Relógios vetoriais esparsos: objetos { idDoNó: contador } em que chaves
 * ausentes valem 0. As funções nunca modificam os argumentos e devolvem
 * relógios normalizados (sem zeros, chaves em ordem crescente).
 */
const ID_RE = /^[a-z][a-z0-9_-]{0,15}$/;

export function assertId(id) {
  if (typeof id !== 'string') throw new TypeError('id de nó deve ser string');
  if (!ID_RE.test(id)) throw new RangeError(`id de nó inválido: ${JSON.stringify(id)}`);
  return id;
}

export function get(vc, id) {
  return Object.hasOwn(vc, id) ? vc[id] : 0;
}

export function normalize(vc) {
  if (vc === null || typeof vc !== 'object' || Array.isArray(vc)) throw new TypeError('relógio deve ser objeto');
  const out = {};
  for (const id of Object.keys(vc).sort()) {
    assertId(id);
    const n = vc[id];
    if (!Number.isSafeInteger(n) || n < 0) throw new RangeError(`contador inválido em ${id}: ${n}`);
    if (n > 0) out[id] = n;
  }
  return out;
}

export function tick(vc, id) {
  assertId(id);
  return normalize({ ...vc, [id]: get(vc, id) + 1 });
}

export function merge(a, b) {
  const out = { ...a };
  for (const id of Object.keys(b)) out[id] = Math.max(get(a, id), get(b, id));
  return normalize(out);
}

/** 'equal' | 'before' (a → b) | 'after' (b → a) | 'concurrent'. */
export function compare(a, b) {
  let less = false;
  let greater = false;
  for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = get(a, id);
    const y = get(b, id);
    if (x < y) less = true;
    else if (x > y) greater = true;
  }
  if (less && greater) return 'concurrent';
  if (less) return 'before';
  if (greater) return 'after';
  return 'equal';
}

export function happenedBefore(a, b) {
  return compare(a, b) === 'before';
}

export function isConcurrent(a, b) {
  return compare(a, b) === 'concurrent';
}

/** true sse a[k] <= b[k] para todo k diferente de `skip`. */
export function coveredExcept(a, b, skip) {
  for (const id of Object.keys(a)) {
    if (id === skip) continue;
    if (get(a, id) > get(b, id)) return false;
  }
  return true;
}

/** Soma dos contadores (nº de eventos na história causal). */
export function weight(vc) {
  let s = 0;
  for (const id of Object.keys(vc)) s += vc[id];
  return s;
}

/** Texto canônico "a:2,c:1" (chaves em ordem, zeros omitidos; relógio zero → ""). */
export function format(vc) {
  const n = normalize(vc);
  return Object.keys(n).map((id) => `${id}:${n[id]}`).join(',');
}

export function parse(text) {
  if (typeof text !== 'string') throw new TypeError('texto de relógio deve ser string');
  if (text === '') return {};
  const out = {};
  for (const part of text.split(',')) {
    const m = /^([^:]+):(\d+)$/.exec(part);
    if (!m) throw new RangeError(`componente inválido: ${JSON.stringify(part)}`);
    const id = assertId(m[1]);
    if (Object.hasOwn(out, id)) throw new RangeError(`componente repetido: ${id}`);
    out[id] = Number(m[2]);
  }
  return normalize(out);
}
