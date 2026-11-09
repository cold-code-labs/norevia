/**
 * Endpoint de listagem paginada do ranking (lado servidor).
 */
import { sortItems } from './order.mjs';
import { encodeCursor, decodeCursor, compareToKey } from './cursor.mjs';

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/**
 * Devolve uma página do ranking.
 *
 * @param {Array<{id:string, score:number}>} items coleção completa (qualquer ordem)
 * @param {{limit?:number, cursor?:string|null}} [query]
 * @returns {{items:Array, nextCursor:string|null}}
 */
export function listPage(items, { limit = DEFAULT_LIMIT, cursor = null } = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new RangeError(`limit deve ser inteiro em [1, ${MAX_LIMIT}]: ${limit}`);
  }
  const sorted = sortItems(items);
  let start = 0;
  if (cursor !== null && cursor !== undefined) {
    const key = decodeCursor(cursor);
    start = sorted.findIndex((it) => compareToKey(it, key) >= 0);
    if (start === -1) start = sorted.length;
  }
  const page = sorted.slice(start, start + limit);
  const hasMore = start + page.length < sorted.length;
  return {
    items: page,
    nextCursor: hasMore ? encodeCursor(page[page.length - 1]) : null,
  };
}

/**
 * Cria um `fetchPage` assíncrono (o formato esperado por client.mjs) servindo
 * a coleção dada. Conta as chamadas em `fetchPage.calls`.
 */
export function createEndpoint(items) {
  const snapshot = items.map((it) => ({ ...it }));
  const fetchPage = async (query) => {
    fetchPage.calls++;
    return listPage(snapshot, query);
  };
  fetchPage.calls = 0;
  return fetchPage;
}
