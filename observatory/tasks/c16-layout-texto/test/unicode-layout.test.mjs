import { test } from 'node:test';
import assert from 'node:assert/strict';
import { width } from '../src/measure.mjs';
import { hyphenPoints } from '../src/hyphenate.mjs';
import { layout } from '../src/render.mjs';
import { distribute } from '../src/align.mjs';

const SHY = '\u00ad';

test('width and wrapping use code points rather than UTF-16 units', () => {
  assert.equal(width('A🐝B'), 3);
  const lines = layout('A🐝B C', { width: 3 });
  assert.deepEqual(lines, ['A🐝B', 'C']);
});

test('soft hyphens do not count as visible characters or slice offsets', () => {
  assert.deepEqual(hyphenPoints(`in${SHY}for${SHY}ma${SHY}tion`), [2, 5, 7]);
  assert.deepEqual(layout(`🐝ab${SHY}cdef`, { width: 4, hyphenate: true }), ['🐝ab-', 'cdef']);
});

test('justification assigns extra spaces from left to right', () => {
  assert.deepEqual(distribute(8, 3), [3, 3, 2]);
});
