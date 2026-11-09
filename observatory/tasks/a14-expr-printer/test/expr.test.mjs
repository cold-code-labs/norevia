import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, parse, format, evaluate, simplify } from '../src/expr.mjs';

const num = (value) => ({ type: 'num', value });
const v = (name) => ({ type: 'var', name });
const neg = (arg) => ({ type: 'neg', arg });
const bin = (op, left, right) => ({ type: 'bin', op, left, right });

test('tokenize: numbers, exponent and positions', () => {
  assert.deepEqual(tokenize('2.5E-4 + x_1'), [
    { type: 'num', value: 0.00025, pos: 0 },
    { type: 'op', value: '+', pos: 7 },
    { type: 'id', value: 'x_1', pos: 9 },
  ]);
  assert.deepEqual(tokenize('3e+x'), [
    { type: 'num', value: 3, pos: 0 },
    { type: 'id', value: 'e', pos: 1 },
    { type: 'op', value: '+', pos: 2 },
    { type: 'id', value: 'x', pos: 3 },
  ]);
  assert.throws(() => tokenize('1. + 2'), SyntaxError);
  assert.throws(() => tokenize('.5'), SyntaxError);
  assert.throws(() => tokenize('a $ b'), SyntaxError);
  assert.throws(() => tokenize(42), TypeError);
});

test('parse: precedence and associativity', () => {
  assert.deepEqual(parse('a - b - c'), bin('-', bin('-', v('a'), v('b')), v('c')));
  assert.deepEqual(parse('a ^ b ^ c'), bin('^', v('a'), bin('^', v('b'), v('c'))));
  assert.deepEqual(parse('-2^2'), neg(bin('^', num(2), num(2))));
  assert.deepEqual(parse('2^-x'), bin('^', num(2), neg(v('x'))));
  assert.deepEqual(parse('-a * b'), bin('*', neg(v('a')), v('b')));
  assert.deepEqual(parse('f()'), { type: 'call', name: 'f', args: [] });
  assert.deepEqual(parse('g(a, b + 1)'), { type: 'call', name: 'g', args: [v('a'), bin('+', v('b'), num(1))] });
});

test('parse: syntax errors', () => {
  for (const s of ['', '1 +', '(1', '2 3', '+x', 'f(,)', 'f(a,)', '3e', 'a)']) {
    assert.throws(() => parse(s), SyntaxError, s);
  }
});

test('format: minimal parentheses and spacing', () => {
  const cases = {
    'a - (b - c)': 'a - (b - c)',
    '(a - b) - c': 'a - b - c',
    'a + (b - c)': 'a + (b - c)',
    'a / (b * c)': 'a / (b * c)',
    '(a^b)^c': '(a^b)^c',
    '(-2)^2': '(-2)^2',
    '-(2^2)': '-2^2',
    '2^-1': '2^(-1)',
    'a*-b': 'a * -b',
    'a--b': 'a - -b',
    '-(a+b)': '-(a + b)',
    '--a': '-(-a)',
    'f(a+b,-c)': 'f(a + b, -c)',
    '1e21 * x': '1e+21 * x',
  };
  for (const [src, out] of Object.entries(cases)) assert.equal(format(parse(src)), out, src);
});

test('format: negative literal has the precedence of unary minus', () => {
  assert.equal(format(bin('^', num(-2), v('x'))), '(-2)^x');
  assert.equal(format(bin('^', v('x'), num(-0.5))), 'x^(-0.5)');
  assert.equal(format(neg(num(-3))), '-(-3)');
  assert.equal(format(bin('*', v('a'), num(-3))), 'a * -3');
  assert.equal(format(bin('-', num(-1), v('b'))), '-1 - b');
  assert.equal(format(neg(num(3))), '-3');
});

test('format: non-finite literal', () => {
  assert.throws(() => format(num(Infinity)), RangeError);
  assert.throws(() => format(num(NaN)), RangeError);
});

test('evaluate: operators, modulo and functions', () => {
  assert.equal(evaluate('1 + 2 * 3 - 4 / 2'), 5);
  assert.equal(evaluate('2^-1'), 0.5);
  assert.equal(evaluate('-7 % 3'), 2);
  assert.equal(evaluate('7 % -3'), -2);
  assert.equal(evaluate('round(2.5) + round(-2.5) * 10'), -27);
  assert.equal(evaluate('max(1, x, 3) - min(y)', { x: 5, y: -1 }), 6);
  assert.equal(evaluate('abs(-4) + sqrt(9)'), 7);
  assert.equal(evaluate('max(2)', { max: (a) => a * 100 }), 200);
  assert.equal(evaluate(parse('x * x'), { x: 3 }), 9);
});

test('evaluate: errors', () => {
  assert.throws(() => evaluate('x + 1'), ReferenceError);
  assert.throws(() => evaluate('toString'), ReferenceError);
  assert.throws(() => evaluate('nope(1)'), ReferenceError);
  assert.throws(() => evaluate('1 / (2 - 2)'), RangeError);
  assert.throws(() => evaluate('5 % 0'), RangeError);
  assert.throws(() => evaluate('sqrt(-1)'), RangeError);
  assert.throws(() => evaluate('abs(1, 2)'), RangeError);
  assert.throws(() => evaluate('min()'), RangeError);
  assert.throws(() => evaluate('x', { x: '3' }), TypeError);
});

test('simplify: folds constants and identities', () => {
  assert.deepEqual(simplify(parse('x ^ (1 - 2)')), bin('^', v('x'), num(-1)));
  assert.deepEqual(simplify(parse('-(3 - 5)')), num(2));
  assert.deepEqual(simplify(parse('-(-x)')), v('x'));
  assert.deepEqual(simplify(parse('2 * x + 0')), bin('*', num(2), v('x')));
  assert.deepEqual(simplify(parse('1 * (y / 1) ^ 1 - 0')), v('y'));
  assert.deepEqual(simplify(parse('0 - x')), bin('-', num(0), v('x')));
  assert.deepEqual(simplify(parse('x * 0')), bin('*', v('x'), num(0)));
  assert.deepEqual(simplify(parse('f(1 + 2, y * 1)')), { type: 'call', name: 'f', args: [num(3), v('y')] });
  assert.deepEqual(simplify(parse('-7 % 3')), num(2));
});

test('simplify: does not fold division by zero nor a non-finite result', () => {
  assert.deepEqual(simplify(parse('1 / 0')), bin('/', num(1), num(0)));
  assert.deepEqual(simplify(parse('2 ^ 2000')), bin('^', num(2), num(2000)));
  assert.deepEqual(simplify(parse('4 % (1 - 1)')), bin('%', num(4), num(0)));
});

test('simplify does not change the input', () => {
  const ast = parse('-(-(1 + 2)) * x + 0');
  const copy = structuredClone(ast);
  simplify(ast);
  assert.deepEqual(ast, copy);
});

test('simplify + format: printing preserves the meaning', () => {
  assert.equal(format(simplify(parse('(1 - 3)^x'))), '(-2)^x');
  assert.equal(format(simplify(parse('a - (0 - 3)'))), 'a - -3');
  assert.equal(format(simplify(parse('(0 - 2) ^ (0 - 2)'))), '0.25');
  const env = { x: 3, a: 2, b: 5 };
  for (const s of ['(1 - 3)^x', 'a - (2 - 5)^b', '(0 - a)^(0 - 1)', 'b * (1 - 4)^2', '-(0 - 2)^x']) {
    const ast = parse(s);
    assert.equal(evaluate(parse(format(simplify(ast))), env), evaluate(ast, env), s);
  }
});
