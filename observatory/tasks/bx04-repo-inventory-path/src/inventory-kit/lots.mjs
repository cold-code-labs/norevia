/**
 * Lotes de estoque e ordem FIFO.
 *
 * Um lote é `{ id, sku, qty, receivedAt, expiresOn? }`, com datas no formato
 * 'YYYY-MM-DD' (calendário gregoriano, sem fuso horário).
 */

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86400000;

/**
 * Converte 'YYYY-MM-DD' no número de dias desde 1970-01-01.
 * Formato inválido ou data inexistente (ex.: '2023-02-29') → RangeError.
 */
export function parseDate(text) {
  const m = typeof text === 'string' ? DATE_RE.exec(text) : null;
  if (!m) throw new RangeError(`data inválida: ${text}`);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const ms = Date.UTC(y, mo - 1, d);
  const back = new Date(ms);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) {
    throw new RangeError(`data inválida: ${text}`);
  }
  return Math.round(ms / DAY_MS);
}

/** Dias de `from` até `to` (negativo se `to` for anterior). */
export function daysBetween(from, to) {
  return parseDate(to) - parseDate(from);
}

/** Comparador FIFO: `receivedAt` mais antigo primeiro; empate pelo `id`. */
export function compareFifo(a, b) {
  const d = parseDate(a.receivedAt) - parseDate(b.receivedAt);
  if (d !== 0) return d;
  return a.id.localeCompare(b.id);
}

/** Novo array em ordem FIFO; o array recebido não é alterado. */
export function sortFifo(lots) {
  return lots.slice().sort(compareFifo);
}

/**
 * Um lote é utilizável em `today` quando tem `qty > 0`, já foi recebido
 * (`receivedAt <= today`) e, se tiver validade, ainda restam pelo menos
 * `minShelfDays` dias até `expiresOn` (o lote vale até o fim desse dia).
 */
export function isUsable(lot, today, { minShelfDays = 0 } = {}) {
  if (!(lot.qty > 0)) return false;
  if (daysBetween(lot.receivedAt, today) < 0) return false;
  if (lot.expiresOn == null) return true;
  return daysBetween(today, lot.expiresOn) >= minShelfDays;
}

/** Lotes utilizáveis em `today`, em ordem FIFO. */
export function usableLots(lots, today, options = {}) {
  return sortFifo(lots.filter((lot) => isUsable(lot, today, options)));
}

/**
 * Lotes com `qty > 0` e validade entre `today` e `today + days` (ambos
 * inclusivos), ordenados por `expiresOn` e, em empate, pela ordem FIFO.
 */
export function expiringSoon(lots, today, days) {
  return lots
    .filter((lot) => {
      if (!(lot.qty > 0) || lot.expiresOn == null) return false;
      const left = daysBetween(today, lot.expiresOn);
      return left >= 0 && left <= days;
    })
    .sort((a, b) => parseDate(a.expiresOn) - parseDate(b.expiresOn) || compareFifo(a, b));
}

/** Soma de `qty` por `sku`, em um `Map` com chaves na ordem de primeira aparição. */
export function totalsBySku(lots) {
  const out = new Map();
  for (const lot of lots) out.set(lot.sku, (out.get(lot.sku) ?? 0) + lot.qty);
  return out;
}
