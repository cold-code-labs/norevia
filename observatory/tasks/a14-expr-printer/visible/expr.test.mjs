import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, format, evaluate, simplify } from '../src/expr.mjs';

test('format uses minimal parentheses', () => {
  assert.equal(format(parse('(a + b) * c - (d - e)')), '(a + b) * c - (d - e)');
  assert.equal(format(parse('((a))^(b^c)')), 'a^b^c');
});

test('evaluate respects unary minus and exponentiation', () => {
  assert.equal(evaluate('-2^2'), -4);
  assert.equal(evaluate('2^3^2'), 512);
});

test('simplify followed by format', () => {
  assert.equal(format(simplify(parse('x ^ (1 - 2)'))), 'x^(-1)');
});
