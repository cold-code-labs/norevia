import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cross } from '../src/geometria-kit/vector.mjs';
import { area } from '../src/geometria-kit/polygon.mjs';
import { intersects } from '../src/geometria-kit/bbox.mjs';

test('cross de x̂ para ŷ é +1', () => {
  assert.equal(cross({ x: 1, y: 0 }, { x: 0, y: 1 }), 1);
});
test('área do quadrado 2x2', () => {
  assert.equal(area([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }]), 4);
});
test('caixas empilhadas que se tocam se intersectam', () => {
  const baixo = { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  const cima = { minX: 0, minY: 1, maxX: 1, maxY: 2 };
  assert.equal(intersects(baixo, cima), true);
});
