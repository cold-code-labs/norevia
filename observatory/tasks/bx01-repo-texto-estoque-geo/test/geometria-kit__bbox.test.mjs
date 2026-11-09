import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boundingBox, intersects, containsPoint, union, expand } from '../src/geometria-kit/bbox.mjs';

const B = (minX, minY, maxX, maxY) => ({ minX, minY, maxX, maxY });

test('boundingBox', () => {
  assert.deepEqual(boundingBox([{ x: 3, y: -1 }, { x: -2, y: 4 }, { x: 0, y: 0 }]), B(-2, -1, 3, 4));
  assert.equal(boundingBox([]), null);
});
test('intersects: sobreposição e disjunção', () => {
  assert.equal(intersects(B(0, 0, 2, 2), B(1, 1, 3, 3)), true);
  assert.equal(intersects(B(0, 0, 1, 1), B(2, 2, 3, 3)), false);
  assert.equal(intersects(B(0, 0, 1, 1), B(0, 1.5, 1, 2)), false);
});
test('intersects: encostar em borda conta, nas duas ordens', () => {
  const a = B(0, 0, 1, 1);
  for (const b of [B(0, 1, 1, 2), B(1, 0, 2, 1), B(0, -1, 1, 0), B(-1, 0, 0, 1)]) {
    assert.equal(intersects(a, b), true);
    assert.equal(intersects(b, a), true);
  }
});
test('intersects: encostar em canto conta', () => {
  assert.equal(intersects(B(0, 0, 1, 1), B(1, 1, 2, 2)), true);
  assert.equal(intersects(B(1, 1, 2, 2), B(0, 0, 1, 1)), true);
});
test('containsPoint inclui a borda', () => {
  const b = B(0, 0, 2, 1);
  assert.equal(containsPoint(b, { x: 2, y: 1 }), true);
  assert.equal(containsPoint(b, { x: 1, y: 0.5 }), true);
  assert.equal(containsPoint(b, { x: 2.1, y: 0 }), false);
});
test('union e expand', () => {
  assert.deepEqual(union(B(0, 0, 1, 1), B(-1, 2, 0, 3)), B(-1, 0, 1, 3));
  assert.deepEqual(expand(B(0, 0, 2, 2), 1), B(-1, -1, 3, 3));
  assert.deepEqual(expand(B(0, 0, 2, 2), -1), B(1, 1, 1, 1));
  assert.equal(expand(B(0, 0, 2, 2), -1.5), null);
});
