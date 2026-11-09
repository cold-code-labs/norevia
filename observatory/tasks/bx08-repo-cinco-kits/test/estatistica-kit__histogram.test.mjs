import { test } from 'node:test';
import assert from 'node:assert/strict';
import { histogram, cumulative } from '../src/estatistica-kit/histogram.mjs';

const xs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

test('faixas de mesma largura; a última inclui o máximo', () => {
  assert.deepEqual(histogram(xs, { bins: 5 }), [
    { lo: 0, hi: 2, count: 2 }, { lo: 2, hi: 4, count: 2 }, { lo: 4, hi: 6, count: 2 },
    { lo: 6, hi: 8, count: 2 }, { lo: 8, hi: 10, count: 3 },
  ]);
});
test('min/max explícitos ignoram valores fora', () => {
  assert.deepEqual(histogram([-1, 0, 5, 10, 11], { bins: 2, min: 0, max: 10 }), [
    { lo: 0, hi: 5, count: 1 }, { lo: 5, hi: 10, count: 2 },
  ]);
});
test('valor na fronteira vai para a faixa de cima', () => {
  assert.deepEqual(histogram([0, 2, 4], { bins: 2, min: 0, max: 4 }).map((b) => b.count), [1, 2]);
});
test('min === max', () => {
  assert.deepEqual(histogram([3, 3, 3], { bins: 2 }), [{ lo: 3, hi: 3.5, count: 3 }, { lo: 3.5, hi: 4, count: 0 }]);
});
test('bins padrão 10', () => {
  assert.equal(histogram(xs).length, 10);
  assert.equal(histogram(xs).reduce((s, b) => s + b.count, 0), 11);
});
test('vazio e erros', () => {
  assert.deepEqual(histogram([]), []);
  assert.deepEqual(histogram([], { bins: 2, min: 0, max: 2 }), [{ lo: 0, hi: 1, count: 0 }, { lo: 1, hi: 2, count: 0 }]);
  assert.throws(() => histogram(xs, { bins: 0 }), RangeError);
  assert.throws(() => histogram(xs, { bins: 1.5 }), RangeError);
  assert.throws(() => histogram(xs, { min: 5, max: 1 }), RangeError);
});
test('cumulative', () => {
  assert.deepEqual(cumulative([{ count: 2 }, { count: 0 }, { count: 3 }]), [2, 2, 5]);
});
