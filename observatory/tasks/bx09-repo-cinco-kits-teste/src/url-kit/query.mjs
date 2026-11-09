/**
 * Query strings no formato application/x-www-form-urlencoded.
 */

function decode(s) {
  try {
    return decodeURIComponent(s).replace(/\+/g, ' ');
  } catch {
    return s.replace(/\+/g, ' ');
  }
}

/**
 * parseQuery(qs) → objeto simples.
 *  - '?' inicial opcional; pares separados por '&'; pares vazios são ignorados;
 *  - chave e valor separados pelo primeiro '='; par sem '=' tem valor '';
 *  - '+' significa espaço; depois aplica-se a decodificação percentual
 *    (sequência % malformada: o texto fica como está);
 *  - chave repetida vira array com os valores na ordem em que aparecem.
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
 * stringifyQuery(obj) → 'a=1&b=x%20y' (sem '?').
 *  - chaves na ordem de inserção; chave e valor com encodeURIComponent;
 *  - undefined é omitido; null gera só a chave ('flag');
 *  - arrays geram um par por elemento (elementos undefined são omitidos).
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
