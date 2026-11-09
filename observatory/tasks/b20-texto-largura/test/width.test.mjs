import { test } from 'node:test';
import assert from 'node:assert/strict';
import { codePointWidth, clusterWidth, stringWidth, isWide, sliceColumns } from '../src/width.mjs';

test('larguras por ponto de código', () => {
  assert.equal(codePointWidth(0x41), 1);
  assert.equal(codePointWidth(0x0a), 0);
  assert.equal(codePointWidth(0x85), 0);
  assert.equal(codePointWidth(0xa0), 1);
  assert.equal(codePointWidth(0x0301), 0);
  assert.equal(codePointWidth(0x200b), 0);
  assert.equal(codePointWidth(0x4e2d), 2);
  assert.equal(codePointWidth(0x1f600), 2);
  assert.equal(codePointWidth(0x1f650), 1);
  assert.throws(() => codePointWidth(0x110000), RangeError);
  assert.throws(() => codePointWidth(1.5), RangeError);
});

test('limites das faixas largas', () => {
  for (const cp of [0x1100, 0x115f, 0x2e80, 0x303e, 0x3041, 0x33ff, 0x9fff, 0xac00, 0xd7a3, 0xff00, 0xff60, 0xffe6, 0x1f64f, 0x1f9ff, 0x2fffd, 0x3fffd]) assert.equal(isWide(cp), true, cp.toString(16));
  for (const cp of [0x10ff, 0x1160, 0x303f, 0x3040, 0xa4d0, 0xd7a4, 0xff61, 0xffe7, 0x1f2ff, 0x2fffe]) assert.equal(isWide(cp), false, cp.toString(16));
});

test('larguras de strings nos limites das faixas', () => {
  assert.equal(stringWidth('힣'), 2);
  assert.equal(stringWidth('한국어 힣'), 9);
  assert.equal(stringWidth('｠'), 2);
});

test('largura de clusters', () => {
  assert.equal(clusterWidth('❤️'), 2);
  assert.equal(clusterWidth('❤'), 1);
  assert.equal(clusterWidth('é'), 1);
  assert.equal(clusterWidth('👩‍💻'), 2);
  assert.equal(clusterWidth('\u{1f1e7}\u{1f1f7}'), 2);
  assert.equal(clusterWidth('\u{1f1e7}'), 1);
  assert.equal(clusterWidth('\r\n'), 0);
  assert.equal(clusterWidth(''), 0);
  assert.equal(stringWidth('Olá, 世界! 👍🏽'), 13);
});

test('sliceColumns', () => {
  assert.equal(sliceColumns('ab漢字cd', 1, 5), 'b漢');
  assert.equal(sliceColumns('ab漢字cd', 3, 7), '字c');
  assert.equal(sliceColumns('ab漢字cd', 2), '漢字cd');
  assert.throws(() => sliceColumns('ab', 2, 1), RangeError);
});
