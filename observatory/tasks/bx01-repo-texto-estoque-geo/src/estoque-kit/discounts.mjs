/**
 * Regras de desconto sobre um subtotal em centavos.
 *
 * Uma regra é { kind: 'percent' | 'fixed', value: number, minSubtotal?: number }.
 */

function eligible(rule, current) {
  return rule.minSubtotal === undefined || current >= rule.minSubtotal;
}

/**
 * applyDiscounts(subtotal, rules):
 *  - primeiro todas as regras 'percent', na ordem dada, cada uma sobre o valor corrente;
 *  - depois todas as regras 'fixed', na ordem dada;
 *  - uma regra com minSubtotal só se aplica se o valor corrente, no momento em que
 *    ela seria aplicada, for >= minSubtotal;
 *  - o desconto percentual em centavos é corrente * value / 100 arredondado para o
 *    inteiro mais próximo (meio centavo arredonda para cima);
 *  - o total nunca fica negativo: o desconto é limitado ao valor corrente.
 *
 * @returns {{ total: number, applied: { index: number, amount: number }[] }}
 *   applied lista as regras efetivamente aplicadas (índice em `rules`) na ordem de aplicação.
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
    let amount = r.kind === 'percent' ? Math.floor((current * r.value) / 100) : r.value;
    amount = Math.min(amount, current);
    current -= amount;
    applied.push({ index, amount });
  }
  return { total: current, applied };
}
