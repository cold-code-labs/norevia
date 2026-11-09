import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../src/grade-kit/grid.mjs';

const g3 = () => new Grid(['abc', 'def', 'ghi']);

test('dimensões e get', () => {
  const g = new Grid(['ab#', 'c.d']);
  assert.equal(g.height, 2);
  assert.equal(g.width, 3);
  assert.equal(g.get(1, 2), 'd');
  assert.equal(g.get(0, 3), undefined);
  assert.equal(g.get(-1, 0), undefined);
  assert.throws(() => new Grid(['ab', 'c']), RangeError);
});
test('inBounds', () => {
  const g = new Grid(['ab#', 'c.d']);
  assert.equal(g.inBounds(1, 2), true);
  assert.equal(g.inBounds(0, 3), false);
  assert.equal(g.inBounds(2, 0), false);
  assert.equal(g.inBounds(-1, 0), false);
});
test('neighbors ortogonais no meio', () => {
  assert.deepEqual(g3().neighbors(1, 1), [[0, 1], [1, 2], [2, 1], [1, 0]]);
});
test('neighbors na borda direita', () => {
  assert.deepEqual(g3().neighbors(0, 2), [[1, 2], [0, 1]]);
  assert.deepEqual(g3().neighbors(2, 2), [[1, 2], [2, 1]]);
});
test('neighbors com diagonais', () => {
  assert.deepEqual(g3().neighbors(0, 0, { diagonal: true }), [[0, 1], [1, 1], [1, 0]]);
  assert.deepEqual(g3().neighbors(1, 2, { diagonal: true }), [[0, 2], [2, 2], [2, 1], [1, 1], [0, 1]]);
});
test('find, count e toString', () => {
  const g = new Grid(['ab#', '#.d']);
  assert.deepEqual(g.find('#'), [0, 2]);
  assert.equal(g.find('z'), null);
  assert.equal(g.count('#'), 2);
  assert.equal(g.toString(), 'ab#\n#.d');
});
test('construtor copia as linhas', () => {
  const rows = ['ab', 'cd'];
  const g = new Grid(rows);
  rows[0] = 'zz';
  assert.equal(g.get(0, 0), 'a');
});
