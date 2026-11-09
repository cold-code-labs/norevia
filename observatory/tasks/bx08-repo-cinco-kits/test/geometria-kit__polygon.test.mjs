import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signedArea, area, orientation, perimeter, centroid } from '../src/geometria-kit/polygon.mjs';

const P = (...xy) => { const out = []; for (let i = 0; i < xy.length; i += 2) out.push({ x: xy[i], y: xy[i + 1] }); return out; };
const square = P(0, 0, 2, 0, 2, 2, 0, 2);

test('áreas com e sem sinal', () => {
  assert.equal(signedArea(square), 4);
  assert.equal(signedArea([...square].reverse()), -4);
  assert.equal(area([...square].reverse()), 4);
});
test('orientation', () => {
  assert.equal(orientation(square), 'ccw');
  assert.equal(orientation([...square].reverse()), 'cw');
  assert.equal(orientation(P(0, 0, 1, 1, 2, 2)), 'degenerate');
});
test('perimeter inclui a aresta de fechamento', () => {
  assert.equal(perimeter(square), 8);
  assert.equal(perimeter(P(0, 0, 4, 0, 0, 3)), 12);
});
test('perimeter com 2 vértices vai e volta; menos de 2 → 0', () => {
  assert.equal(perimeter(P(0, 0, 3, 4)), 10);
  assert.equal(perimeter(P(5, 5)), 0);
  assert.equal(perimeter([]), 0);
});
test('centroid', () => {
  assert.deepEqual(centroid(square), { x: 1, y: 1 });
  assert.deepEqual(centroid(P(0, 0, 6, 0, 0, 3)), { x: 2, y: 1 });
  assert.throws(() => centroid(P(0, 0, 1, 1, 2, 2)), RangeError);
});
