import { test } from 'node:test';
import assert from 'node:assert/strict';
import { truncate, codePointLength, truncateFields } from '../src/truncate.mjs';

test('text that fits exactly in code points is returned unchanged', () => {
  assert.equal(truncate('😀😁😂', 3), '😀😁😂');
  assert.equal(truncate('ab😀', 3), 'ab😀');
});

test('cut right after an astral character never produces a lone surrogate', () => {
  const r = truncate('x😀yzw', 3);
  assert.equal(r, 'x😀…');
  assert.equal(r.isWellFormed(), true);
});

test('result has exactly maxLength code points', () => {
  const r = truncate('a😀b😀c😀d', 5);
  assert.equal(r, 'a😀b😀…');
  assert.equal(codePointLength(r), 5);
});

test('custom ellipsis and astral math', () => {
  assert.equal(truncate('𝒜𝒞𝒟𝒢𝒥𝒦', 5, '...'), '𝒜𝒞...');
  assert.equal(truncate('😀😀😀😀😀', 4, '🔚'), '😀😀😀🔚');
});

test('space at the end of the excerpt is removed before the ellipsis', () => {
  assert.equal(truncate('Olá mundo', 5), 'Olá…');
  assert.equal(truncate('😀 😀 😀', 3), '😀…');
});

test('maxLength that cannot hold ellipsis + 1 character', () => {
  assert.equal(truncate('😀😁😂', 1), '😀');
  assert.equal(truncate('😀😁😂', 0), '');
  assert.equal(truncate('abcdef', 3, '...'), 'abc');
});

test('codePointLength and truncateFields', () => {
  assert.equal(codePointLength('a😀b'), 3);
  assert.equal(codePointLength(''), 0);
  const rec = { title: '🎉🎉🎉🎉 festa', n: 1 };
  const out = truncateFields(rec, { title: 4, n: 1 });
  assert.deepEqual(out, { title: '🎉🎉🎉…', n: 1 });
  assert.equal(rec.title, '🎉🎉🎉🎉 festa');
});

test('invalid inputs', () => {
  assert.throws(() => truncate('abc', -1), RangeError);
  assert.throws(() => truncate('abc', 1.5), RangeError);
  assert.throws(() => truncate(42, 3), TypeError);
});
