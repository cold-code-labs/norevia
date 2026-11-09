import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wrap, wrapCount, wrapIndent } from '../src/wrap.mjs';

test('quebra gulosa por palavras', () => {
  assert.deepEqual(wrap('o rato roeu a roupa do rei', 10), ['o rato', 'roeu a', 'roupa do', 'rei']);
  assert.deepEqual(wrap('  muitos   espaços  aqui ', 7), ['muitos', 'espaços', 'aqui']);
  assert.deepEqual(wrap('a\n\nb c', 3), ['a', '', 'b c']);
  assert.deepEqual(wrap('', 5), ['']);
  assert.deepEqual(wrap('漢字 かな abc', 5), ['漢字', 'かな', 'abc']);
  assert.throws(() => wrap('x', 0), RangeError);
  assert.throws(() => wrap(1, 3), TypeError);
});

test('palavra longa: último pedaço continua a linha', () => {
  assert.deepEqual(wrap('abcdefg hi', 5), ['abcde', 'fg hi']);
  assert.deepEqual(wrap('ab cdefghij k', 4), ['ab', 'cdef', 'ghij', 'k']);
  assert.deepEqual(wrap('x abcdefgh', 3), ['x', 'abc', 'def', 'gh']);
});

test('palavra longa com clusters largos', () => {
  assert.deepEqual(wrap('漢字かな', 3), ['漢', '字', 'か', 'な']);
  assert.deepEqual(wrap('ab漢字cd', 4), ['ab漢', '字cd']);
  assert.deepEqual(wrap('漢字', 1), ['漢', '字']);
  assert.deepEqual(wrap('éééé', 2), ['éé', 'éé']);
});

test('wrapCount e wrapIndent', () => {
  assert.equal(wrapCount('um dois tres', 4), 3);
  assert.deepEqual(wrapIndent('um dois tres', 6, '> '), ['> um', '> dois', '> tres']);
  assert.throws(() => wrapIndent('x', 2, '>>'), RangeError);
});
