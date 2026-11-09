import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPatch } from '../src/unified.mjs';
import { parseUnified } from '../src/parse.mjs';
import { applyPatch } from '../src/patch.mjs';

test('round-trip: createPatch → parseUnified → applyPatch', () => {
  const pairs = [
    ['um\ndois\ntres\n', 'um\nDOIS\ntres\n'],
    ['a\nb\nc\nd\ne\nf\ng\nh\n', 'a\nb\nC\nd\ne\nf\ng\nH\n'],
    ['x\ny\n', 'x\ny\nz\n'],
  ];
  for (const [a, b] of pairs) {
    for (const context of [0, 1, 3]) {
      assert.equal(applyPatch(a, parseUnified(createPatch(a, b, { context }))), b);
    }
  }
});

test('createPatch: troca de uma linha sem contexto', () => {
  assert.equal(createPatch('um\ndois\ntres\n', 'um\nDOIS\ntres\n', { context: 0 }),
    '--- a\n+++ b\n@@ -2 +2 @@\n-dois\n+DOIS\n');
});
