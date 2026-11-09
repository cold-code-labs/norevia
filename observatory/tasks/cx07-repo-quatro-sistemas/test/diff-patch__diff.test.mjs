import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitLines, joinLines, diffLines } from '../src/diff-patch/diff.mjs';

test('splitLines / joinLines', () => {
  assert.deepEqual(splitLines(''), []);
  assert.deepEqual(splitLines('a\nb\n'), ['a', 'b']);
  assert.deepEqual(splitLines('a\nb'), ['a', 'b']);
  assert.deepEqual(splitLines('\n'), ['']);
  assert.equal(joinLines(['a', '']), 'a\n\n');
  assert.throws(() => splitLines(null), TypeError);
});

test('diffLines: hunks com contexto e agrupamento', () => {
  assert.deepEqual(diffLines('a\nb\nc\nd\ne\nf\ng\nh\ni\nj\n', 'a\nB\nc\nd\ne\nf\ng\nh\ni\nj\nk\n', { context: 2 }), [
    { oldStart: 1, oldLines: 4, newStart: 1, newLines: 4, lines: [' a', '-b', '+B', ' c', ' d'] },
    { oldStart: 9, oldLines: 2, newStart: 9, newLines: 3, lines: [' i', ' j', '+k'] },
  ]);
  assert.deepEqual(diffLines('a\nb\nc\nd\ne\nf\n', 'a\nB\nc\nd\ne\nF\n', { context: 1 }), [
    { oldStart: 1, oldLines: 3, newStart: 1, newLines: 3, lines: [' a', '-b', '+B', ' c'] },
    { oldStart: 5, oldLines: 2, newStart: 5, newLines: 2, lines: [' e', '-f', '+F'] },
  ]);
  assert.deepEqual(diffLines('a\nb\nc\nd\ne\nf\n', 'a\nB\nc\nd\ne\nF\n', { context: 2 }).length, 1);
  assert.deepEqual(diffLines('igual\n', 'igual\n'), []);
  assert.throws(() => diffLines('a', 'b', { context: -1 }), RangeError);
});

test('diffLines: lados com zero linhas', () => {
  assert.deepEqual(diffLines('', 'x\ny\n'), [{ oldStart: 0, oldLines: 0, newStart: 1, newLines: 2, lines: ['+x', '+y'] }]);
  assert.deepEqual(diffLines('a\nb\n', ''), [{ oldStart: 1, oldLines: 2, newStart: 0, newLines: 0, lines: ['-a', '-b'] }]);
  assert.deepEqual(diffLines('a\nb\nc\n', 'a\nb\nX\nc\n', { context: 0 }), [{ oldStart: 2, oldLines: 0, newStart: 3, newLines: 1, lines: ['+X'] }]);
  assert.deepEqual(diffLines('a\nb\nc\nd\n', 'a\nd\n', { context: 0 }), [{ oldStart: 2, oldLines: 2, newStart: 1, newLines: 0, lines: ['-b', '-c'] }]);
});
