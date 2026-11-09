import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cross } from '../src/vector.mjs';
import { area } from '../src/polygon.mjs';
import { intersects } from '../src/bbox.mjs';

test('cross from x̂ to ŷ is +1', () => {
  assert.equal(cross({ x: 1, y: 0 }, { x: 0, y: 1 }), 1);
});
test('area of the 2x2 square', () => {
  assert.equal(area([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }]), 4);
});
test('stacked boxes that touch intersect', () => {
  const baixo = { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  const cima = { minX: 0, minY: 1, maxX: 1, maxY: 2 };
  assert.equal(intersects(baixo, cima), true);
});
