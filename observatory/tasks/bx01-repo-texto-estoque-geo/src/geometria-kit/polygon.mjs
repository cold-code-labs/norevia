/**
 * Polígonos simples dados como array de vértices { x, y }. O polígono é
 * implicitamente fechado: o último vértice se liga ao primeiro.
 */

function dist(p, q) {
  return Math.hypot(q.x - p.x, q.y - p.y);
}

/** Área com sinal (fórmula do laço): positiva para vértices em sentido anti-horário. */
export function signedArea(poly) {
  const n = poly.length;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % n];
    s += p.x * q.y - q.x * p.y;
  }
  return s / 2;
}

export function area(poly) {
  return Math.abs(signedArea(poly));
}

/** 'ccw', 'cw' ou 'degenerate' (área zero). */
export function orientation(poly) {
  const a = signedArea(poly);
  return a > 0 ? 'ccw' : a < 0 ? 'cw' : 'degenerate';
}

/**
 * Perímetro do polígono fechado (inclui a aresta do último ao primeiro vértice).
 * Menos de 2 vértices → 0.
 */
export function perimeter(poly) {
  const n = poly.length;
  if (n < 2) return 0;
  let total = 0;
  for (let i = 0; i < n - 1; i++) total += dist(poly[i], poly[(i + 1) % n]);
  return total;
}

/** Centroide (centro de massa da região). Área zero → RangeError. */
export function centroid(poly) {
  const n = poly.length;
  const a = signedArea(poly);
  if (a === 0) throw new RangeError('degenerate polygon');
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < n; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % n];
    const f = p.x * q.y - q.x * p.y;
    cx += (p.x + q.x) * f;
    cy += (p.y + q.y) * f;
  }
  return { x: cx / (6 * a), y: cy / (6 * a) };
}
