import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffLines, joinLines, splitLines } from '../src/diff.mjs';
import { createPatch } from '../src/unified.mjs';
import { parseUnified } from '../src/parse.mjs';
import { applyPatch, reversePatch, PatchError } from '../src/patch.mjs';

const PAIRS = [
  ['', 'x\ny\n'],
  ['a\nb\n', ''],
  ['a\nb\nc\n', 'a\nb\nX\nc\n'],
  ['a\nb\nc\nd\n', 'a\nd\n'],
  ['a\nb\nc\n', 'Z\na\nb\nc\n'],
  ['a\nb\nc\n', 'a\nb\nc\nZ\n'],
  ['um\ndois\ntres\n', 'um\nDOIS\ntres\n'],
  ['1\n2\n3\n4\n5\n6\n7\n8\n9\n', '0\n1\n2\n4\n5\n6\n6b\n7\n9\n'],
  ['x\nx\nx\n', 'x\ny\nx\n'],
  ['p\nq', 'q\np\n'],
];

test('applyPatch: hunks dourados com lados de zero linhas', () => {
  assert.equal(applyPatch('', [{ oldStart: 0, oldLines: 0, newStart: 1, newLines: 2, lines: ['+x', '+y'] }]), 'x\ny\n');
  assert.equal(applyPatch('a\nb\nc\n', [{ oldStart: 2, oldLines: 0, newStart: 3, newLines: 1, lines: ['+X'] }]), 'a\nb\nX\nc\n');
  assert.equal(applyPatch('a\nb\n', [{ oldStart: 1, oldLines: 2, newStart: 0, newLines: 0, lines: ['-a', '-b'] }]), '');
  assert.equal(applyPatch('a\nb\nc\nd\n', [{ oldStart: 2, oldLines: 2, newStart: 1, newLines: 0, lines: ['-b', '-c'] }]), 'a\nd\n');
});

test('applyPatch: texto unified dourado', () => {
  const patch = '--- a\n+++ b\n@@ -2 +2 @@\n-dois\n+DOIS\n@@ -5,0 +6 @@\n+cinco e meio\n';
  assert.equal(applyPatch('um\ndois\ntres\nquatro\ncinco\nseis\n', parseUnified(patch)),
    'um\nDOIS\ntres\nquatro\ncinco\ncinco e meio\nseis\n');
  assert.equal(applyPatch('', parseUnified('@@ -0,0 +1 @@\n+só\n')), 'só\n');
});

test('round-trip: diffLines → applyPatch', () => {
  for (const [a, b] of PAIRS) {
    for (const context of [0, 1, 2, 3]) {
      assert.equal(applyPatch(a, diffLines(a, b, { context })), joinLines(splitLines(b)), JSON.stringify([a, b, context]));
    }
  }
});

test('round-trip: texto unified → parseUnified → applyPatch', () => {
  for (const [a, b] of PAIRS) {
    for (const context of [0, 1, 3]) {
      assert.equal(applyPatch(a, parseUnified(createPatch(a, b, { context }))), joinLines(splitLines(b)), JSON.stringify([a, b, context]));
    }
  }
});

test('reversePatch desfaz o diff', () => {
  for (const [a, b] of PAIRS) {
    for (const context of [0, 2]) {
      const hunks = diffLines(a, b, { context });
      assert.equal(applyPatch(joinLines(splitLines(b)), reversePatch(hunks)), joinLines(splitLines(a)), JSON.stringify([a, b, context]));
    }
  }
});

test('applyPatch: divergências viram PatchError', () => {
  const h = { oldStart: 2, oldLines: 1, newStart: 2, newLines: 1, lines: ['-b', '+B'] };
  assert.throws(() => applyPatch('a\nX\nc\n', [h]), PatchError);
  assert.throws(() => applyPatch('a\nb\nc\n', [h, h]), PatchError);
  assert.throws(() => applyPatch('a\nb\nc\n', [{ ...h, newLines: 2 }]), PatchError);
  assert.throws(() => applyPatch('a\nb\nc\n', [{ ...h, newStart: 3 }]), PatchError);
  assert.throws(() => applyPatch('a\n', [{ oldStart: 2, oldLines: 1, newStart: 2, newLines: 1, lines: ['-b', '+c'] }]), PatchError);
});
