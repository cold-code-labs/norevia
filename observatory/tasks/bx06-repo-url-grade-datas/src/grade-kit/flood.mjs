/**
 * Regiões conectadas em grades 2D dadas como arrays de arrays (cells[r][c]).
 * Conectividade 4 (cima, baixo, esquerda, direita). Nenhuma função altera `cells`.
 */

function inside(cells, r, c) {
  return r >= 0 && r < cells.length && c >= 0 && c < cells[r].length;
}

/**
 * floodFill(cells, r, c, value) → nova grade em que a região 4-conectada de células
 * iguais a cells[r][c] que contém (r, c) passa a valer `value`.
 * Início fora da grade → RangeError.
 */
export function floodFill(cells, r, c, value) {
  if (!inside(cells, r, c)) throw new RangeError('start out of bounds');
  const out = cells.slice();
  const target = out[r][c];
  if (target === value) return out;
  const stack = [[r, c]];
  while (stack.length) {
    const [y, x] = stack.pop();
    if (!inside(out, y, x) || out[y][x] !== target) continue;
    out[y][x] = value;
    stack.push([y - 1, x], [y + 1, x], [y, x - 1], [y, x + 1]);
  }
  return out;
}

/** Número de células da região 4-conectada que contém (r, c). */
export function regionSize(cells, r, c) {
  if (!inside(cells, r, c)) throw new RangeError('start out of bounds');
  const marker = Symbol('visited');
  const filled = floodFill(cells, r, c, marker);
  return filled.reduce((n, row) => n + row.filter((x) => x === marker).length, 0);
}

/** Quantidade de regiões 4-conectadas de valores iguais. */
export function countRegions(cells) {
  const seen = cells.map((row) => row.map(() => false));
  let regions = 0;
  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      if (seen[r][c]) continue;
      regions++;
      const stack = [[r, c]];
      while (stack.length) {
        const [y, x] = stack.pop();
        if (!inside(cells, y, x) || seen[y][x] || cells[y][x] !== cells[r][c]) continue;
        seen[y][x] = true;
        stack.push([y - 1, x], [y + 1, x], [y, x - 1], [y, x + 1]);
      }
    }
  }
  return regions;
}
