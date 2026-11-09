/**
 * Sugestões "você quis dizer?" baseadas em distância de edição.
 */

/**
 * Distância de alinhamento ótimo de strings (Levenshtein + transposição de
 * caracteres adjacentes com custo 1, sem reeditar uma substring já transposta).
 * Opera sobre code points e diferencia maiúsculas de minúsculas.
 */
export function distance(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') throw new TypeError('distance espera strings');
  const s = [...a];
  const t = [...b];
  const d = Array.from({ length: s.length + 1 }, (_, i) => {
    const row = new Array(t.length + 1).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j <= t.length; j++) d[0][j] = j;
  for (let i = 1; i <= s.length; i++) {
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && s[i - 1] === t[j - 2] && s[i - 2] === t[j - 1]) {
        v = Math.min(v, d[i - 2][j - 2] + 1);
      }
      d[i][j] = v;
    }
  }
  return d[s.length][t.length];
}

/**
 * Candidatos próximos de `input`, sem distinção de maiúsculas, na grafia
 * original. Ordem: menor distância primeiro.
 */
export function suggest(input, candidates, { maxDistance, limit = 3 } = {}) {
  if (typeof input !== 'string') throw new TypeError('input deve ser string');
  if (!Array.isArray(candidates)) throw new TypeError('candidates deve ser um array');
  const needle = input.toLowerCase();
  const len = [...needle].length;
  if (len === 0) return [];
  const max = maxDistance ?? Math.max(1, Math.floor(len / 3));
  const seen = new Set();
  const scored = [];
  for (const name of candidates) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const d = distance(needle, key);
    if (d <= max) scored.push({ name, d });
  }
  scored.sort((x, y) => x.d - y.d);
  return scored.slice(0, Math.max(0, limit)).map((e) => e.name);
}

/** Mensagem pronta para a CLI; '' quando não há sugestão. */
export function didYouMean(input, candidates, options = {}) {
  const found = suggest(input, candidates, options).map((s) => `"${s}"`);
  if (found.length === 0) return '';
  if (found.length === 1) return `Você quis dizer ${found[0]}?`;
  return `Você quis dizer ${found.slice(0, -1).join(', ')} ou ${found[found.length - 1]}?`;
}
