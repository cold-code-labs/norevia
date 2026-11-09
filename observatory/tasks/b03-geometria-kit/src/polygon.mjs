/**
 * Simple polygons given as an array of vertices { x, y }. The polygon is
 * implicitly closed: the last vertex connects to the first.
 */

function dist(p, q) {
  return Math.hypot(q.x - p.x, q.y - p.y);
}

/** Signed area (shoelace formula): positive for vertices in counterclockwise order. */
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

/** 'ccw', 'cw' or 'degenerate' (zero area). */
export function orientation(poly) {
  const a = signedArea(poly);
  return a > 0 ? 'ccw' : a < 0 ? 'cw' : 'degenerate';
}

/**
 * Perimeter of the closed polygon (includes the edge from the last to the first vertex).
 * Fewer than 2 vertices → 0.
 */
export function perimeter(poly) {
  const n = poly.length;
  if (n < 2) return 0;
  let total = 0;
  for (let i = 0; i < n - 1; i++) total += dist(poly[i], poly[(i + 1) % n]);
  return total;
}

/** Centroid (center of mass of the region). Zero area → RangeError. */
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
