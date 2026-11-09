import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topWords } from '../src/texto-kit/tokenize.mjs';
import { slugify } from '../src/texto-kit/slugify.mjs';
import { wrap } from '../src/texto-kit/wrap.mjs';

test('topWords desempata em ordem crescente', () => {
  assert.deepEqual(topWords('beta alfa beta alfa gama', 3), [
    { word: 'alfa', count: 2 }, { word: 'beta', count: 2 }, { word: 'gama', count: 1 },
  ]);
});
test('slugify básico', () => {
  assert.equal(slugify('Programação em JavaScript'), 'programacao-em-javascript');
});
test('wrap aproveita a largura inteira', () => {
  assert.equal(wrap('um dois tres quatro', 7), 'um dois\ntres\nquatro');
});
