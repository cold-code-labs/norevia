/**
 * Connected regions in 2D grids given as arrays of arrays (cells[r][c]).
 * 4-connectivity (up, down, left, right). No function changes `cells`.
 */

function inside(cells, r, c) {
  return r >= 0 && r < cells.length && c >= 0 && c < cells[r].length;
}

/**
 * floodFill(cells, r, c, value) → new grid in which the 4-connected region of cells
 * equal to cells[r][c] that contains (r, c) takes the value `value`.
 * Start outside the grid → RangeError.
 */
export function floodFill(cells, r, c, value) {
  if (!inside(cells, r, c)) throw new RangeError('start out of bounds');
  const out = cells.map((row) => row.slice());
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

/** Number of cells of the 4-connected region that contains (r, c). */
export function regionSize(cells, r, c) {
  if (!inside(cells, r, c)) throw new RangeError('start out of bounds');
  const marker = Symbol('visited');
  const filled = floodFill(cells, r, c, marker);
  return filled.reduce((n, row) => n + row.filter((x) => x === marker).length, 0);
}

/** Number of 4-connected regions of equal values. */
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
