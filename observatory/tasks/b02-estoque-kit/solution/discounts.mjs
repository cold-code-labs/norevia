/**
 * Discount rules on a subtotal in cents.
 *
 * A rule is { kind: 'percent' | 'fixed', value: number, minSubtotal?: number }.
 */

function eligible(rule, current) {
  return rule.minSubtotal === undefined || current >= rule.minSubtotal;
}

/**
 * applyDiscounts(subtotal, rules):
 *  - first all 'percent' rules, in the given order, each one on the current amount;
 *  - then all 'fixed' rules, in the given order;
 *  - a rule with minSubtotal only applies if the current amount, at the moment
 *    it would be applied, is >= minSubtotal;
 *  - the percentage discount in cents is current * value / 100 rounded to the
 *    nearest integer (half a cent rounds up);
 *  - the total never becomes negative: the discount is capped at the current amount.
 *
 * @returns {{ total: number, applied: { index: number, amount: number }[] }}
 *   applied lists the rules actually applied (index in `rules`) in order of application.
 */
export function applyDiscounts(subtotal, rules) {
  if (!Number.isInteger(subtotal) || subtotal < 0) throw new RangeError('subtotal must be a non-negative integer');
  const order = [
    ...rules.map((r, index) => ({ r, index })).filter((x) => x.r.kind === 'percent'),
    ...rules.map((r, index) => ({ r, index })).filter((x) => x.r.kind === 'fixed'),
  ];
  if (order.length !== rules.length) throw new TypeError('unknown rule kind');
  let current = subtotal;
  const applied = [];
  for (const { r, index } of order) {
    if (!eligible(r, current)) continue;
    let amount = r.kind === 'percent' ? Math.round((current * r.value) / 100) : r.value;
    amount = Math.min(amount, current);
    current -= amount;
    applied.push({ index, amount });
  }
  return { total: current, applied };
}
