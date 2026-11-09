import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compressText, decompressText, toHex, tokenize, formatTokens } from '../src/lz77.mjs';

test('ida e volta de texto', () => {
  for (const s of ['', 'ab', 'banana bandana banana', 'olá, olá, mundo!']) assert.equal(decompressText(compressText(s)), s);
});

test('análise de "abcabcabc"', () => {
  assert.equal(formatTokens(tokenize(new TextEncoder().encode('abcabcabc'))), 'a b c <6,3>');
});

test('bytes de referência', () => {
  assert.equal(toHex(compressText('banana bandana banana')), '150462616e010100200106006409070101');
});
