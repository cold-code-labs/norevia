/**
 * Caixas delimitadoras alinhadas aos eixos: { minX, minY, maxX, maxY }.
 * As caixas são fechadas: a borda pertence à caixa.
 */

/** Menor caixa que contém todos os pontos; lista vazia → null. */
export function boundingBox(points) {
  if (points.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const { x, y } of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

/** true se as caixas têm algum ponto em comum (encostar em borda ou canto conta). */
export function intersects(a, b) {
  return a.minX <= b.maxX && b.minX <= a.maxX && a.minY <= b.maxY && b.minY <= a.maxY;
}

/** Ponto dentro da caixa ou sobre a borda. */
export function containsPoint(box, p) {
  return p.x >= box.minX && p.x <= box.maxX && p.y >= box.minY && p.y <= box.maxY;
}

/** Menor caixa que contém a e b. */
export function union(a, b) {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

/** Caixa aumentada de `margin` em todas as direções (margin negativo encolhe; se inverter → null). */
export function expand(box, margin) {
  const out = { minX: box.minX - margin, minY: box.minY - margin, maxX: box.maxX + margin, maxY: box.maxY + margin };
  return out.minX > out.maxX || out.minY > out.maxY ? null : out;
}
