import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeRow, decodeRow, encodeGrid, decodeGrid } from '../src/grade-kit/rle.mjs';

test('encodeRow', () => {
  assert.equal(encodeRow('aaabcc'), '3ab2c');
  assert.equal(encodeRow('abc'), 'abc');
  assert.equal(encodeRow(''), '');
});
test('encodeRow com corridas longas', () => {
  assert.equal(encodeRow('x'.repeat(12) + 'y'), '12xy');
});
test('decodeRow', () => {
  assert.equal(decodeRow('3ab2c'), 'aaabcc');
  assert.equal(decodeRow(''), '');
});
test('decodeRow com contagens de vários dígitos', () => {
  assert.equal(decodeRow('12xy'), 'x'.repeat(12) + 'y');
  assert.equal(decodeRow('10.2#'), '..........##');
});
test('ida e volta', () => {
  const row = '#'.repeat(25) + '...' + '#';
  assert.equal(decodeRow(encodeRow(row)), row);
});
test('erros', () => {
  assert.throws(() => encodeRow('a1'), RangeError);
  assert.throws(() => decodeRow('3'), SyntaxError);
  assert.throws(() => decodeRow('a12'), SyntaxError);
});
test('grades', () => {
  assert.deepEqual(encodeGrid(['..##', '####']), ['2.2#', '4#']);
  assert.deepEqual(decodeGrid(['2.2#', '4#']), ['..##', '####']);
});
