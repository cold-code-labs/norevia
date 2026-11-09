/**
 * Query strings in the application/x-www-form-urlencoded format.
 */

function decode(s) {
  try {
    return decodeURIComponent(s).replace(/\+/g, ' ');
  } catch {
    return s.replace(/\+/g, ' ');
  }
}

/**
 * parseQuery(qs) → plain object.
 *  - optional leading '?'; pairs separated by '&'; empty pairs are ignored;
 *  - key and value separated by the first '='; a pair without '=' has value '';
 *  - '+' means space; then percent-decoding is applied
 *    (malformed % sequence: the text stays as it is);
 *  - a repeated key becomes an array with the values in the order in which they appear.
 */
export function parseQuery(qs) {
  const out = {};
  const body = qs.startsWith('?') ? qs.slice(1) : qs;
  for (const pair of body.split('&')) {
    if (pair === '') continue;
    const eq = pair.indexOf('=');
    const key = decode(eq === -1 ? pair : pair.slice(0, eq));
    const value = eq === -1 ? '' : decode(pair.slice(eq + 1));
    if (!Object.hasOwn(out, key)) out[key] = value;
    else if (Array.isArray(out[key])) out[key].push(value);
    else out[key] = [out[key], value];
  }
  return out;
}

/**
 * stringifyQuery(obj) → 'a=1&b=x%20y' (without '?').
 *  - keys in insertion order; key and value with encodeURIComponent;
 *  - undefined is omitted; null produces only the key ('flag');
 *  - arrays produce one pair per element (undefined elements are omitted).
 */
export function stringifyQuery(obj) {
  const parts = [];
  const enc = encodeURIComponent;
  for (const [k, v] of Object.entries(obj)) {
    for (const item of Array.isArray(v) ? v : [v]) {
      if (item === undefined) continue;
      parts.push(item === null ? enc(k) : `${enc(k)}=${enc(String(item))}`);
    }
  }
  return parts.join('&');
}
