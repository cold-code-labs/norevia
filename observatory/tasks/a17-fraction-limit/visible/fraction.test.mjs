import { test } from 'node:test';
import assert from 'node:assert/strict';
import { approximate, parse } from '../src/fraction.mjs';

test('aproximações clássicas de pi', () => {
  assert.equal(approximate('3.141592653589793', 1000).toString(), '355/113');
  assert.equal(approximate('3.141592653589793', 100).toString(), '311/99');
  assert.equal(parse('-1.25').toString(), '-5/4');
});

test('approximate escolhe a fração mais próxima', () => {
  assert.equal(approximate('2/17', 13).toString(), '1/9');
});
