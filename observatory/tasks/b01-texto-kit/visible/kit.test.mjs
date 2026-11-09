import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topWords } from '../src/tokenize.mjs';
import { slugify } from '../src/slugify.mjs';
import { wrap } from '../src/wrap.mjs';

test('topWords breaks ties in ascending order', () => {
  assert.deepEqual(topWords('beta alfa beta alfa gama', 3), [
    { word: 'alfa', count: 2 }, { word: 'beta', count: 2 }, { word: 'gama', count: 1 },
  ]);
});
test('basic slugify', () => {
  assert.equal(slugify('Programação em JavaScript'), 'programacao-em-javascript');
});
test('wrap uses the full width', () => {
  assert.equal(wrap('um dois tres quatro', 7), 'um dois\ntres\nquatro');
});
