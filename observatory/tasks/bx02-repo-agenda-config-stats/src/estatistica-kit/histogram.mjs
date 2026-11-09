/**
 * Histogramas de largura fixa.
 */

/**
 * histogram(xs, { bins = 10, min, max }) → [{ lo, hi, count }]
 *
 * - O intervalo [min, max] (padrão: mínimo e máximo de xs) é dividido em `bins`
 *   faixas de mesma largura. Cada faixa é [lo, hi), exceto a última, que é [lo, hi]
 *   (inclui o próprio max).
 * - Valores fora de [min, max] são ignorados.
 * - Se min === max, usa-se max = min + 1.
 * - bins deve ser inteiro >= 1 (senão RangeError); xs vazio sem min/max → [].
 */
export function histogram(xs, { bins = 10, min, max } = {}) {
  if (!Number.isInteger(bins) || bins < 1) throw new RangeError('bins must be a positive integer');
  if (xs.length === 0 && (min === undefined || max === undefined)) return [];
  const lo = min ?? Math.min(...xs);
  let hi = max ?? Math.max(...xs);
  if (hi < lo) throw new RangeError('max must be >= min');
  if (hi === lo) hi = lo + 1;
  const width = (hi - lo) / bins;
  const buckets = Array.from({ length: bins }, (_, i) => ({
    lo: lo + i * width,
    hi: i === bins - 1 ? hi : lo + (i + 1) * width,
    count: 0,
  }));
  for (const x of xs) {
    if (x < lo || x >= hi) continue;
    const idx = Math.min(Math.floor((x - lo) / width), bins - 1);
    buckets[idx].count++;
  }
  return buckets;
}

/** Contagens acumuladas: o i-ésimo elemento é a soma das contagens das faixas 0..i. */
export function cumulative(buckets) {
  let total = 0;
  return buckets.map((b) => (total += b.count));
}
