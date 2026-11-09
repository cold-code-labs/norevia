import { test } from 'node:test';
import assert from 'node:assert/strict';
import { distance, suggest, didYouMean } from '../src/suggest.mjs';

test('distance: edições básicas', () => {
  assert.equal(distance('kitten', 'sitting'), 3);
  assert.equal(distance('', 'abc'), 3);
  assert.equal(distance('abc', 'abc'), 0);
  assert.equal(distance('flaw', 'lawn'), 2);
});

test('distance: transposição adjacente (alinhamento ótimo)', () => {
  assert.equal(distance('ab', 'ba'), 1);
  assert.equal(distance('abcd', 'acbd'), 1);
  assert.equal(distance('ca', 'abc'), 3);
});

test('distance: code points e maiúsculas', () => {
  assert.equal(distance('😀a', 'a'), 1);
  assert.equal(distance('😀', '😁'), 1);
  assert.equal(distance('A', 'a'), 1);
  assert.throws(() => distance('a', 1), TypeError);
});

test('suggest: sem distinção de maiúsculas, grafia original', () => {
  assert.deepEqual(suggest('INSTAL', ['Install', 'list']), ['Install']);
  assert.deepEqual(suggest('isntall', ['install', 'uninstall', 'list']), ['install']);
  assert.deepEqual(suggest('', ['a']), []);
});

test('suggest: menor distância primeiro; empates na ordem original', () => {
  assert.deepEqual(suggest('cat', ['cut', 'bat', 'cot', 'car'], { maxDistance: 1 }), ['cut', 'bat', 'cot']);
  assert.deepEqual(suggest('stat', ['tats', 'start', 'status', 'stats', 'sat'], { maxDistance: 2, limit: 5 }), ['start', 'stats', 'sat', 'tats', 'status']);
});

test('suggest: maxDistance padrão por code points', () => {
  assert.deepEqual(suggest('ab', ['abcd', 'abc']), ['abc']);
  assert.deepEqual(suggest('abcdef', ['abcxyz', 'abcdxy', 'xbcdef']), ['xbcdef', 'abcdxy']);
  assert.deepEqual(suggest('😀😀😀😀😀', ['😀😀😀']), []);
  assert.deepEqual(suggest('😀😀😀😀😀😀', ['😀😀😀😀']), ['😀😀😀😀']);
  assert.deepEqual(suggest('cat', ['cat', 'cut'], { maxDistance: 0 }), ['cat']);
});

test('suggest: duplicatas e limit', () => {
  assert.deepEqual(suggest('lst', ['LIST', 'list', 'last']), ['LIST', 'last']);
  assert.deepEqual(suggest('lst', ['list', 'last'], { limit: 0 }), []);
  assert.deepEqual(suggest('lst', ['list', 'last'], { limit: 1 }), ['list']);
});

test('didYouMean', () => {
  assert.equal(didYouMean('lst', ['list', 'last', 'lost', 'ls']), 'Você quis dizer "list", "last" ou "lost"?');
  assert.equal(didYouMean('lsit', ['list']), 'Você quis dizer "list"?');
  assert.equal(didYouMean('zzz', ['a']), '');
});
