/**
 * Axis-aligned bounding boxes: { minX, minY, maxX, maxY }.
 * The boxes are closed: the border belongs to the box.
 */

/** Smallest box that contains all points; empty list → null. */
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

/** true if the boxes have some point in common (touching at an edge or corner counts). */
export function intersects(a, b) {
  return a.minX <= b.maxX && b.minX <= a.maxX && a.minY <= b.maxY && b.minY <= a.maxY;
}

/** Point inside the box or on the border. */
export function containsPoint(box, p) {
  return p.x >= box.minX && p.x <= box.maxX && p.y >= box.minY && p.y <= box.maxY;
}

/** Smallest box that contains a and b. */
export function union(a, b) {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

/** Box grown by `margin` in all directions (negative margin shrinks; if it inverts → null). */
export function expand(box, margin) {
  const out = { minX: box.minX - margin, minY: box.minY - margin, maxX: box.maxX + margin, maxY: box.maxY + margin };
  return out.minX > out.maxX || out.minY > out.maxY ? null : out;
}
