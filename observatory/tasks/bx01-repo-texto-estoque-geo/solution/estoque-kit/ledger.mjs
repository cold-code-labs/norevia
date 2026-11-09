/**
 * Razão de estoque: registra entradas, saídas e ajustes por SKU.
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

  /** Entrada de `qty` unidades (inteiro > 0). */
  receive(sku, qty, ref = null) {
    assertQty(qty);
    this.#balances.set(sku, this.balance(sku) + qty);
    this.#record(sku, 'in', qty, ref);
    return this.balance(sku);
  }

  /** Saída de `qty` unidades; RangeError se o saldo for insuficiente (nada é registrado). */
  ship(sku, qty, ref = null) {
    assertQty(qty);
    const bal = this.balance(sku);
    if (qty > bal) throw new RangeError(`insufficient stock for ${sku}: ${bal} < ${qty}`);
    this.#balances.set(sku, bal - qty);
    this.#record(sku, 'out', qty, ref);
    return bal - qty;
  }

  /**
   * Ajuste de inventário: define o saldo como `count` (inteiro >= 0) e registra um
   * movimento 'adjust' cujo qty é a diferença (pode ser negativa). Diferença 0 não registra nada.
   */
  adjust(sku, count, ref = null) {
    if (!Number.isInteger(count) || count < 0) throw new RangeError('count must be a non-negative integer');
    const delta = count - this.balance(sku);
    if (delta === 0) return count;
    this.#balances.set(sku, count);
    this.#record(sku, 'adjust', delta, ref);
    return count;
  }

  /** Saldo atual; SKU desconhecido → 0. */
  balance(sku) {
    return this.#balances.get(sku) ?? 0;
  }

  /** Movimentos do SKU, do mais antigo ao mais recente, como cópias independentes. */
  history(sku) {
    return (this.#moves.get(sku) ?? []).map((m) => ({ ...m }));
  }

  /** SKUs com saldo > 0, em ordem crescente. */
  skus() {
    return [...this.#balances].filter(([, q]) => q > 0).map(([s]) => s).sort();
  }
}
