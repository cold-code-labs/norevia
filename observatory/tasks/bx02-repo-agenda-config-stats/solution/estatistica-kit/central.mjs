/**
 * Medidas de tendência central e dispersão. Nenhuma função altera o array recebido.
 * Todas exigem um array de números finitos (senão TypeError) e devolvem NaN para array vazio.
 */

function check(xs) {
  if (!Array.isArray(xs) || !xs.every((x) => typeof x === 'number' && Number.isFinite(x))) {
    throw new TypeError('expected an array of finite numbers');
  }
}

export function mean(xs) {
  check(xs);
  if (xs.length === 0) return NaN;
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

/** Valor do meio da amostra ordenada; com tamanho par, média dos dois do meio. */
export function median(xs) {
  check(xs);
  const n = xs.length;
  if (n === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const mid = n >> 1;
  return n % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Valor mais frequente; empate → o menor deles. */
export function mode(xs) {
  check(xs);
  if (xs.length === 0) return NaN;
  const counts = new Map();
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
  let best = NaN;
  let bestCount = 0;
  for (const [x, c] of counts) {
    if (c > bestCount || (c === bestCount && x < best)) {
      best = x;
      bestCount = c;
    }
  }
  return best;
}

/**
 * Variância populacional (divide por n) ou amostral ({ sample: true }, divide por n - 1;
 * menos de 2 valores → NaN).
 */
export function variance(xs, { sample = false } = {}) {
  check(xs);
  const n = xs.length;
  if (n === 0 || (sample && n < 2)) return NaN;
  const m = mean(xs);
  const ss = xs.reduce((s, x) => s + (x - m) ** 2, 0);
  return ss / (sample ? n - 1 : n);
}

export function stddev(xs, options) {
  return Math.sqrt(variance(xs, options));
}
