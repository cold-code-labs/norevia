import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wrap, truncate } from '../src/wrap.mjs';

test('wrap: a line can have exactly width characters', () => {
  assert.equal(wrap('aa bb cc', 5), 'aa bb\ncc');
  assert.equal(wrap('the quick brown fox', 9), 'the quick\nbrown fox');
});
test('wrap: collapses spaces and line breaks', () => {
  assert.equal(wrap('  um\n\n dois   tres ', 20), 'um dois tres');
});
test('wrap: long word stays alone', () => {
  assert.equal(wrap('a supercalifragilistico b', 5), 'a\nsupercalifragilistico\nb');
});
test('wrap: no words returns an empty string', () => {
  assert.equal(wrap('   ', 4), '');
});
test('wrap: invalid width', () => {
  assert.throws(() => wrap('a', 0), RangeError);
  assert.throws(() => wrap('a', 2.5), RangeError);
});
test('truncate', () => {
  assert.equal(truncate('abcdef', 4), 'abc…');
  assert.equal(truncate('abc', 3), 'abc');
  assert.equal(truncate('abcdef', 4, '...'), 'a...');
});
