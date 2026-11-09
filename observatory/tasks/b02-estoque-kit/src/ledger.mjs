/**
 * Stock ledger: records receipts, shipments and adjustments per SKU.
 */

function assertQty(qty) {
  if (!Number.isInteger(qty) || qty <= 0) throw new RangeError('qty must be a positive integer');
}

export class StockLedger {
  /** @type {Map<string, {type: string, qty: number, ref: string|null}[]>} */
  #moves = new Map();
  /** @type {Map<string, number>} */
  #balances = new Map();

  #record(sku, type, qty, ref) {
    if (!this.#moves.has(sku)) this.#moves.set(sku, []);
    this.#moves.get(sku).push({ type, qty, ref });
  }

  /** Receipt of `qty` units (integer > 0). */
  receive(sku, qty, ref = null) {
    assertQty(qty);
    this.#balances.set(sku, this.balance(sku) + qty);
    this.#record(sku, 'in', qty, ref);
    return this.balance(sku);
  }

  /** Shipment of `qty` units; RangeError if the balance is insufficient (nothing is recorded). */
  ship(sku, qty, ref = null) {
    assertQty(qty);
    const bal = this.balance(sku);
    if (qty > bal) throw new RangeError(`insufficient stock for ${sku}: ${bal} < ${qty}`);
    this.#balances.set(sku, bal - qty);
    this.#record(sku, 'out', qty, ref);
    return bal - qty;
  }

  /**
   * Inventory adjustment: sets the balance to `count` (integer >= 0) and records an
   * 'adjust' movement whose qty is the difference (may be negative). A difference of 0 records nothing.
   */
  adjust(sku, count, ref = null) {
    if (!Number.isInteger(count) || count < 0) throw new RangeError('count must be a non-negative integer');
    const delta = count - this.balance(sku);
    if (delta === 0) return count;
    this.#balances.set(sku, count);
    this.#record(sku, 'adjust', delta, ref);
    return count;
  }

  /** Current balance; unknown SKU → 0. */
  balance(sku) {
    return this.#balances.get(sku) ?? 0;
  }

  /** Movements of the SKU, from oldest to most recent, as independent copies. */
  history(sku) {
    return this.#moves.get(sku) ?? [];
  }

  /** SKUs with balance > 0, in ascending order. */
  skus() {
    return [...this.#balances].filter(([, q]) => q > 0).map(([s]) => s).sort();
  }
}
