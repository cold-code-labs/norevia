/**
 * Structural equality for "JSON-like" data plus Date.
 *
 * deepEqual(a, b):
 *   - primitive values follow the semantics of Object.is (NaN is equal to NaN;
 *     +0 and -0 are different);
 *   - objects can only be equal if they have the same prototype;
 *   - Date: equal if getTime() is equal by the same rule as primitives;
 *   - arrays: same length and equal elements, in order;
 *   - other objects: same set of own enumerable keys (order
 *     does not matter; an absent key is different from a key with value undefined) and
 *     equal values key by key;
 *   - functions and symbols are only equal to themselves.
 * Cyclic structures are not supported.
 */
export function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    // NaN is the only value different from itself
    return Number.isNaN(a) && Number.isNaN(b);
  }
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;

  if (a instanceof Date) return deepEqual(a.getTime(), b.getTime());

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.hasOwn(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

/**
 * Index of the first element of `list` structurally equal to `value`, or -1.
 */
export function indexOfDeep(list, value) {
  for (let i = 0; i < list.length; i++) {
    if (deepEqual(list[i], value)) return i;
  }
  return -1;
}

/**
 * Removes structural duplicates, keeping the first occurrence of each value.
 */
export function uniqueDeep(list) {
  const out = [];
  for (const item of list) {
    if (indexOfDeep(out, item) === -1) out.push(item);
  }
  return out;
}
