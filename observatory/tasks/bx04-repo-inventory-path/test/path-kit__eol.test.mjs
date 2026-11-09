import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countEols, detectEol, normalizeEol, ensureFinalNewline, splitLines, stripTrailingWhitespace } from '../src/path-kit/eol.mjs';

test('countEols', () => {
  assert.deepEqual(countEols('a\r\n\r\nb\rc\n'), { crlf: 2, lf: 1, cr: 1 });
  assert.deepEqual(countEols('\r\r\n'), { crlf: 1, lf: 0, cr: 1 });
  assert.deepEqual(countEols(''), { crlf: 0, lf: 0, cr: 0 });
});

test('detectEol: maioria e texto sem quebras', () => {
  assert.equal(detectEol('a\r\nb\r\nc\n'), '\r\n');
  assert.equal(detectEol('a\rb\rc\n'), '\r');
  assert.equal(detectEol('a\nb\r\nc\n'), '\n');
  assert.equal(detectEol(''), '\n');
  assert.equal(detectEol('abc'), '\n');
});

test('detectEol: empates', () => {
  assert.equal(detectEol('a\r\nb\n'), '\n');
  assert.equal(detectEol('a\rb\n'), '\n');
  assert.equal(detectEol('a\r\nb\r'), '\r\n');
  assert.equal(detectEol('a\rb\r\nc\n'), '\n');
});

test('normalizeEol', () => {
  assert.equal(normalizeEol('a\r\nb\rc\nd', '\r\n'), 'a\r\nb\r\nc\r\nd');
  assert.equal(normalizeEol('\r\r\n'), '\n\n');
  assert.equal(normalizeEol('x\n\n', '\r'), 'x\r\r');
  const once = normalizeEol('a\r\nb\r', '\r\n');
  assert.equal(normalizeEol(once, '\r\n'), once);
  assert.throws(() => normalizeEol('a', 'x'), RangeError);
});

test('ensureFinalNewline', () => {
  assert.equal(ensureFinalNewline(''), '');
  assert.equal(ensureFinalNewline('a\n'), 'a\n');
  assert.equal(ensureFinalNewline('a\r'), 'a\r');
  assert.equal(ensureFinalNewline('a\r\nb'), 'a\r\nb\r\n');
  assert.equal(ensureFinalNewline('ab'), 'ab\n');
  assert.equal(ensureFinalNewline('ab', '\r'), 'ab\r');
  const once = ensureFinalNewline('a\rb');
  assert.equal(once, 'a\rb\r');
  assert.equal(ensureFinalNewline(once), once);
  assert.throws(() => ensureFinalNewline('a', '\n\r'), RangeError);
});

test('ensureFinalNewline com quebras empatadas', () => {
  assert.equal(ensureFinalNewline('a\rb\nc'), 'a\rb\nc\n');
  assert.equal(ensureFinalNewline('a\r\nb\rc'), 'a\r\nb\rc\r\n');
});

test('splitLines e stripTrailingWhitespace', () => {
  assert.deepEqual(splitLines('a\r\nb\rc\n'), ['a', 'b', 'c']);
  assert.deepEqual(splitLines(''), []);
  assert.deepEqual(splitLines('\n'), ['']);
  assert.deepEqual(splitLines('a\n\nb'), ['a', '', 'b']);
  assert.equal(stripTrailingWhitespace('a \t\r\nb  \rc \n d \t'), 'a\r\nb\rc\n d');
  assert.equal(stripTrailingWhitespace('a '), 'a ');
});
