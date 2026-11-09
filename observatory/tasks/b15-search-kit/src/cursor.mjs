/**
 * Paginação por chave (keyset) com cursores opacos em base64url.
 *
 * Um cursor é o JSON `{"s":sortKey,"d":direction,"k":valor,"id":id}` do
 * último item da página, codificado em UTF-8 e base64url sem padding.
 */

const B64URL = /^[A-Za-z0-9_-]+$/;

export function encodeCursor(value) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

/** Decodifica estritamente; qualquer cursor malformado → RangeError. */
export function decodeCursor(cursor) {
  if (typeof cursor !== 'string' || !B64URL.test(cursor) || cursor.length % 4 === 1) {
    throw new RangeError('cursor inválido');
  }
  let value;
  try {
    value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    throw new RangeError('cursor inválido');
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new RangeError('cursor inválido');
  return value;
}

function cmp(x, y) {
  if (x === y) return 0;
  return x < y ? -1 : 1;
}

/**
 * Página de `items` (objetos com `id` string único e o campo `sortKey`),
 * ordenada por `sortKey` (asc ou desc) e, em empate, por `id` sempre
 * crescente. `after` é o cursor devolvido pela página anterior.
 */
export function paginate(items, { sortKey, limit = 20, after = null, direction = 'asc' } = {}) {
  if (typeof sortKey !== 'string') throw new TypeError('sortKey deve ser string');
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError('limit deve ser inteiro >= 1');
  if (direction !== 'asc' && direction !== 'desc') throw new RangeError('direction inválida');
  const sign = direction === 'desc' ? -1 : 1;
  const order = (a, b) => sign * cmp(a.k, b.k) || cmp(a.id, b.id);
  const rows = items.map((item) => ({ k: item[sortKey], id: item.id, item })).sort(order);
  let start = 0;
  if (after !== null) {
    const c = decodeCursor(after);
    if (c.s !== sortKey || c.d !== direction) throw new RangeError('cursor de outra ordenação');
    start = rows.findIndex((r) => order(r, c) > 0);
    if (start === -1) start = rows.length;
  }
  const page = rows.slice(start, start + limit);
  const hasMore = start + limit <= rows.length;
  const last = page[page.length - 1];
  return {
    items: page.map((r) => r.item),
    nextCursor: hasMore ? encodeCursor({ s: sortKey, d: direction, k: last.k, id: last.id }) : null,
  };
}

/** Percorre todas as páginas e devolve os itens na ordem final (útil para testes). */
export function collectAll(items, options = {}) {
  const out = [];
  let after = null;
  for (;;) {
    const { items: page, nextCursor } = paginate(items, { ...options, after });
    out.push(...page);
    if (nextCursor === null) return out;
    after = nextCursor;
  }
}
