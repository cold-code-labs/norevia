import { test } from 'node:test';
import assert from 'node:assert/strict';
import { segment, codePoints, graphemeCount, sliceGraphemes, reverseGraphemes, chunkGraphemes, graphemeOffsets, isExtender, isRegionalIndicator } from '../src/grapheme.mjs';

const RI = (s) => [...s].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join('');

test('marcas combinantes, seletores de variação, modificadores e CRLF', () => {
  assert.deepEqual(segment('á̂b'), ['á̂', 'b']);
  assert.deepEqual(segment('́x'), ['́', 'x']);
  assert.deepEqual(segment('❤️!'), ['❤️', '!']);
  assert.deepEqual(segment('👍🏽👍'), ['👍🏽', '👍']);
  assert.deepEqual(segment('a\r\nb\n\rc'), ['a', '\r\n', 'b', '\n', '\r', 'c']);
  assert.deepEqual(segment(''), []);
  assert.throws(() => segment(3), TypeError);
  assert.equal(isExtender(0x1ab0), true);
  assert.equal(isExtender(0x2764), false);
});

test('sequências ZWJ', () => {
  assert.deepEqual(segment('👩‍💻x'), ['👩‍💻', 'x']);
  assert.deepEqual(segment('👨‍👩‍👧'), ['👨‍👩‍👧']);
  assert.deepEqual(segment('a‍b c'), ['a‍b', ' ', 'c']);
});

test('indicadores regionais formam pares da esquerda para a direita', () => {
  assert.deepEqual(segment(RI('BRUS')), [RI('BR'), RI('US')]);
  assert.deepEqual(segment(RI('BRU')), [RI('BR'), RI('U')]);
  assert.deepEqual(segment(RI('BRUSA') + 'x'), [RI('BR'), RI('US'), RI('A'), 'x']);
  assert.equal(isRegionalIndicator(0x1f1ff), true);
});

test('pares de indicadores recomeçam após outro ponto de código', () => {
  assert.deepEqual(segment(RI('A') + 'x' + RI('BR')), [RI('A'), 'x', RI('BR')]);
  assert.deepEqual(segment(RI('BRU') + ' ' + RI('PT')), [RI('BR'), RI('U'), ' ', RI('PT')]);
  assert.deepEqual(segment(RI('A') + '́' + RI('BR')), [RI('A') + '́', RI('BR')]);
  assert.equal(graphemeCount(RI('JPN') + 'a' + RI('FR')), 4);
});

test('funções derivadas', () => {
  assert.deepEqual(codePoints('a😀'), [0x61, 0x1f600]);
  assert.equal(graphemeCount('é👍🏽'), 2);
  assert.equal(sliceGraphemes('aéio', 1, 3), 'éi');
  assert.equal(sliceGraphemes('aéio', -2), 'io');
  assert.equal(reverseGraphemes('aé' + RI('BR')), RI('BR') + 'éa');
  assert.deepEqual(chunkGraphemes('abcdé', 2), ['ab', 'cd', 'é']);
  assert.throws(() => chunkGraphemes('ab', 0), RangeError);
  assert.deepEqual(graphemeOffsets('a😀éb'), [0, 1, 3, 5]);
});
