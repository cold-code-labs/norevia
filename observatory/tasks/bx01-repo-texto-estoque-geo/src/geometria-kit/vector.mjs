/**
 * Vetores 2D imutáveis no formato { x, y }. Nenhuma função altera seus argumentos.
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
 * Produto vetorial 2D (componente z de a × b). Positivo quando b está no sentido
 * anti-horário a partir de a.
 */
export function cross(a, b) {
  return a.y * b.x - a.x * b.y;
}

export function length(v) {
  return Math.hypot(v.x, v.y);
}

/** Vetor unitário na direção de v; vetor nulo → RangeError. */
export function normalize(v) {
  const len = length(v);
  if (len === 0) throw new RangeError('cannot normalize zero vector');
  return { x: v.x / len, y: v.y / len };
}

/** Rotaciona v por `angle` radianos no sentido anti-horário. */
export function rotate(v, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

/**
 * Ângulo orientado de a para b, em radianos, no intervalo (-π, π]:
 * positivo se b está no sentido anti-horário a partir de a.
 */
export function angleBetween(a, b) {
  return Math.atan2(cross(a, b), dot(a, b));
}
