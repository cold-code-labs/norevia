/**
 * Deep merge of configuration objects.
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
 * deepMerge(base, override) → new object; no argument is changed and the result
 * shares no objects/arrays with the inputs.
 *
 * - Plain objects present on both sides are merged recursively.
 * - Arrays and other override values replace those of the base (arrays are not concatenated).
 * - Keys whose value in the override is `undefined` are ignored.
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

/** Merges layers from left to right, ignoring null/undefined layers. */
export function mergeAll(...layers) {
  return layers.filter((l) => l != null).reduce((acc, l) => deepMerge(acc, l), {});
}
