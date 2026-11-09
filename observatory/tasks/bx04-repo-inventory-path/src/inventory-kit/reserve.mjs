/**
 * Livro de reservas com prazo de validade (TTL) e idempotência por chave.
 *
 * Tempos são inteiros em segundos. Uma reserva criada em `now` com `ttl`
 * expira em `expiresAt = now + ttl`.
 */

function assertTime(now) {
  if (!Number.isInteger(now)) throw new TypeError('now deve ser inteiro');
}

export class ReservationBook {
  #items = new Map();
  #defaultTtl;

  /** @param {{ defaultTtl?: number }} [options] */
  constructor({ defaultTtl = 900 } = {}) {
    if (!Number.isInteger(defaultTtl) || defaultTtl < 1) throw new RangeError('defaultTtl inválido');
    this.#defaultTtl = defaultTtl;
  }

  #active(rec, now) {
    return now <= rec.expiresAt;
  }

  /**
   * Cria (ou reaproveita) a reserva da chave `key`.
   * @returns {{ key, sku, qty, createdAt, expiresAt, created: boolean }}
   */
  reserve({ key, sku, qty, now, ttl = this.#defaultTtl }) {
    if (typeof key !== 'string' || key === '') throw new TypeError('key inválida');
    assertTime(now);
    if (!Number.isInteger(qty) || qty < 1) throw new RangeError('qty inválida');
    if (!Number.isInteger(ttl) || ttl < 1) throw new RangeError('ttl inválido');
    const existing = this.#items.get(key);
    if (existing && this.#active(existing, now)) return { ...existing, created: false };
    this.#items.delete(key);
    const rec = { key, sku, qty, createdAt: now, expiresAt: now + ttl };
    this.#items.set(key, rec);
    return { ...rec, created: true };
  }

  /** Cópia da reserva ativa da chave, ou `null`. */
  get(key, now) {
    assertTime(now);
    const rec = this.#items.get(key);
    return rec && this.#active(rec, now) ? { ...rec } : null;
  }

  /** Remove a reserva; `true` somente se ela estava ativa. */
  release(key, now) {
    assertTime(now);
    const rec = this.#items.get(key);
    if (!rec) return false;
    this.#items.delete(key);
    return this.#active(rec, now);
  }

  /** Prorroga uma reserva ativa para `now + ttl` (nunca encurta). */
  extend(key, now, ttl = this.#defaultTtl) {
    assertTime(now);
    const rec = this.#items.get(key);
    if (!rec || !this.#active(rec, now)) return false;
    rec.expiresAt = Math.max(rec.expiresAt, now + ttl);
    return true;
  }

  /** Soma das quantidades ativas do `sku`. */
  reservedQty(sku, now) {
    assertTime(now);
    let total = 0;
    for (const rec of this.#items.values()) if (rec.sku === sku && this.#active(rec, now)) total += rec.qty;
    return total;
  }

  /** Remove as reservas expiradas; devolve as chaves removidas na ordem de criação. */
  purge(now) {
    assertTime(now);
    const removed = [];
    for (const [key, rec] of this.#items) {
      if (!this.#active(rec, now)) removed.push(key);
    }
    for (const key of removed) this.#items.delete(key);
    return removed;
  }

  /** Número de reservas guardadas (ativas ou ainda não purgadas). */
  get size() {
    return this.#items.size;
  }
}
