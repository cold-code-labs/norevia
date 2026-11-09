/**
 * Character grid built from text rows of the same length.
 * Coordinates are (row, column), starting at (0, 0) at the top-left corner.
 */
const ORTHO = [[-1, 0], [0, 1], [1, 0], [0, -1]];
const ALL = [[-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1]];

export class Grid {
  #rows;

  constructor(rows) {
    if (rows.some((r) => r.length !== rows[0].length)) throw new RangeError('rows must have equal length');
    this.#rows = [...rows];
  }

  get height() {
    return this.#rows.length;
  }

  get width() {
    return this.#rows.length ? this.#rows[0].length : 0;
  }

  inBounds(r, c) {
    return r >= 0 && r < this.height && c >= 0 && c <= this.width;
  }

  /** Character at (r, c); outside the grid → undefined. */
  get(r, c) {
    return this.inBounds(r, c) ? this.#rows[r][c] : undefined;
  }

  /**
   * Neighbors within the grid, as pairs [r, c]. Order: N, E, S, W; with
   * { diagonal: true }: N, NE, E, SE, S, SW, W, NW.
   */
  neighbors(r, c, { diagonal = false } = {}) {
    const out = [];
    for (const [dr, dc] of diagonal ? ALL : ORTHO) {
      if (this.inBounds(r + dr, c + dc)) out.push([r + dr, c + dc]);
    }
    return out;
  }

  /** First position (scanning row by row) containing `ch`, or null. */
  find(ch) {
    for (let r = 0; r < this.height; r++) {
      const c = this.#rows[r].indexOf(ch);
      if (c !== -1) return [r, c];
    }
    return null;
  }

  count(ch) {
    let n = 0;
    for (const row of this.#rows) for (const x of row) if (x === ch) n++;
    return n;
  }

  toString() {
    return this.#rows.join('\n');
  }
}
