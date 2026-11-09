import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assemble, run, disassemble } from '../src/vm.mjs';

test('aritmética de 32 bits', () => {
  const r = run(assemble('push 2147483647\npush 1\nadd\nprint\npush -7\npush 2\ndiv\nprint\npush -7\npush 2\nmod\nprint'));
  assert.deepEqual(r.output, [-2147483648, -3, -1]);
  assert.equal(r.steps, 12);
});

test('laço que soma termos grandes', () => {
  const terms = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 7];
  const body = terms.map((k) => `  load 1\n  push ${k}\n  add\n  store 1`).join('\n');
  const src = `  push 0\n  store 0\n  push 0\n  store 1\nloop:\n  load 0\n  push 10\n  lt\n  jz done\n${body}\n  load 0\n  push 1\n  add\n  store 0\n  jmp loop\ndone:\n  load 1\n  print\n  halt\n`;
  const r = run(assemble(src));
  assert.deepEqual(r.output, [660070]);
});

test('desmontagem', () => {
  const code = assemble('push 2\npush 300\nadd\ndup\njz fim\nprint\nfim: halt');
  assert.deepEqual(disassemble(code), ['0000: push 2', '0002: push 300', '0007: add', '0008: dup', '0009: jz @12', '000b: print', '000c: halt']);
});
