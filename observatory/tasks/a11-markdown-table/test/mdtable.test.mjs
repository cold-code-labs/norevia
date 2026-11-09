import { test } from 'node:test';
import assert from 'node:assert/strict';
import { charWidth, displayWidth, escapeCell, unescapeCell, padCell, normalizeRows, formatTable, parseTable } from '../src/mdtable.mjs';

test('charWidth: specification range boundaries', () => {
  const cases = [
    [0x41, 1], [0x0300, 0], [0x036f, 0], [0x0370, 1], [0x200d, 0], [0x2010, 1],
    [0x1100, 2], [0x115f, 2], [0x1160, 1], [0x2e7f, 1], [0x2e80, 2], [0x303e, 2], [0x303f, 1],
    [0x3040, 1], [0x3041, 2], [0xac00, 2], [0xd7a3, 2], [0xd7a4, 1], [0xff00, 2], [0xff60, 2], [0xff61, 1],
    [0xffe6, 2], [0xffe7, 1], [0x2705, 1], [0x1f300, 2], [0x1f64f, 2], [0x1f650, 1], [0x1f8ff, 1],
    [0x1f900, 2], [0x20000, 2], [0x3fffd, 2], [0x3fffe, 1], [0x1d400, 1],
  ];
  for (const [cp, w] of cases) assert.equal(charWidth(cp), w, cp.toString(16));
  assert.throws(() => charWidth(-1), RangeError);
  assert.throws(() => charWidth(0x110000), RangeError);
  assert.throws(() => charWidth(65.5), RangeError);
});

test('displayWidth counts code points (including outside the BMP)', () => {
  assert.equal(displayWidth(''), 0);
  assert.equal(displayWidth('abc'), 3);
  assert.equal(displayWidth('漢字'), 4);
  assert.equal(displayWidth('😀'), 2);
  assert.equal(displayWidth('𠀀x'), 3);
  assert.equal(displayWidth('𝐀𝐁'), 2);
  assert.equal(displayWidth('é'), 1);
  assert.equal(displayWidth('a😀́b'), 4);
  assert.throws(() => displayWidth(42), TypeError);
});

test('escapeCell: conversion, breaks, tabs, trim and pipes', () => {
  assert.equal(escapeCell(null), '');
  assert.equal(escapeCell(undefined), '');
  assert.equal(escapeCell(0), '0');
  assert.equal(escapeCell(false), 'false');
  assert.equal(escapeCell('  a\r\nb\rc\nd  '), 'a<br>b<br>c<br>d');
  assert.equal(escapeCell('\r\n\tz\t\n'), 'z');
  assert.equal(escapeCell('a\tb'), 'a b');
  assert.equal(escapeCell('a\\b|c||'), 'a\\b\\|c\\|\\|');
  assert.equal(unescapeCell('x\\|y<br>z'), 'x|y\nz');
});

test('padCell: right, left, center with the odd space on the right', () => {
  assert.equal(padCell('ab', 5, 'left'), 'ab   ');
  assert.equal(padCell('ab', 5, 'none'), 'ab   ');
  assert.equal(padCell('ab', 5, 'right'), '   ab');
  assert.equal(padCell('ab', 5, 'center'), ' ab  ');
  assert.equal(padCell('ab', 6, 'center'), '  ab  ');
  assert.equal(padCell('abcdef', 3, 'right'), 'abcdef');
  assert.equal(padCell('😀', 5, 'center'), ' 😀  ');
  assert.equal(padCell('𝐀', 3, 'right'), '  𝐀');
});

test('normalizeRows: objects with keys in order of first occurrence', () => {
  const rows = [{ b: 1, a: 2 }, { c: 3, a: 4 }, { d: undefined }];
  assert.deepEqual(normalizeRows(rows), {
    header: ['b', 'a', 'c', 'd'],
    body: [[1, 2, '', ''], ['', 4, 3, ''], ['', '', '', undefined]],
  });
  const proto = Object.create({ herdada: 'x' });
  proto.propria = 'y';
  assert.deepEqual(normalizeRows([proto], { columns: ['propria', 'herdada'] }), { header: ['propria', 'herdada'], body: [['y', '']] });
});

test('normalizeRows: ragged arrays and columns', () => {
  assert.deepEqual(normalizeRows([['a'], [1, 2, 3], [4]]), { header: ['a', '', ''], body: [[1, 2, 3], [4, '', '']] });
  assert.deepEqual(normalizeRows([[1, 2]], { columns: ['x'] }), { header: ['x', ''], body: [[1, 2]] });
  assert.deepEqual(normalizeRows([], { columns: ['k'] }), { header: ['k'], body: [] });
  assert.throws(() => normalizeRows([[1], { a: 1 }]), TypeError);
  assert.throws(() => normalizeRows([{ a: 1 }, null]), TypeError);
  assert.throws(() => normalizeRows('x'), TypeError);
});

test('formatTable: objects, alignments and missing cells', () => {
  const out = formatTable([{ nome: 'Ana', idade: 31 }, { nome: 'Bo', cidade: 'Rio' }], { align: ['left', 'auto', 'center'] });
  assert.equal(out, [
    '| nome | idade | cidade |',
    '| :--- | ----: | :----: |',
    '| Ana  |    31 |        |',
    '| Bo   |       |  Rio   |',
  ].join('\n'));
});

test('formatTable: minWidth and minimum marker width', () => {
  const out = formatTable([['a', 'b', 'c', 'd'], [1, 2, 3, 4]], { minWidth: 1, align: ['left', 'right', 'center'] });
  assert.equal(out, [
    '| a  |  b |  c  | d |',
    '| :- | -: | :-: | - |',
    '| 1  |  2 |  3  | 4 |',
  ].join('\n'));
  assert.equal(formatTable([['x']]), '| x   |\n| --- |');
});

test('formatTable: auto only right-aligns entirely numeric columns', () => {
  const out = formatTable([['n', 'm', 'v', 'e'], ['-2,5', '1e3', '', ''], ['+10', '7', '3.25', '']], { align: ['auto', 'auto', 'auto', 'auto'] });
  assert.equal(out, [
    '|    n | m   |    v | e   |',
    '| ---: | :-- | ---: | :-- |',
    '| -2,5 | 1e3 |      |     |',
    '|  +10 | 7   | 3.25 |     |',
  ].join('\n'));
});

test('formatTable: emoji, ideographs outside the BMP and mathematical letters centered', () => {
  const out = formatTable([['h', 'k'], ['😀', '𠀀𠀀'], ['ab', '𝐀']], { align: ['center', 'center'] });
  assert.equal(out, [
    '|  h  |  k   |',
    '| :-: | :--: |',
    '| 😀  | 𠀀𠀀 |',
    '| ab  |  𝐀   |',
  ].join('\n'));
});

test('formatTable: width computed on the escaped text', () => {
  const out = formatTable([{ cmd: 'a|b', nota: 'x\r\ny' }]);
  assert.equal(out, [
    '| cmd  | nota   |',
    '| ---- | ------ |',
    '| a\\|b | x<br>y |',
  ].join('\n'));
});

test('formatTable: empty cases, validation and immutability', () => {
  assert.equal(formatTable([]), '');
  assert.equal(formatTable([{}]), '');
  assert.equal(formatTable([[]]), '');
  assert.equal(formatTable([], { columns: ['a', 'b'] }), '| a   | b   |\n| --- | --- |');
  assert.throws(() => formatTable([['a']], { align: ['middle'] }), RangeError);
  assert.throws(() => formatTable([['a']], { minWidth: 0 }), RangeError);
  assert.throws(() => formatTable([['a']], { minWidth: 2.5 }), RangeError);
  const rows = [['a', 'b'], ['1']];
  const snapshot = JSON.stringify(rows);
  formatTable(rows, { align: ['auto'] });
  assert.equal(JSON.stringify(rows), snapshot);
});

test('parseTable: optional pipes, escapes, ragged rows and round trip', () => {
  assert.deepEqual(parseTable('a | b\r\n:-: | --\n\nx \\| y | z | w\nq'), {
    header: ['a', 'b'], align: ['center', 'none'], rows: [['x | y', 'z'], ['q', '']],
  });
  const data = [['Nome', 'Obs'], ['😀 Zé', 'linha1\nlinha2'], ['𠀀', 'a|b']];
  const md = formatTable(data, { align: ['right', 'left'] });
  assert.deepEqual(parseTable(md), { header: ['Nome', 'Obs'], align: ['right', 'left'], rows: [['😀 Zé', 'linha1\nlinha2'], ['𠀀', 'a|b']] });
  assert.throws(() => parseTable('| a |'), SyntaxError);
  assert.throws(() => parseTable('| a | b |\n| -- | x |'), SyntaxError);
  assert.throws(() => parseTable('| a | b |\n| --- |'), SyntaxError);
  assert.throws(() => parseTable(null), TypeError);
});
