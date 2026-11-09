/**
 * Pricing by quantity tiers.
 *
 * A table is an array of tiers { upTo, unitCents, flatCents = 0 }:
 *   - `upTo` is the INCLUSIVE upper limit of the tier (integer ≥ 1, strictly
 *     increasing); the last tier has `upTo: null` (no limit);
 *   - tier i covers the quantities (upTo[i-1], upTo[i]] (the first one starts at 1).
 */

function assertQty(qty) {
  if (!Number.isSafeInteger(qty) || qty < 0) throw new RangeError('qty must be a non-negative integer');
}

/** Validates the table; returns it unchanged or throws RangeError. */
export function validateTiers(tiers) {
  if (!Array.isArray(tiers) || tiers.length === 0) throw new RangeError('tiers must be a non-empty array');
  let prev = 0;
  tiers.forEach((t, i) => {
    const isLast = i === tiers.length - 1;
    if (isLast ? t.upTo !== null : !Number.isSafeInteger(t.upTo) || t.upTo <= prev) {
      throw new RangeError(`invalid upTo at tier ${i}`);
    }
    if (!Number.isSafeInteger(t.unitCents) || t.unitCents < 0) throw new RangeError(`invalid unitCents at tier ${i}`);
    const flat = t.flatCents ?? 0;
    if (!Number.isSafeInteger(flat) || flat < 0) throw new RangeError(`invalid flatCents at tier ${i}`);
    if (!isLast) prev = t.upTo;
  });
  return tiers;
}

/** Index of the tier that contains `qty` (qty ≥ 1). qty = 0 → -1. */
export function tierFor(qty, tiers) {
  assertQty(qty);
  validateTiers(tiers);
  if (qty === 0) return -1;
  for (let i = 0; i < tiers.length; i++) {
    const { upTo } = tiers[i];
    if (upTo === null || qty <= upTo) return i;
  }
  return tiers.length - 1;
}

/**
 * Graduated: each unit pays the price of the tier it falls in; a tier's flat
 * fee is charged once if at least one unit falls in it.
 * → { total, breakdown: [{ tier, units, cents }] } (only tiers with units > 0).
 */
export function graduated(qty, tiers) {
  assertQty(qty);
  validateTiers(tiers);
  const breakdown = [];
  let lower = 0;
  for (let i = 0; i < tiers.length && qty > lower; i++) {
    const t = tiers[i];
    const upper = t.upTo === null ? qty : Math.min(qty, t.upTo);
    const units = upper - lower;
    if (units > 0) breakdown.push({ tier: i, units, cents: units * t.unitCents + (t.flatCents ?? 0) });
    lower = t.upTo ?? qty;
  }
  return { total: breakdown.reduce((s, b) => s + b.cents, 0), breakdown };
}

/**
 * Volume: ALL units pay the price of the tier that contains `qty`, plus that
 * tier's flat fee. qty = 0 → { total: 0, breakdown: [] }.
 */
export function volume(qty, tiers) {
  const i = tierFor(qty, tiers);
  if (i < 0) return { total: 0, breakdown: [] };
  const t = tiers[i];
  const cents = qty * t.unitCents + (t.flatCents ?? 0);
  return { total: cents, breakdown: [{ tier: i, units: qty, cents }] };
}

/** quote(qty, tiers, mode = 'graduated'): dispatches to graduated/volume. */
export function quote(qty, tiers, mode = 'graduated') {
  if (mode === 'graduated') return graduated(qty, tiers);
  if (mode === 'volume') return volume(qty, tiers);
  throw new RangeError(`unknown pricing mode: ${mode}`);
}

/**
 * breakEven(tiers): smallest quantity q ≥ 1 at which the volume price becomes
 * strictly lower than the graduated one, searching up to the start of the last tier
 * (inclusive); null if there is none.
 */
export function breakEven(tiers) {
  validateTiers(tiers);
  const limit = tiers.length > 1 ? tiers[tiers.length - 2].upTo + 1 : 1;
  for (let q = 1; q <= limit; q++) {
    if (volume(q, tiers).total < graduated(q, tiers).total) return q;
  }
  return null;
}
