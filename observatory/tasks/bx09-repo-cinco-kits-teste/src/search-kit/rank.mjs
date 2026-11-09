/**
 * Ranqueamento BM25 sobre documentos já analisados (listas de termos).
 */

export const K1 = 1.2;
export const B = 0.75;

/**
 * Cria um índice a partir de `[{ id, terms }]`. `id` é string única; `terms`
 * é um array de strings (pode repetir). Os documentos recebidos não são
 * alterados nem referenciados pelo índice.
 */
export function createIndex(docs) {
  const df = new Map();
  const byId = new Map();
  let totalLength = 0;
  for (const doc of docs) {
    if (typeof doc?.id !== 'string') throw new TypeError('id deve ser string');
    if (!Array.isArray(doc.terms)) throw new TypeError('terms deve ser array');
    if (byId.has(doc.id)) throw new Error(`id duplicado: ${doc.id}`);
    const tf = new Map();
    for (const t of doc.terms) tf.set(t, (tf.get(t) ?? 0) + 1);
    for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    byId.set(doc.id, { id: doc.id, tf, length: doc.terms.length });
    totalLength += doc.terms.length;
  }
  const size = byId.size;
  return { size, avgLength: size ? totalLength / size : 0, df, docs: byId };
}

/** idf(t) = ln(1 + (N − df + 0,5) / (df + 0,5)). */
export function idf(index, term) {
  const n = index.df.get(term) ?? 0;
  return Math.log(1 + (index.size - n + 0.5) / (n + 0.5));
}

/** Pontuação BM25 do documento `id`; termos repetidos na consulta contam uma vez. */
export function score(index, id, queryTerms) {
  const doc = index.docs.get(id);
  if (!doc) throw new RangeError(`documento desconhecido: ${id}`);
  let s = 0;
  for (const term of new Set(queryTerms)) {
    const f = doc.tf.get(term) ?? 0;
    if (f === 0) continue;
    const norm = 1 - B + B * (doc.length / index.avgLength);
    s += idf(index, term) * ((f * (K1 + 1)) / (f + K1 * norm));
  }
  return s;
}

/**
 * Documentos com pontuação > 0, em ordem decrescente de pontuação; empates
 * por id crescente. Devolve no máximo `limit` itens `{ id, score }`.
 */
export function search(index, queryTerms, { limit = 10 } = {}) {
  if (!Number.isInteger(limit) || limit < 0) throw new RangeError('limit deve ser inteiro >= 0');
  const hits = [];
  for (const id of index.docs.keys()) {
    const s = score(index, id, queryTerms);
    if (s > 0) hits.push({ id, score: s });
  }
  hits.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return hits.slice(0, limit);
}
