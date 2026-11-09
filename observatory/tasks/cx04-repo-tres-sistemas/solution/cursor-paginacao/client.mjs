/**
 * Cliente de paginação: percorre um endpoint `fetchPage({ limit, cursor })`
 * que devolve `{ items, nextCursor }` (ver server.mjs).
 */

/**
 * Itera as páginas do endpoint, na ordem, até `nextCursor` ser `null`.
 * Cada valor produzido é `{ index, items }`, com `index` começando em 0 e
 * `items` = os itens NOVOS daquela página.
 *
 * @param {(q:{limit:number, cursor:string|null}) => Promise<{items:Array, nextCursor:string|null}>} fetchPage
 * @param {{limit?:number, maxPages?:number}} [opts]
 */
export async function* iteratePages(fetchPage, { limit = 50, maxPages = 1000 } = {}) {
  let cursor = null;
  const seen = new Set();
  for (let index = 0; index < maxPages; index++) {
    const page = await fetchPage({ limit, cursor });
    if (!page || !Array.isArray(page.items)) throw new TypeError('resposta de página inválida');
    yield { index, items: page.items };
    if (page.nextCursor === null || page.nextCursor === undefined) return;
    if (seen.has(page.nextCursor)) throw new Error(`cursor repetido: ${page.nextCursor}`);
    seen.add(page.nextCursor);
    cursor = page.nextCursor;
  }
  throw new Error(`limite de ${maxPages} páginas excedido`);
}

/** Coleta todos os itens, na ordem do servidor. */
export async function fetchAll(fetchPage, opts) {
  const out = [];
  for await (const page of iteratePages(fetchPage, opts)) out.push(...page.items);
  return out;
}

/**
 * Primeiro item que satisfaz `pred`, parando de buscar páginas assim que o
 * encontrar; `undefined` se nenhum satisfizer.
 */
export async function findFirst(fetchPage, pred, opts) {
  for await (const page of iteratePages(fetchPage, opts)) {
    const hit = page.items.find(pred);
    if (hit !== undefined) return hit;
  }
  return undefined;
}
