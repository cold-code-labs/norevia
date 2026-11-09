/**
 * Rateio proporcional pelo método do maior resto (Hamilton).
 */
import { parseDecimal, formatParts } from './decimal.mjs';

function checkWeights(weights) {
  if (!Array.isArray(weights) || weights.length === 0) throw new RangeError('weights deve ser array não-vazio');
  for (const w of weights) if (!Number.isSafeInteger(w) || w < 0) throw new RangeError(`peso inválido: ${w}`);
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) throw new RangeError('soma dos pesos deve ser positiva');
  return sum;
}

/**
 * Divide o inteiro `total` em partes proporcionais a `weights` que somam exatamente `total`.
 */
export function allocate(total, weights) {
  if (!Number.isSafeInteger(total)) throw new RangeError(`total inválido: ${total}`);
  const sum = checkWeights(weights);
  if (total < 0) return allocate(-total, weights).map((x) => (x === 0 ? 0 : -x));
  const parts = weights.map((w) => {
    const q = (total * w) / sum;
    const base = Math.floor(q);
    return { base, rem: q - base };
  });
  let left = total - parts.reduce((a, p) => a + p.base, 0);
  const order = parts.map((p, i) => i).sort((i, j) => (parts[i].rem === parts[j].rem ? i - j : parts[i].rem > parts[j].rem ? -1 : 1));
  const out = parts.map((p) => p.base);
  for (let k = 0; left > 0; k++, left--) out[order[k]] += 1;
  return out;
}

/** `n` partes (inteiro ≥ 1) o mais iguais possível; as maiores primeiro. */
export function splitEvenly(total, n) {
  if (!Number.isInteger(n) || n < 1) throw new RangeError(`n inválido: ${n}`);
  return allocate(total, new Array(n).fill(1));
}

/** Rateia um valor monetário decimal (até 2 casas) e devolve strings com 2 casas. */
export function allocateMoney(amount, weights) {
  const p = parseDecimal(amount);
  if (p.scale > 2) throw new RangeError(`valor com mais de 2 casas: ${amount}`);
  const cents = Number(p.digits + '0'.repeat(2 - p.scale)) * (p.neg ? -1 : 1);
  return allocate(cents, weights).map((c) => formatParts({ neg: c < 0, digits: String(Math.abs(c)), scale: 2 }));
}
