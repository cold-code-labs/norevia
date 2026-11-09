/**
 * Cursores opacos para paginação por chave (keyset).
 *
 * Um cursor identifica uma POSIÇÃO na ordem canônica (ver order.mjs) pela
 * chave `{ score, id }` de um item. O token é o JSON `[score, id]` codificado
 * em base64url sem padding.
 */

/**
 * @param {{score:number, id:string}} item
 * @returns {string}
 */
export function encodeCursor(item) {
  return Buffer.from(JSON.stringify([item.score, item.id]), 'utf8').toString('base64url');
}

/**
 * @param {string} token
 * @returns {{score:number, id:string}}
 * @throws {SyntaxError} se o token não for um cursor válido
 */
export function decodeCursor(token) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]+$/.test(token)) throw new SyntaxError(`cursor inválido: ${token}`);
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
  } catch {
    throw new SyntaxError(`cursor inválido: ${token}`);
  }
  if (!Array.isArray(parsed) || parsed.length !== 2) throw new SyntaxError(`cursor inválido: ${token}`);
  const [score, id] = parsed;
  if (typeof score !== 'number' || !Number.isFinite(score) || typeof id !== 'string' || id === '') {
    throw new SyntaxError(`cursor inválido: ${token}`);
  }
  return { score, id };
}

/**
 * Compara a posição de `item` com a posição marcada por `key` na ordem canônica.
 * O item da chave não precisa existir na coleção (pode ter sido removido).
 * @returns {number} negativo se `item` vem antes da chave, 0 se tem a mesma
 *   chave, positivo se vem depois
 */
export function compareToKey(item, key) {
  if (item.score !== key.score) return item.score > key.score ? -1 : 1;
  if (item.id === key.id) return 0;
  return item.id < key.id ? -1 : 1;
}
