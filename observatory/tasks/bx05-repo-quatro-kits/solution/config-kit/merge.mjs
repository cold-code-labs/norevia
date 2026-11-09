/**
 * Mesclagem profunda de objetos de configuração.
 */

export function isPlainObject(v) {
  if (v === null || typeof v !== 'object') return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

function clone(v) {
  if (Array.isArray(v)) return v.map(clone);
  if (isPlainObject(v)) {
    const out = {};
    for (const [k, x] of Object.entries(v)) out[k] = clone(x);
    return out;
  }
  return v;
}

/**
 * deepMerge(base, override) → novo objeto; nenhum argumento é alterado e o resultado
 * não compartilha objetos/arrays com as entradas.
 *
 * - Objetos simples presentes nos dois lados são mesclados recursivamente.
 * - Arrays e demais valores do override substituem os da base (arrays não são concatenados).
 * - Chaves cujo valor no override é `undefined` são ignoradas.
 */
export function deepMerge(base, override) {
  const out = clone(base);
  for (const [k, v] of Object.entries(override)) {
    if (v === undefined) continue;
    if (isPlainObject(v) && isPlainObject(out[k])) out[k] = deepMerge(out[k], v);
    else out[k] = clone(v);
  }
  return out;
}

/** Mescla camadas da esquerda para a direita, ignorando camadas null/undefined. */
export function mergeAll(...layers) {
  return layers.filter((l) => l != null).reduce((acc, l) => deepMerge(acc, l), {});
}
