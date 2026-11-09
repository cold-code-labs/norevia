import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assemble, run, disassemble, AsmError, VMError, OP } from '../src/vm.mjs';

const N = (k, op = 'neg') => Array(k).fill('  ' + op).join('\n');
const hex = (u8) => Buffer.from(u8).toString('hex');
const out = (src, opts) => run(assemble(src), opts).output;
const vmErr = (code, pc) => (e) => e instanceof VMError && e.code === code && (pc === undefined || e.pc === pc);
const asmErr = (line) => (e) => e instanceof AsmError && e.line === line;

test('wraparound de 32 bits', () => {
  assert.deepEqual(out('push 2147483647\npush 1\nadd\nprint\npush -2147483648\npush 1\nsub\nprint'), [-2147483648, 2147483647]);
  assert.deepEqual(out('push 0x7fffffff\npush 0x7fffffff\nmul\nprint'), [1]);
  assert.deepEqual(out('push 123456789\npush 987654321\nmul\nprint'), [Math.imul(123456789, 987654321)]);
  assert.deepEqual(out('push 65536\npush 65536\nmul\nprint\npush -2147483648\nneg\nprint\npush 5\nneg\nprint'), [0, -2147483648, -5]);
});

test('div e mod', () => {
  assert.deepEqual(out('push -7\npush 2\ndiv\nprint\npush 7\npush -2\ndiv\nprint\npush 7\npush 2\ndiv\nprint'), [-3, -3, 3]);
  assert.deepEqual(out('push -7\npush 2\nmod\nprint\npush 7\npush -2\nmod\nprint\npush -8\npush 2\nmod\nprint'), [-1, 1, 0]);
  assert.deepEqual(out('push -2147483648\npush -1\ndiv\nprint\npush -2147483648\npush -1\nmod\nprint'), [-2147483648, 0]);
  assert.throws(() => out('push 1\npush 0\ndiv'), vmErr('DIV_ZERO', 4));
  assert.throws(() => out('push 1\npush 0\nmod'), vmErr('DIV_ZERO', 4));
});

test('operações de pilha e comparação', () => {
  const r = run(assemble('push 1\npush 2\nswap\nover\ndup\npop\npush 3\npush 3\neq\npush 2\npush 5\nlt\npush 2\npush 5\ngt\npush 0\nnot\npush 9\nnot'));
  assert.deepEqual(r.stack, [2, 1, 2, 1, 1, 0, 1, 0]);
  assert.deepEqual(r.output, []);
  assert.equal(r.steps, 19);
});

test('halt, fim do código e contagem de passos', () => {
  assert.deepEqual(run(assemble('push 1\nhalt\npush 2')), { output: [], stack: [1], steps: 2 });
  assert.deepEqual(run(new Uint8Array(0)), { output: [], stack: [], steps: 0 });
  assert.deepEqual(run(assemble('push 4\nprint')), { output: [4], stack: [], steps: 2 });
});

test('erros de execução', () => {
  assert.throws(() => run(assemble('push 1\nadd')), vmErr('STACK_UNDERFLOW', 2));
  assert.throws(() => run(new Uint8Array([0x01, 5, 0xff])), vmErr('BAD_OPCODE', 2));
  assert.throws(() => run(new Uint8Array([0x01, 5, 0x02, 1, 0, 0])), vmErr('BAD_OPCODE', 2));
  assert.throws(() => run(new Uint8Array([0x31, 16])), vmErr('BAD_LOCAL', 0));
  assert.throws(() => run(new Uint8Array([0x20, 0x05])), vmErr('BAD_JUMP', 0));
  assert.throws(() => run(new Uint8Array([0x20, 0xfd])), vmErr('BAD_JUMP', 0));
  assert.deepEqual(run(new Uint8Array([0x20, 0x00])).steps, 1);
  assert.throws(() => run(assemble('ret')), vmErr('RET_EMPTY', 0));
  assert.throws(() => run(assemble('x: jmp x'), { maxSteps: 50 }), vmErr('STEP_LIMIT', 0));
  assert.throws(() => run(assemble('x: push 1\njmp x')), vmErr('STACK_OVERFLOW', 0));
  assert.throws(() => run(assemble('push 1'), { maxSteps: -1 }), RangeError);
  assert.throws(() => run([1, 2]), TypeError);
  assert.deepEqual(run(assemble('push 1\npush 2'), { maxSteps: 2 }).stack, [1, 2]);
  assert.throws(() => run(assemble('push 1\npush 2\npush 3'), { maxSteps: 2 }), vmErr('STEP_LIMIT', 4));
});

test('jz e jnz desempilham a condição', () => {
  assert.deepEqual(run(assemble('push 7\npush 0\njz a\npush 1\na: push 0\njnz b\npush 2\nb: halt')).stack, [7, 2]);
});

test('call, ret e quadros de locais', () => {
  const src = `
    push 5
    store 0          ; local do topo
    push 10
    call f
    print
    load 0
    print
    halt
f:  store 0          ; argumento
    load 1           ; local novo vale 0
    print
    load 0
    load 0
    mul
    ret
`;
  assert.deepEqual(out(src), [0, 100, 5]);
});

test('recursão: fatorial com call', () => {
  const src = `
    push 10
    call fact
    print
    push 13
    call fact
    print
    halt
fact:
    store 0
    load 0
    push 2
    lt
    jz rec
    push 1
    ret
rec:
    load 0
    push 1
    sub
    call fact
    load 0
    mul
    ret
`;
  assert.deepEqual(out(src), [3628800, Math.imul(479001600, 13)]);
});

test('montagem: formas de push e bytes exatos', () => {
  assert.equal(hex(assemble('push 2\npush 300\nadd\ndup\njz fim\nprint\nfim: halt')), '0102022c010000100422014000');
  assert.equal(hex(assemble('push 127\npush 128\npush -128\npush -129')), '017f02800000000180027fffffff');
  assert.equal(hex(assemble('push 0x10\npush -0x80000000\nPUSH 0X7FFFFFFF')), '01100200000080' + '02ffffff7f');
  assert.equal(hex(assemble('load 15\nstore 0\nhalt')), '310f320000');
});

test('montagem: rótulos, comentários e maiúsculas', () => {
  const src = '; cabeçalho\n\n  a: b:   ; dois rótulos\n  JMP c ; para frente\nc: Jz a\n  CALL b\n';
  assert.equal(hex(assemble(src)), '2000' + '22fc' + '26fa');
  assert.equal(hex(assemble('x: jmp x')), '20fe');
  assert.equal(hex(assemble('jmp fim\nfim:')), '2000');
  assert.throws(() => assemble('A: jmp a'), asmErr(1));
});

test('montagem: erros com número de linha', () => {
  assert.throws(() => assemble('push 1\n  foo 2'), asmErr(2));
  assert.throws(() => assemble('push\n'), asmErr(1));
  assert.throws(() => assemble('nop: halt\npush 2147483648'), asmErr(2));
  assert.throws(() => assemble('push 1 2'), asmErr(1));
  assert.throws(() => assemble('push 1.5'), asmErr(1));
  assert.throws(() => assemble('load 16'), asmErr(1));
  assert.throws(() => assemble('add 1'), asmErr(1));
  assert.throws(() => assemble('x: halt\n\nx: halt'), asmErr(3));
  assert.throws(() => assemble('jmp a\njmp b\nb: halt'), asmErr(1));
  assert.throws(() => assemble('halt\njz 5'), asmErr(2));
  assert.throws(() => assemble(42), TypeError);
});

test('relaxação: limites para frente e para trás', () => {
  let c = assemble(`  jmp fim\n${N(127)}\nfim: halt`);
  assert.equal(c.length, 130);
  assert.equal(hex(c.subarray(0, 2)), '207f');
  c = assemble(`  jmp fim\n${N(128)}\nfim: halt`);
  assert.equal(c.length, 134);
  assert.equal(hex(c.subarray(0, 5)), '2180000000');
  c = assemble(`ini:\n${N(126)}\n  jmp ini`);
  assert.equal(c.length, 128);
  assert.equal(hex(c.subarray(126)), '2080');
  c = assemble(`ini:\n${N(127)}\n  jmp ini`);
  assert.equal(c.length, 132);
  assert.equal(hex(c.subarray(127)), '217cffffff');
});

test('relaxação em cascata', () => {
  let c = assemble(`ini:\n  jz fim\n${N(125)}\n  jmp ini\nfim: halt`);
  assert.equal(c.length, 136);
  assert.equal(hex(c.subarray(0, 5)), '2382000000');
  assert.deepEqual(disassemble(c).filter((l) => !l.endsWith('neg')), ['0000: jz @135', '0082: jmp @0', '0087: halt']);
  c = assemble(`ini:\n  jz meio\n  jz fim\n${N(123)}\nmeio:\n  jmp ini\nfim: halt`);
  assert.equal(c.length, 139);
  assert.deepEqual(disassemble(c).filter((l) => !l.endsWith('neg')), ['0000: jz @133', '0005: jz @138', '0085: jmp @0', '008a: halt']);
  c = assemble(`ini:\n  jz fim\n${N(124)}\n  jmp ini\nfim: halt`);
  assert.equal(c.length, 129);
  assert.deepEqual(disassemble(c).filter((l) => !l.endsWith('neg')), ['0000: jz @128', '007e: jmp @0', '0080: halt']);
});

test('laços relaxados executam corretamente', () => {
  const prog = (n) => {
    const body = Array.from({ length: n }, (_, k) => `  load 1\n  push ${1000 * (k + 1)}\n  add\n  store 1`).join('\n');
    return `  push 0\n  store 0\nloop:\n  load 0\n  push 3\n  lt\n  jz done\n${body}\n  load 0\n  push 1\n  add\n  store 0\n  jmp loop\ndone:\n  load 1\n  print\n`;
  };
  for (const n of [10, 11, 12, 13, 14]) {
    const expected = 3 * 1000 * (n * (n + 1)) / 2;
    assert.deepEqual(out(prog(n)), [expected], `n=${n}`);
  }
  const c = assemble(prog(12));
  assert.ok(disassemble(c).every((l) => !/@-/.test(l)));
  const withSmall = prog(11).replace('  load 0\n  push 1\n  add', '  load 1\n  push 7\n  add\n  store 1\n  load 0\n  push 1\n  add');
  assert.deepEqual(out(withSmall), [3 * (66000 + 7)]);
  assert.equal(assemble(withSmall).length, 146);
});

test('desmontagem: formatos e bytes inválidos', () => {
  assert.deepEqual(disassemble(assemble('push -5\nload 3\nstore 12\nret\nx: jnz x\ncall x')), ['0000: push -5', '0002: load 3', '0004: store 12', '0006: ret', '0007: jnz @7', '0009: call @7']);
  assert.deepEqual(disassemble(new Uint8Array([0xff, 0x01, 0x02, 0x02, 0x01])), ['0000: db 0xff', '0001: push 2', '0003: db 0x02', '0004: db 0x01']);
  assert.deepEqual(disassemble(new Uint8Array([0x21, 0x00, 0x01, 0x00, 0x00, 0x23, 0xfb, 0xff, 0xff, 0xff])), ['0000: jmp @261', '0005: jz @5']);
  assert.deepEqual(disassemble(new Uint8Array([0x20, 0x80])), ['0000: jmp @-126']);
  assert.throws(() => disassemble('00'), TypeError);
  assert.equal(OP.CALL32, 0x27);
});
