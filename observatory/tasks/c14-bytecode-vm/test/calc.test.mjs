import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/parser.mjs';
import { compile, build, CompileError } from '../src/compiler.mjs';
import { optimize } from '../src/optimize.mjs';
import { assemble, disassemble, decode, jumpTarget, maxStack, applyOp, AsmError } from '../src/asm.mjs';
import { run, execute, VmError } from '../src/vm.mjs';

const num = (value) => ({ type: 'num', value });
const v = (name) => ({ type: 'var', name });
const bin = (op, left, right) => ({ type: 'bin', op, left, right });
const P = (op, arg) => (arg === undefined ? { op } : { op, arg });
const prog = (code, consts = [], names = [], locals = []) => ({ code, consts, names, locals, maxStack: 0 });

test('parse: ASTs douradas', () => {
  assert.deepEqual(parse('print 8 - 2 - 1;'), { type: 'program', body: [{ type: 'print', expr: bin('-', bin('-', num(8), num(2)), num(1)) }] });
  assert.deepEqual(parse('x = f(a, 2) < -b;').body[0], { type: 'assign', name: 'x', expr: bin('<', { type: 'call', name: 'f', args: [v('a'), num(2)] }, { type: 'neg', arg: v('b') }) });
  for (const s of ['print 1 < 2 < 3;', 'let = 2;', 'print (1;', 'print 1 $ 2;', 'if (1) print 2;']) assert.throws(() => parse(s), SyntaxError, s);
});

test('compile: ordem dos operandos, chamadas e slots', () => {
  const r = compile(parse('let a = 4; print f(a, 2) - a / 3;'));
  assert.deepEqual(r.locals, ['a']);
  assert.deepEqual(r.instrs, [P('PUSH', 4), P('STORE', 0), P('LOAD', 0), P('PUSH', 2), { op: 'CALL', arg: 'f', argc: 2 }, P('LOAD', 0), P('PUSH', 3), P('DIV'), P('SUB'), P('PRINT'), P('HALT')]);
  const r2 = compile(parse('let b = 1; let c = b; c = c - (b - -c);'));
  assert.deepEqual(r2.locals, ['b', 'c']);
  assert.deepEqual(r2.instrs, [P('PUSH', 1), P('STORE', 0), P('LOAD', 0), P('STORE', 1), P('LOAD', 1), P('LOAD', 0), P('LOAD', 1), P('NEG'), P('SUB'), P('SUB'), P('STORE', 1), P('HALT')]);
});

test('optimize: dobra de constantes com a ordem certa', () => {
  assert.deepEqual(optimize([P('PUSH', 7), P('PUSH', 2), P('SUB')]), [P('PUSH', 5)]);
  assert.deepEqual(optimize([P('PUSH', 7), P('PUSH', 0), P('DIV')]), [P('PUSH', 7), P('PUSH', 0), P('DIV')]);
  assert.deepEqual(optimize([P('PUSH', 0), P('PUSH', 7), P('DIV')]), [P('PUSH', 0)]);
  assert.deepEqual(optimize([P('PUSH', 3), P('NEG')]), [P('PUSH', -3)]);
  assert.deepEqual(optimize([P('PUSH', 20), P('PUSH', 8), P('PUSH', 2), P('SUB'), P('PUSH', 3), P('MUL'), P('PUSH', 2), P('DIV'), P('SUB')]), [P('PUSH', 11)]);
  assert.deepEqual(optimize([P('LOAD', 0), P('PUSH', 2), P('PUSH', 3), P('SUB'), P('SUB')]), [P('LOAD', 0), P('PUSH', -1), P('SUB')]);
  assert.deepEqual(optimize([P('PUSH', 2), P('PUSH', 9), P('LT'), P('PUSH', 9), P('PUSH', 2), P('MOD')]), [P('PUSH', 1), P('PUSH', 1)]);
  assert.deepEqual(optimize([P('PUSH', 0), P('JZ', 'L'), P('PUSH', 5), P('JZ', 'M'), P('HALT')]), [P('JMP', 'L'), P('HALT')]);
  assert.deepEqual(optimize([P('PUSH', 1), P('LABEL', 'K'), P('PUSH', 2), P('SUB')]), [P('PUSH', 1), P('LABEL', 'K'), P('PUSH', 2), P('SUB')]);
});

test('optimize: reassociação de constantes', () => {
  const x = P('LOAD', 0);
  assert.deepEqual(optimize([x, P('PUSH', 5), P('ADD'), P('PUSH', 7), P('SUB')]), [x, P('PUSH', -2), P('ADD')]);
  assert.deepEqual(optimize([x, P('PUSH', 1), P('SUB'), P('PUSH', 2), P('SUB')]), [x, P('PUSH', 3), P('SUB')]);
  assert.deepEqual(optimize([x, P('PUSH', 3), P('SUB'), P('PUSH', 8), P('ADD')]), [x, P('PUSH', -5), P('SUB')]);
  assert.deepEqual(optimize([x, P('PUSH', 4), P('ADD'), P('PUSH', 6), P('ADD'), P('PUSH', 1), P('SUB')]), [x, P('PUSH', 9), P('ADD')]);
  assert.deepEqual(optimize([x, P('PUSH', 2), P('MUL'), P('PUSH', 3), P('MUL'), P('PUSH', 4), P('ADD')]), [x, P('PUSH', 6), P('MUL'), P('PUSH', 4), P('ADD')]);
  assert.deepEqual(optimize([x, P('PUSH', 2), P('MUL'), P('PUSH', 3), P('SUB')]), [x, P('PUSH', 2), P('MUL'), P('PUSH', 3), P('SUB')]);
  assert.deepEqual(optimize([x, P('PUSH', 2), P('SUB'), P('LABEL', 'A'), P('PUSH', 3), P('SUB')]), [x, P('PUSH', 2), P('SUB'), P('LABEL', 'A'), P('PUSH', 3), P('SUB')]);
  const src = 'let x = 10; print x - 1 - 2; print x - 3 + 8; print x + 5 - 7; print x * 2 * 3 - 4 - 5; print 2 - x - 1; print x - (1 - 2) - 3;';
  assert.deepEqual(execute(src).output, [7, 15, 8, 51, -9, 8]);
  assert.deepEqual(execute(src, { optimize: false }).output, [7, 15, 8, 51, -9, 8]);
  assert.equal(disassemble(build('let x = 10; print x - 1 - 2 - 3;')).split('\n').slice(2).join('|'), '0004  LOAD x|0006  PUSH 6|0008  SUB|0009  PRINT|0010  HALT');
});

test('assemble: pools e deslocamentos relativos à instrução seguinte', () => {
  assert.deepEqual(assemble({ instrs: [P('JMP', 'A'), P('LABEL', 'A'), P('HALT')] }).code, [17, 0, 0]);
  assert.deepEqual(assemble({ instrs: [P('LABEL', 'T'), P('PUSH', 1), P('JZ', 'T'), P('HALT')] }).code, [1, 0, 18, -4, 0]);
  const p = assemble({ instrs: [P('PUSH', 5), P('JZ', 'E'), { op: 'CALL', arg: 'g', argc: 0 }, P('PUSH', 5), { op: 'CALL', arg: 'h', argc: 2 }, { op: 'CALL', arg: 'g', argc: 0 }, P('POP'), P('PRINT'), P('LABEL', 'E'), P('HALT')] });
  assert.deepEqual(p.code, [1, 0, 18, 13, 20, 0, 0, 1, 0, 20, 1, 2, 20, 0, 0, 4, 19, 0]);
  assert.deepEqual(p.consts, [5]);
  assert.deepEqual(p.names, ['g', 'h']);
  const w = build('let n = 10; let s = 0; while (n > 0) { s = s + n; n = n - 1; } print s;');
  assert.deepEqual(w.code, [1, 0, 3, 0, 1, 1, 3, 1, 2, 0, 1, 1, 15, 18, 16, 2, 1, 2, 0, 5, 3, 1, 2, 0, 1, 2, 6, 3, 0, 17, -23, 2, 1, 19, 0]);
  assert.deepEqual(w.consts, [10, 0, 1]);
  const jz = decode(w.code).find((i) => i.name === 'JZ');
  assert.equal(jumpTarget(jz), 31);
});

test('disassemble: programa com if/else dentro de while', () => {
  const p = build('let i = 0; while (i < 3) { if (i == 1) { print i; } else { print 0 - i; } i = i + 1; }');
  assert.equal(disassemble(p), [
    '0000  PUSH 0', '0002  STORE i', '0004  LOAD i', '0006  PUSH 3', '0008  LT', '0009  JZ 0038',
    '0011  LOAD i', '0013  PUSH 1', '0015  EQ', '0016  JZ 0023', '0018  LOAD i', '0020  PRINT', '0021  JMP 0029',
    '0023  PUSH 0', '0025  LOAD i', '0027  SUB', '0028  PRINT', '0029  LOAD i', '0031  PUSH 1', '0033  ADD',
    '0034  STORE i', '0036  JMP 0004', '0038  HALT',
  ].join('\n'));
  assert.deepEqual(run(p).output, [0, 1, -2]);
  assert.equal(disassemble(prog([20, 1, 2, 18, -5, 0], [], ['f', 'max'])), '0000  CALL max/2\n0003  JZ 0000\n0005  HALT');
});

test('maxStack: valores dourados, inclusive com chamadas', () => {
  assert.equal(build('let x = 7; print x - 2;').maxStack, 2);
  assert.equal(build('print f(1, 2, 3);').maxStack, 3);
  assert.equal(build('print g() + 1;').maxStack, 2);
  assert.equal(build('let a = 1; print 2 * (a - f(a, 3 - a)) - -a;').maxStack, 5);
  assert.equal(build('f(1); print 0;').maxStack, 1);
  assert.equal(maxStack(prog([1, 0, 1, 0, 18, 2, 4, 0, 0], [1])), 2);
  assert.throws(() => maxStack(prog([6, 0])), AsmError);
  assert.throws(() => maxStack(prog([1, 0, 18, -3, 0], [1])), AsmError);
});

test('run: bytecode à mão — operandos e saltos', () => {
  const ops = (code) => run(prog([1, 0, 1, 1, code, 19, 0], [7, 2])).output[0];
  assert.deepEqual([6, 8, 9, 13, 15, 14].map(ops), [5, 3, 1, 0, 1, 0]);
  assert.deepEqual(run(prog([1, 0, 1, 1, 1, 2, 6, 6, 19, 0], [10, 4, 1])).output, [7]);
  // salto para frente: pula o PRINT de 1
  assert.deepEqual(run(prog([17, 3, 1, 0, 19, 1, 1, 19, 0], [1, 2])).output, [2]);
  // laço: x = 3; while (x) { print x; x = x - 1 }
  const loop = [1, 0, 3, 0, 2, 0, 18, 12, 2, 0, 19, 2, 0, 1, 1, 6, 3, 0, 17, -16, 0];
  assert.deepEqual(run(prog(loop, [3, 1], [], ['x'])).output, [3, 2, 1]);
  assert.deepEqual(run(prog(loop, [3, 1], [], ['x'])).vars, { x: 0 });
});

test('execute: ordem de avaliação de chamadas e argumentos', () => {
  const log = [];
  const f = (x) => { log.push(x); return x; };
  const sub = (a, b) => a - b;
  assert.deepEqual(execute('print f(1) - f(2) * f(3);', { fns: { f } }).output, [-5]);
  assert.deepEqual(log, [1, 2, 3]);
  log.length = 0;
  assert.deepEqual(execute('print sub(f(10), f(4)) - sub(f(1), f(2));', { fns: { f, sub } }).output, [7]);
  assert.deepEqual(log, [10, 4, 1, 2]);
  log.length = 0;
  assert.deepEqual(execute('let i = 0; while (f(i) < 2) { i = i + 1; } print i;', { fns: { f } }).output, [2]);
  assert.deepEqual(log, [0, 1, 2]);
});

test('execute: programas completos com e sem otimização', () => {
  const cases = [
    ['let a = 1071; let b = 462; while (b != 0) { let t = b; b = a % b; a = t; } print a;', [21]],
    ['let n = 27; let k = 0; while (n != 1) { if (n % 2 == 0) { n = n / 2; } else { n = 3 * n + 1; } k = k + 1; } print k;', [111]],
    ['let x = 5; print x - (x - (x - (x - 1))); print 100 / (x - 1) / 5; print -7 / 2; print -7 % 2; print 2 - 3 - -4;', [1, 5, -3, -1, 3]],
    ['let a = 0; let b = 1; let i = 0; while (i < 10) { let t = a; a = b; b = t + b; i = i + 1; } print a; print 3 >= 3; print 2 > 3;', [55, 1, 0]],
  ];
  for (const [src, out] of cases) for (const optimize of [true, false]) assert.deepEqual(execute(src, { optimize }).output, out, src);
  assert.deepEqual(execute('print sq(3) - sq(2);', { fns: { sq: (x) => x * x } }).output, [5]);
});

test('compile/run: AST construída à mão', () => {
  const ast = { type: 'program', body: [{ type: 'print', expr: bin('-', num(9), bin('/', num(8), num(2))) }, { type: 'print', expr: bin('<', num(3), num(1)) }] };
  assert.deepEqual(run(build(ast, { optimize: false })).output, [5, 0]);
  assert.deepEqual(run(build(ast)).output, [5, 0]);
  assert.deepEqual(applyOp('SUB', 7, 2), 5);
  assert.ok(Object.is(applyOp('MOD', -4, 2), 0));
});

test('erros', () => {
  assert.throws(() => compile(parse('print y;')), CompileError);
  assert.throws(() => compile(parse('let x = 1; let x = 2;')), CompileError);
  assert.throws(() => compile(parse('let x = x;')), CompileError);
  assert.throws(() => compile({ type: 'print' }), TypeError);
  assert.throws(() => assemble({ instrs: [P('JMP', 'nada'), P('HALT')] }), AsmError);
  assert.throws(() => assemble({ instrs: [P('LABEL', 'a'), P('LABEL', 'a'), P('HALT')] }), AsmError);
  assert.throws(() => assemble({ instrs: [P('LOAD', 0), P('HALT')], locals: [] }), AsmError);
  assert.throws(() => execute('let z = 0; print 1 / z;'), VmError);
  assert.throws(() => execute('print 1 % 0;'), VmError);
  assert.throws(() => execute('while (1) { }'), VmError);
  assert.throws(() => execute('print nada(1);'), VmError);
  assert.throws(() => execute('print h(1);', { fns: { h: () => 0.5 } }), VmError);
  assert.throws(() => run(prog([6, 0])), VmError);
});
