import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, uniqueSlug } from '../src/texto-kit/slugify.mjs';

test('slugify: acentos e pontuação', () => {
  assert.equal(slugify('Olá, Mundo!'), 'ola-mundo');
  assert.equal(slugify('Ação & Reação — 2024'), 'acao-reacao-2024');
});
test('slugify: separadores nas pontas são removidos', () => {
  assert.equal(slugify('  --Hello__World--  '), 'hello-world');
  assert.equal(slugify('!!!'), '');
});
test('slugify: separador customizado', () => {
  assert.equal(slugify('Café com Leite', { separator: '_' }), 'cafe_com_leite');
});
test('slugify: maxLength nunca deixa separador no fim', () => {
  assert.equal(slugify('Olá Mundo Cruel', { maxLength: 10 }), 'ola-mundo');
  assert.equal(slugify('abc def', { maxLength: 4 }), 'abc');
  assert.equal(slugify('abc def', { maxLength: 3 }), 'abc');
});
test('slugify: maxLength maior que o slug não altera', () => {
  assert.equal(slugify('abc def', { maxLength: 50 }), 'abc-def');
});
test('uniqueSlug: sufixos 2, 3, ...', () => {
  assert.equal(uniqueSlug('Olá Mundo', ['ola-mundo', 'ola-mundo-2']), 'ola-mundo-3');
  assert.equal(uniqueSlug('Novo', new Set()), 'novo');
  assert.equal(uniqueSlug('a b', new Set(['a_b']), { separator: '_' }), 'a_b_2');
});
