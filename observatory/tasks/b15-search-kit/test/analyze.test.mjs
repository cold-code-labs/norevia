import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, analyze, termFrequencies, edgeNgrams, DEFAULT_STOPWORDS } from '../src/analyze.mjs';

test('normalize: NFKD, sem diacríticos, minúsculas', () => {
  assert.equal(normalize('Ação Ü'), 'acao u');
  assert.equal(normalize('ﬁm Ｊogo ①'), 'fim jogo 1');
  assert.throws(() => normalize(null), TypeError);
});

test('analyze: tokens, minLength em code points', () => {
  assert.deepEqual(analyze('O Café da Manhã'), ['cafe', 'manha']);
  assert.deepEqual(analyze('a1 b22 ccc', { minLength: 3 }), ['b22', 'ccc']);
  assert.deepEqual(analyze('𠀀 𠀀𠀁, x-y', { minLength: 2 }), ['𠀀𠀁']);
  assert.deepEqual(analyze('ﬁm de Ｊogo ① x', { minLength: 1 }), ['fim', 'jogo', '1', 'x']);
});

test('analyze: stopwords padrão acentuadas também são removidas', () => {
  assert.ok(DEFAULT_STOPWORDS.includes('não'));
  assert.deepEqual(analyze('Não é verdade que a casa é azul'), ['verdade', 'casa', 'azul']);
  assert.deepEqual(analyze('Já às dez, mais nada'), ['dez', 'nada']);
});

test('analyze: stopwords personalizadas são normalizadas', () => {
  assert.deepEqual(analyze('Pão e Café', { stopwords: ['CAFÉ'] }), ['pao']);
  assert.deepEqual(analyze('Pão e Café', { stopwords: new Set(['Pão']) }), ['cafe']);
  assert.deepEqual(analyze('de da do', { stopwords: [] }), ['de', 'da', 'do']);
});

test('termFrequencies: ordem da primeira ocorrência', () => {
  assert.deepEqual([...termFrequencies('Gato gato rato GATO não')], [['gato', 3], ['rato', 1]]);
  assert.deepEqual([...termFrequencies('b a B', { minLength: 1, stopwords: [] })], [['b', 2], ['a', 1]]);
});

test('edgeNgrams', () => {
  assert.deepEqual(edgeNgrams('casa'), ['ca', 'cas', 'casa']);
  assert.deepEqual(edgeNgrams('casa', { min: 1, max: 2 }), ['c', 'ca']);
  assert.deepEqual(edgeNgrams('𠀀𠀁x', { min: 1 }), ['𠀀', '𠀀𠀁', '𠀀𠀁x']);
  assert.deepEqual(edgeNgrams('a'), []);
  assert.throws(() => edgeNgrams('casa', { min: 0 }), RangeError);
  assert.throws(() => edgeNgrams('casa', { min: 3, max: 2 }), RangeError);
});

test('analyze: validação', () => {
  assert.throws(() => analyze('abc', { minLength: 0 }), RangeError);
  assert.throws(() => analyze(42), TypeError);
  assert.throws(() => analyze('abc', { stopwords: 5 }), TypeError);
});
