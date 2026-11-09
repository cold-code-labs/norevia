/**
 * Ordem canônica do ranking de agentes.
 *
 * Um item é `{ id: string, score: number, ... }`. A ordem total é:
 *   1. `score` decrescente;
 *   2. empate de `score`: `id` crescente (comparação de strings do JS, `<`).
 * Ids são únicos, então a ordem é total e estável entre chamadas.
 */

/** Valida um item do ranking. */
export function assertItem(item) {
  if (!item || typeof item !== 'object') throw new TypeError('item inválido');
  if (typeof item.id !== 'string' || item.id === '') throw new TypeError('item.id deve ser string não vazia');
  if (typeof item.score !== 'number' || !Number.isFinite(item.score)) throw new TypeError(`score inválido em ${item.id}`);
}

/**
 * Comparador da ordem canônica (convenção de Array.prototype.sort).
 * @returns {number} negativo se `a` vem antes de `b`
 */
export function compareItems(a, b) {
  if (a.score !== b.score) return b.score - a.score;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

/** Cópia ordenada; não altera a entrada. Ids repetidos → Error. */
export function sortItems(items) {
  const seen = new Set();
  for (const it of items) {
    assertItem(it);
    if (seen.has(it.id)) throw new Error(`id duplicado: ${it.id}`);
    seen.add(it.id);
  }
  return [...items].sort(compareItems);
}

/** Posição 1-based do item com `id` na ordem canônica, ou 0 se ausente. */
export function rankOf(items, id) {
  return sortItems(items).findIndex((it) => it.id === id) + 1;
}
