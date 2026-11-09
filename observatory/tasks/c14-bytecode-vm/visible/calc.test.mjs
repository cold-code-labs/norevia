import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execute, run } from '../src/vm.mjs';
import { build } from '../src/compiler.mjs';
import { disassemble } from '../src/asm.mjs';

test('round-trip: compilar e executar', () => {
  const cases = [
    ['let x = 7; print x - 2;', [5]],
    ['let n = 10; let s = 0; while (n > 0) { s = s + n; n = n - 1; } print s;', [55]],
    ['let a = 17; let b = 5; print a / b; print a % b; print (a - b) - (b - a); print 20 - (8 - 2) * 3 / 2;', [3, 2, 24, 11]],
    ['let x = 3; if (x < 2) { print 1; } else if (x == 3) { print 2; } else { print 3; }', [2]],
  ];
  for (const [src, out] of cases) {
    for (const optimize of [true, false]) assert.deepEqual(execute(src, { optimize }).output, out, src);
  }
});

test('build: bytecode e desmontagem dourados', () => {
  const p = build('let x = 7; print x - 2;');
  assert.deepEqual(p.code, [1, 0, 3, 0, 2, 0, 1, 1, 6, 19, 0]);
  assert.equal(disassemble(p), ['0000  PUSH 7', '0002  STORE x', '0004  LOAD x', '0006  PUSH 2', '0008  SUB', '0009  PRINT', '0010  HALT'].join('\n'));
});

test('run: bytecode escrito à mão', () => {
  assert.deepEqual(run({ code: [1, 0, 1, 1, 6, 19, 0], consts: [10, 3], names: [], locals: [] }).output, [7]);
});
