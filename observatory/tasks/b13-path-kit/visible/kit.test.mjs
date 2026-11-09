import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePointer, getAt } from '../src/pointer.mjs';
import { applyPatch } from '../src/patch.mjs';
import { ensureFinalNewline } from '../src/eol.mjs';
import { matchGlob } from '../src/glob.mjs';
import { normalize, join } from '../src/posixpath.mjs';

test('pointer: tokens e leitura', () => {
  assert.deepEqual(parsePointer('/a~1b/~0c/0'), ['a/b', '~c', '0']);
  assert.equal(getAt({ itens: [{ id: 7 }] }, '/itens/0/id'), 7);
});

test('patch: mover tarefa não altera o quadro original', () => {
  const quadro = { fila: ['t1', 't2'], feitos: [] };
  const novo = applyPatch(quadro, [{ op: 'move', from: ['fila', 0], path: ['feitos', '-'] }]);
  assert.deepEqual(novo, { fila: ['t2'], feitos: ['t1'] });
  assert.deepEqual(quadro, { fila: ['t1', 't2'], feitos: [] });
});

test('eol: arquivo com quebras mistas recebe LF no fim', () => {
  assert.equal(ensureFinalNewline('x\r\ny\nz'), 'x\r\ny\nz\n');
});

test('glob e caminhos básicos', () => {
  assert.equal(matchGlob('src/**/*.js', 'src/a/b.js'), true);
  assert.equal(matchGlob('*.js', 'lib/a.js'), false);
  assert.equal(normalize('/a/./b/../c/'), '/a/c/');
  assert.equal(join('a', '../b'), 'b');
});
