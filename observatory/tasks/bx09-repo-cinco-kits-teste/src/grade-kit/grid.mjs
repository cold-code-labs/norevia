/**
 * Grade de caracteres construída a partir de linhas de texto de mesmo comprimento.
 * Coordenadas são (linha, coluna), começando em (0, 0) no canto superior esquerdo.
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

  /** Caractere em (r, c); fora da grade → undefined. */
  get(r, c) {
    return this.inBounds(r, c) ? this.#rows[r][c] : undefined;
  }

  /**
   * Vizinhos dentro da grade, como pares [r, c]. Ordem: N, L, S, O; com
   * { diagonal: true }: N, NE, L, SE, S, SO, O, NO.
   */
  neighbors(r, c, { diagonal = false } = {}) {
    const out = [];
    for (const [dr, dc] of diagonal ? ALL : ORTHO) {
      if (this.inBounds(r + dr, c + dc)) out.push([r + dr, c + dc]);
    }
    return out;
  }

  /** Primeira posição (varrendo linha a linha) contendo `ch`, ou null. */
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
