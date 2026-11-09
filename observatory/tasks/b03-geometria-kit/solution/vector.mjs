/**
 * Immutable 2D vectors in the format { x, y }. No function changes its arguments.
 */

export const vec = (x, y) => ({ x, y });

export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v, k) {
  return { x: v.x * k, y: v.y * k };
}

export function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

/**
 * 2D cross product (z component of a × b). Positive when b is
 * counterclockwise from a.
 */
export function cross(a, b) {
  return a.x * b.y - a.y * b.x;
}

export function length(v) {
  return Math.hypot(v.x, v.y);
}

/** Unit vector in the direction of v; zero vector → RangeError. */
export function normalize(v) {
  const len = length(v);
  if (len === 0) throw new RangeError('cannot normalize zero vector');
  return { x: v.x / len, y: v.y / len };
}

/** Rotates v by `angle` radians counterclockwise. */
export function rotate(v, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

/**
 * Oriented angle from a to b, in radians, in the interval (-π, π]:
 * positive if b is counterclockwise from a.
 */
export function angleBetween(a, b) {
  return Math.atan2(cross(a, b), dot(a, b));
}
