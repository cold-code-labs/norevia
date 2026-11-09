import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/expr-ast/parser.mjs';
import { evaluate, evaluateSource } from '../src/expr-ast/evaluate.mjs';
import { print } from '../src/expr-ast/print.mjs';
import { variables, size } from '../src/expr-ast/walk.mjs';

const num = (value) => ({ type: 'num', value });
const v = (name) => ({ type: 'var', name });
const neg = (arg) => ({ type: 'neg', arg });
const bin = (op, left, right) => ({ type: 'bin', op, left, right });

test('parse: ASTs douradas', () => {
  assert.deepEqual(parse('a - b'), bin('-', v('a'), v('b')));
  assert.deepEqual(parse('a - b - c'), bin('-', bin('-', v('a'), v('b')), v('c')));
  assert.deepEqual(parse('2 ^ 3 ^ 2'), bin('^', num(2), bin('^', num(3), num(2))));
  assert.deepEqual(parse('-x ^ 2'), neg(bin('^', v('x'), num(2))));
  assert.deepEqual(parse('8 / 2.5 * y'), bin('*', bin('/', num(8), num(2.5)), v('y')));
});

test('parse: erros de sintaxe', () => {
  for (const s of ['', '   ', '2 +', '(1', '1)', '2 3', 'a $ b', '* 2', '()']) {
    assert.throws(() => parse(s), SyntaxError, s);
  }
  assert.throws(() => parse(42), TypeError);
});

test('evaluate: ASTs construídas à mão', () => {
  assert.equal(evaluate(bin('-', num(10), num(4))), 6);
  assert.equal(evaluate(bin('/', num(1), num(4))), 0.25);
  assert.equal(evaluate(bin('^', num(2), num(10))), 1024);
  assert.equal(evaluate(bin('%', v('a'), num(4)), { a: 7 }), 3);
  assert.equal(evaluate(neg(bin('-', num(1), num(3)))), 2);
});

test('evaluate: erros', () => {
  assert.throws(() => evaluate(v('z'), { y: 1 }), ReferenceError);
  assert.throws(() => evaluate(v('toString')), ReferenceError);
  assert.throws(() => evaluate(bin('/', num(1), num(0))), RangeError);
  assert.throws(() => evaluateSource('5 % (2 - 2)'), RangeError);
  assert.throws(() => evaluate({ type: 'call' }), TypeError);
});

test('evaluateSource: associatividade e precedência binária', () => {
  assert.equal(evaluateSource('10 - 4 - 3'), 3);
  assert.equal(evaluateSource('100 / 10 / 5'), 2);
  assert.equal(evaluateSource('2 ^ 3 ^ 2'), 512);
  assert.equal(evaluateSource('7 % 4 * 2'), 6);
  assert.equal(evaluateSource('2 ^ -1'), 0.5);
  assert.equal(evaluateSource('2 - 3 ^ 2 * 2'), -16);
  assert.equal(evaluateSource('x - y', { x: 10, y: 3 }), 7);
});

test('evaluateSource: menos unário e potência', () => {
  assert.equal(evaluateSource('-2 ^ 2'), -4);
  assert.equal(evaluateSource('(-2) ^ 2'), 4);
  assert.equal(evaluateSource('2 * -3 ^ 2'), -18);
  assert.equal(evaluateSource('-2 ^ -2 ^ 2'), -0.0625);
});

test('print: ASTs construídas à mão', () => {
  assert.equal(print(bin('-', v('a'), bin('-', v('b'), v('c')))), 'a - (b - c)');
  assert.equal(print(bin('-', bin('-', v('a'), v('b')), v('c'))), 'a - b - c');
  assert.equal(print(bin('^', num(2), bin('^', num(3), num(2)))), '2 ^ 3 ^ 2');
  assert.equal(print(bin('^', bin('^', num(2), num(3)), num(2))), '(2 ^ 3) ^ 2');
  assert.equal(print(neg(bin('^', num(2), num(2)))), '-2 ^ 2');
  assert.equal(print(bin('^', neg(num(2)), num(2))), '(-2) ^ 2');
  assert.equal(print(bin('^', num(2), neg(num(1)))), '2 ^ -1');
  assert.equal(print(neg(bin('*', v('a'), v('b')))), '-(a * b)');
  assert.equal(print(bin('*', bin('+', v('a'), v('b')), v('c'))), '(a + b) * c');
});

test('print(parse(s)) preserva textos canônicos', () => {
  for (const s of ['a - (b - c)', '2 ^ 3 ^ 2', '(2 ^ 3) ^ 2', 'a * -b', '-a * b', 'x / (y * z) % 2',
    '-(a + b) ^ 2', '-2 ^ 2', '2 ^ -x ^ 2', 'a - -b', '--x', '(a - b) * (c + d) / e', '-(a * b)']) {
    assert.equal(print(parse(s)), s);
  }
});

test('print(parse(s)) normaliza parênteses e espaços', () => {
  assert.equal(print(parse('((a))-(b)  *c')), 'a - b * c');
  assert.equal(print(parse('(-2)^2')), '(-2) ^ 2');
  assert.equal(print(parse('-(2^2)')), '-2 ^ 2');
  assert.equal(print(parse('(a^b)^-c')), '(a ^ b) ^ -c');
});

test('walk: variables e size em ASTs construídas à mão', () => {
  assert.deepEqual(variables(bin('+', v('y'), bin('*', v('x'), v('z')))), ['y', 'x', 'z']);
  assert.deepEqual(variables(parse('b * a + b - c')), ['b', 'a', 'c']);
  assert.equal(size(bin('+', v('y'), neg(num(1)))), 4);
});

test('árvores profundas não estouram a pilha', () => {
  const src = 'x' + ' - x'.repeat(3000);
  assert.equal(evaluateSource(src, { x: 1 }), -2999);
  assert.equal(print(parse(src)), src);
});
