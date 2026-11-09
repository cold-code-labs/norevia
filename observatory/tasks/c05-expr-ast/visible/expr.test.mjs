import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/parser.mjs';
import { evaluateSource } from '../src/evaluate.mjs';
import { print } from '../src/print.mjs';

test('avaliação e impressão de subtrações encadeadas', () => {
  assert.equal(evaluateSource('10 - 4 - 3'), 3);
  assert.equal(print(parse('a - (b - c)')), 'a - (b - c)');
});

test('parse produz a AST documentada', () => {
  assert.deepEqual(parse('a - b'), {
    type: 'bin', op: '-', left: { type: 'var', name: 'a' }, right: { type: 'var', name: 'b' },
  });
});
