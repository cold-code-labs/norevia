import { test } from 'node:test';
import assert from 'node:assert/strict';
import { truncate } from '../src/truncate.mjs';

test('ASCII text', () => {
  assert.equal(truncate('abcdefgh', 5), 'abcd…');
  assert.equal(truncate('abc', 5), 'abc');
});

test('emojis count as one character', () => {
  assert.equal(truncate('😀😁😂🤣', 3), '😀😁…');
});
