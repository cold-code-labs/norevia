import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatUnified, createPatch } from '../src/diff-patch/unified.mjs';
import { parseUnified } from '../src/diff-patch/parse.mjs';

test('formatUnified: cabeçalhos com e sem contagem', () => {
  assert.equal(createPatch('um\ndois\ntres\n', 'um\nDOIS\ntres\nquatro\n'),
    '--- a\n+++ b\n@@ -1,3 +1,4 @@\n um\n-dois\n+DOIS\n tres\n+quatro\n');
  assert.equal(formatUnified([{ oldStart: 0, oldLines: 0, newStart: 1, newLines: 1, lines: ['+x'] }]),
    '--- a\n+++ b\n@@ -0,0 +1 @@\n+x\n');
  assert.equal(formatUnified([{ oldStart: 7, oldLines: 1, newStart: 6, newLines: 0, lines: ['-z'] }], { from: 'v1', to: 'v2' }),
    '--- v1\n+++ v2\n@@ -7 +6,0 @@\n-z\n');
  assert.equal(formatUnified([]), '');
});

test('parseUnified: contagem omitida vale 1', () => {
  assert.deepEqual(parseUnified('--- a\n+++ b\n@@ -3 +3 @@\n-c\n+C\n@@ -10,2 +10 @@\n x\n-y\n'), [
    { oldStart: 3, oldLines: 1, newStart: 3, newLines: 1, lines: ['-c', '+C'] },
    { oldStart: 10, oldLines: 2, newStart: 10, newLines: 1, lines: [' x', '-y'] },
  ]);
  assert.deepEqual(parseUnified('@@ -0,0 +1,2 @@\n+p\n+q\n'), [
    { oldStart: 0, oldLines: 0, newStart: 1, newLines: 2, lines: ['+p', '+q'] },
  ]);
});

test('parseUnified: erros de estrutura', () => {
  assert.throws(() => parseUnified('lixo\n@@ -1 +1 @@\n-a\n+b\n'), SyntaxError);
  assert.throws(() => parseUnified('@@ -1,2 +1,2 @@\n a\n'), SyntaxError);
  assert.throws(() => parseUnified('@@ -1,1 +1,1 @@\n-a\n+b\n+c\n'), SyntaxError);
  assert.throws(() => parseUnified('@@ -1,1 +1,1 @@\n*a\n'), SyntaxError);
  assert.throws(() => parseUnified('@@ -1,0 +1,0 @@\n'), SyntaxError);
  assert.deepEqual(parseUnified(''), []);
});
