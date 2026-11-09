import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vec, add, sub, scale, dot, cross, length, normalize, rotate, angleBetween } from '../src/vector.mjs';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test('basic operations', () => {
  assert.deepEqual(add(vec(1, 2), vec(3, 4)), { x: 4, y: 6 });
  assert.deepEqual(sub(vec(1, 2), vec(3, 4)), { x: -2, y: -2 });
  assert.deepEqual(scale(vec(1, -2), 3), { x: 3, y: -6 });
  assert.equal(dot(vec(1, 2), vec(3, 4)), 11);
  assert.equal(length(vec(3, 4)), 5);
});
test('cross: sign by counterclockwise direction', () => {
  assert.equal(cross(vec(1, 0), vec(0, 1)), 1);
  assert.equal(cross(vec(0, 1), vec(1, 0)), -1);
  assert.equal(cross(vec(2, 3), vec(4, 1)), -10);
  assert.equal(cross(vec(2, 3), vec(4, 6)), 0);
});
test('normalize', () => {
  const v = vec(3, 4);
  assert.deepEqual(normalize(v), { x: 0.6, y: 0.8 });
  assert.deepEqual(v, { x: 3, y: 4 });
  assert.throws(() => normalize(vec(0, 0)), RangeError);
});
test('counterclockwise rotate', () => {
  const r = rotate(vec(1, 0), Math.PI / 2);
  close(r.x, 0);
  close(r.y, 1);
});
test('oriented angleBetween', () => {
  close(angleBetween(vec(1, 0), vec(0, 1)), Math.PI / 2);
  close(angleBetween(vec(0, 1), vec(1, 0)), -Math.PI / 2);
  close(angleBetween(vec(1, 0), vec(1, 1)), Math.PI / 4);
});
test('angleBetween of opposite vectors is +π', () => {
  assert.equal(angleBetween(vec(1, 0), vec(-1, 0)), Math.PI);
});
