/**
 * Matrizes densas como arrays de linhas (number[][]). Nenhuma função altera as entradas.
 */

/** [linhas, colunas]; matriz vazia → [0, 0]. Linhas de tamanhos diferentes → RangeError. */
export function shape(m) {
  if (m.length === 0) return [0, 0];
  const cols = m[0].length;
  if (m.some((row) => row.length !== cols)) throw new RangeError('ragged matrix');
  return [m.length, cols];
}

export function identity(n) {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
}

export function transpose(m) {
  const [rows, cols] = shape(m);
  return Array.from({ length: cols }, (_, j) => Array.from({ length: rows }, (_, i) => m[i][j]));
}

/** Soma elemento a elemento; formas diferentes → RangeError. */
export function add(a, b) {
  const [ra, ca] = shape(a);
  const [rb, cb] = shape(b);
  if (ra !== rb || ca !== cb) throw new RangeError('shape mismatch');
  return a.map((row, i) => row.map((x, j) => x + b[i][j]));
}

/**
 * Produto matricial a (n×k) · b (k×m) → n×m.
 * O número de colunas de a deve ser igual ao de linhas de b (senão RangeError).
 */
export function multiply(a, b) {
  const [n, k] = shape(a);
  const [k2, m] = shape(b);
  if (n !== k2) throw new RangeError(`cannot multiply ${n}x${k} by ${k2}x${m}`);
  const out = [];
  for (let i = 0; i < n; i++) {
    const row = new Array(m).fill(0);
    for (let j = 0; j < m; j++) {
      for (let t = 0; t < k; t++) row[j] += a[i][t] * b[t][j];
    }
    out.push(row);
  }
  return out;
}

/** Potência inteira não negativa de uma matriz quadrada (p = 0 → identidade). */
export function power(m, p) {
  const [r, c] = shape(m);
  if (r !== c) throw new RangeError('matrix must be square');
  if (!Number.isInteger(p) || p < 0) throw new RangeError('p must be a non-negative integer');
  let result = identity(r);
  for (let i = 0; i < p; i++) result = multiply(result, m);
  return result;
}
