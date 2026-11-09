/**
 * Invoice assembly: item consolidation, minimum usage and credits.
 * Amounts in integer cents. The inputs are never changed.
 */

export const MINIMUM_SKU = 'MINIMUM';

function assertNonNegInt(v, name) {
  if (!Number.isSafeInteger(v) || v < 0) throw new RangeError(`${name} must be a non-negative integer`);
}

function consolidate(items) {
  const lines = [];
  const byKey = new Map();
  for (const it of items) {
    if (typeof it.sku !== 'string' || it.sku === '') throw new RangeError('sku required');
    assertNonNegInt(it.qty, 'qty');
    assertNonNegInt(it.unitCents, 'unitCents');
    if (it.qty === 0) continue;
    const key = `${it.sku}\u0000${it.unitCents}`;
    const found = byKey.get(key);
    if (found) {
      found.qty += it.qty;
      found.amount = found.qty * found.unitCents;
    } else {
      const line = { sku: it.sku, description: it.description ?? '', qty: it.qty, unitCents: it.unitCents, amount: it.qty * it.unitCents };
      byKey.set(key, line);
      lines.push(line);
    }
  }
  return lines;
}

function byExpiry(a, b) {
  if (a.expires === b.expires) return 0;
  if (a.expires == null) return 1;
  if (b.expires == null) return -1;
  return a.expires < b.expires ? -1 : 1;
}

/**
 * applyCredits(amount, credits): consumes credits { id, cents, expires? } in
 * order of expiry (ascending 'YYYY-MM-DD'; no expiry last; ties
 * in input order), each one until the remaining amount reaches zero.
 * → { applied: [{ id, cents }], unused: [{ id, cents }], remaining }.
 */
export function applyCredits(amount, credits) {
  assertNonNegInt(amount, 'amount');
  for (const c of credits) {
    if (!Number.isSafeInteger(c.cents) || c.cents <= 0) throw new RangeError('credit cents must be positive');
  }
  const pool = [...credits].sort(byExpiry);
  const applied = [];
  let remaining = amount;
  for (const c of pool) {
    const use = Math.min(c.cents, remaining);
    if (use > 0) applied.push({ id: c.id, cents: use });
    c.cents -= use;
    remaining -= use;
  }
  const unused = pool.filter((c) => c.cents > 0).map((c) => ({ id: c.id, cents: c.cents }));
  return { applied, unused, remaining };
}

/**
 * buildInvoice(items, { credits = [], minimumCents = 0 }):
 *   1. items with the same sku AND the same unitCents are summed into the line of the first
 *      occurrence (description of the first); qty 0 is ignored;
 *   2. subtotal < minimumCents → extra MINIMUM line with the difference;
 *   3. credits are applied on the subtotal (applyCredits).
 * → { lines, subtotal, applied, unused, total }.
 */
export function buildInvoice(items, { credits = [], minimumCents = 0 } = {}) {
  assertNonNegInt(minimumCents, 'minimumCents');
  const lines = consolidate(items);
  let subtotal = lines.reduce((s, l) => s + l.amount, 0);
  if (subtotal < minimumCents) {
    const diff = minimumCents - subtotal;
    lines.push({ sku: MINIMUM_SKU, description: 'Ajuste de consumo mínimo', qty: 1, unitCents: diff, amount: diff });
    subtotal = minimumCents;
  }
  const { applied, unused, remaining } = applyCredits(subtotal, credits);
  return { lines, subtotal, applied, unused, total: remaining };
}

/** Plain text of an invoice: one line per item and the total, amounts "1234.56". */
export function renderInvoice(invoice) {
  const money = (c) => `${Math.floor(c / 100)}.${String(c % 100).padStart(2, '0')}`;
  const rows = invoice.lines.map((l) => `${l.sku} x${l.qty} ${money(l.amount)}`);
  for (const a of invoice.applied) rows.push(`CREDIT ${a.id} -${money(a.cents)}`);
  rows.push(`TOTAL ${money(invoice.total)}`);
  return rows.join('\n');
}
