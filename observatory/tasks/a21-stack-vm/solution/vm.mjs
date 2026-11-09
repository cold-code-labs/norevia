/**
 * Máquina de pilha de inteiros de 32 bits: montador, desmontador e interpretador.
 *
 * Formato do bytecode: cada instrução é um byte de opcode seguido de 0, 1 ou 4 bytes de
 * operando (inteiros com sinal em little-endian). Saltos são relativos ao endereço da
 * instrução seguinte.
 */

export const OP = Object.freeze({
  HALT: 0x00,
  PUSH8: 0x01,
  PUSH32: 0x02,
  POP: 0x03,
  DUP: 0x04,
  SWAP: 0x05,
  OVER: 0x06,
  ADD: 0x10,
  SUB: 0x11,
  MUL: 0x12,
  DIV: 0x13,
  MOD: 0x14,
  NEG: 0x15,
  EQ: 0x18,
  LT: 0x19,
  GT: 0x1a,
  NOT: 0x1b,
  JMP8: 0x20,
  JMP32: 0x21,
  JZ8: 0x22,
  JZ32: 0x23,
  JNZ8: 0x24,
  JNZ32: 0x25,
  CALL8: 0x26,
  CALL32: 0x27,
  RET: 0x30,
  LOAD: 0x31,
  STORE: 0x32,
  PRINT: 0x40,
});

export const LOCALS = 16;
export const STACK_MAX = 1024;

export class AsmError extends Error {
  constructor(message, line) {
    super(`linha ${line}: ${message}`);
    this.name = 'AsmError';
    this.line = line;
  }
}

export class VMError extends Error {
  constructor(code, pc, message) {
    super(`${code} @${pc}: ${message}`);
    this.name = 'VMError';
    this.code = code;
    this.pc = pc;
  }
}

const SIMPLE = {
  halt: OP.HALT, pop: OP.POP, dup: OP.DUP, swap: OP.SWAP, over: OP.OVER,
  add: OP.ADD, sub: OP.SUB, mul: OP.MUL, div: OP.DIV, mod: OP.MOD, neg: OP.NEG,
  eq: OP.EQ, lt: OP.LT, gt: OP.GT, not: OP.NOT, ret: OP.RET, print: OP.PRINT,
};
const JUMPS = {
  jmp: [OP.JMP8, OP.JMP32],
  jz: [OP.JZ8, OP.JZ32],
  jnz: [OP.JNZ8, OP.JNZ32],
  call: [OP.CALL8, OP.CALL32],
};
const LOCAL_OPS = { load: OP.LOAD, store: OP.STORE };

/** Tabela de decodificação: opcode -> { name, kind } (kind define o operando). */
const INFO = new Map();
for (const [name, op] of Object.entries(SIMPLE)) INFO.set(op, { name, kind: 'none' });
INFO.set(OP.PUSH8, { name: 'push', kind: 'i8' });
INFO.set(OP.PUSH32, { name: 'push', kind: 'i32' });
for (const [name, [short, long]] of Object.entries(JUMPS)) {
  INFO.set(short, { name, kind: 'rel8' });
  INFO.set(long, { name, kind: 'rel32' });
}
for (const [name, op] of Object.entries(LOCAL_OPS)) INFO.set(op, { name, kind: 'u8' });

const OPERAND_SIZE = { none: 0, i8: 1, u8: 1, rel8: 1, i32: 4, rel32: 4 };

const fits8 = (v) => v >= -128 && v <= 127;

function parseInt32(tok) {
  const m = /^(-)?(?:0x([0-9a-f]+)|(\d+))$/i.exec(tok);
  if (!m) return null;
  const mag = m[2] !== undefined ? parseInt(m[2], 16) : Number(m[3]);
  const v = m[1] ? -mag : mag;
  if (v < -2147483648 || v > 2147483647) return null;
  return v === 0 ? 0 : v;
}

/** Lê o texto-fonte e devolve a lista de itens e o índice (no array de itens) de cada rótulo. */
function parseSource(source) {
  if (typeof source !== 'string') throw new TypeError('assemble espera uma string');
  const items = [];
  const labelIndex = new Map();
  const lines = source.split('\n');
  for (let ln = 0; ln < lines.length; ln++) {
    const line = ln + 1;
    let text = lines[ln];
    const semi = text.indexOf(';');
    if (semi >= 0) text = text.slice(0, semi);
    text = text.trim();
    let m;
    while ((m = /^([A-Za-z_][A-Za-z0-9_]*)\s*:/.exec(text))) {
      if (labelIndex.has(m[1])) throw new AsmError(`rótulo duplicado: ${m[1]}`, line);
      labelIndex.set(m[1], items.length);
      text = text.slice(m[0].length).trim();
    }
    if (!text) continue;
    const parts = text.split(/\s+/);
    const mn = parts[0].toLowerCase();
    const args = parts.slice(1);
    if (mn in SIMPLE) {
      if (args.length) throw new AsmError(`${mn} não aceita operando`, line);
      items.push({ kind: 'simple', op: SIMPLE[mn], line });
    } else if (mn === 'push') {
      const v = args.length === 1 ? parseInt32(args[0]) : null;
      if (v === null) throw new AsmError('push exige um inteiro de 32 bits', line);
      items.push({ kind: 'push', value: v, line });
    } else if (mn in LOCAL_OPS) {
      const v = args.length === 1 && /^\d+$/.test(args[0]) ? Number(args[0]) : -1;
      if (v < 0 || v >= LOCALS) throw new AsmError(`${mn} exige índice 0..${LOCALS - 1}`, line);
      items.push({ kind: 'local', op: LOCAL_OPS[mn], index: v, line });
    } else if (mn in JUMPS) {
      if (args.length !== 1 || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(args[0])) throw new AsmError(`${mn} exige um rótulo`, line);
      items.push({ kind: 'jump', ops: JUMPS[mn], label: args[0], line });
    } else {
      throw new AsmError(`instrução desconhecida: ${parts[0]}`, line);
    }
  }
  return { items, labelIndex };
}

function sizeOf(item, isLong) {
  switch (item.kind) {
    case 'simple': return 1;
    case 'local': return 2;
    case 'push': return fits8(item.value) ? 2 : 5;
    default: return isLong ? 5 : 2;
  }
}

/** Endereço de início de cada item; a posição extra no fim é o tamanho total. */
function layout(items, long) {
  const addrs = new Array(items.length + 1);
  let a = 0;
  for (let i = 0; i < items.length; i++) {
    addrs[i] = a;
    a += sizeOf(items[i], long[i]);
  }
  addrs[items.length] = a;
  return addrs;
}

/** Monta o texto-fonte em bytecode (Uint8Array). */
export function assemble(source) {
  const { items, labelIndex } = parseSource(source);
  for (const it of items) {
    if (it.kind === 'jump' && !labelIndex.has(it.label)) throw new AsmError(`rótulo indefinido: ${it.label}`, it.line);
  }
  const long = items.map(() => false);
  let addrs = layout(items, long);
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind !== 'jump' || long[i]) continue;
      const offset = addrs[labelIndex.get(it.label)] - addrs[i + 1];
      if (!fits8(offset)) {
        long[i] = true;
        changed = true;
      }
    }
    addrs = layout(items, long);
  }

  const code = new Uint8Array(addrs[items.length]);
  const view = new DataView(code.buffer);
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const at = addrs[i];
    switch (it.kind) {
      case 'simple':
        code[at] = it.op;
        break;
      case 'local':
        code[at] = it.op;
        code[at + 1] = it.index;
        break;
      case 'push':
        if (fits8(it.value)) {
          code[at] = OP.PUSH8;
          view.setInt8(at + 1, it.value);
        } else {
          code[at] = OP.PUSH32;
          view.setInt32(at + 1, it.value, true);
        }
        break;
      default: {
        const offset = addrs[labelIndex.get(it.label)] - addrs[i + 1];
        if (long[i]) {
          code[at] = it.ops[1];
          view.setInt32(at + 1, offset, true);
        } else {
          code[at] = it.ops[0];
          view.setInt8(at + 1, offset);
        }
      }
    }
  }
  return code;
}

/** Decodifica a instrução em `pc`; `null` se o opcode é desconhecido ou o operando está incompleto. */
function decode(code, pc) {
  const info = INFO.get(code[pc]);
  if (!info) return null;
  const size = 1 + OPERAND_SIZE[info.kind];
  if (pc + size > code.length) return null;
  const view = new DataView(code.buffer, code.byteOffset, code.byteLength);
  const next = pc + size;
  const ins = { op: code[pc], name: info.name, kind: info.kind, next };
  if (info.kind === 'i8') ins.value = view.getInt8(pc + 1);
  else if (info.kind === 'i32') ins.value = view.getInt32(pc + 1, true);
  else if (info.kind === 'u8') ins.index = code[pc + 1];
  else if (info.kind === 'rel8') ins.target = next + view.getInt8(pc + 1);
  else if (info.kind === 'rel32') ins.target = next + view.getInt32(pc + 1, true);
  return ins;
}

const hex = (n, w) => n.toString(16).padStart(w, '0');

/** Uma linha de texto por instrução: 'aaaa: mnemônico [operando]'. */
export function disassemble(code) {
  if (!(code instanceof Uint8Array)) throw new TypeError('disassemble espera Uint8Array');
  const out = [];
  let pc = 0;
  while (pc < code.length) {
    const ins = decode(code, pc);
    if (!ins) {
      out.push(`${hex(pc, 4)}: db 0x${hex(code[pc], 2)}`);
      pc++;
      continue;
    }
    let text = ins.name;
    if (ins.kind === 'i8' || ins.kind === 'i32') text += ` ${ins.value}`;
    else if (ins.kind === 'u8') text += ` ${ins.index}`;
    else if (ins.kind === 'rel8' || ins.kind === 'rel32') text += ` @${ins.target}`;
    out.push(`${hex(pc, 4)}: ${text}`);
    pc = ins.next;
  }
  return out;
}

/** Executa o bytecode e devolve `{ output, stack, steps }`. */
export function run(code, { maxSteps = 100000 } = {}) {
  if (!(code instanceof Uint8Array)) throw new TypeError('run espera Uint8Array');
  if (!Number.isInteger(maxSteps) || maxSteps < 0) throw new RangeError('maxSteps inválido');
  const stack = [];
  const output = [];
  const frames = [{ ret: -1, locals: new Array(LOCALS).fill(0) }];
  let pc = 0;
  let steps = 0;
  let here = 0;
  const pop = () => {
    if (!stack.length) throw new VMError('STACK_UNDERFLOW', here, 'pilha vazia');
    return stack.pop();
  };
  const push = (v) => {
    if (stack.length >= STACK_MAX) throw new VMError('STACK_OVERFLOW', here, 'pilha cheia');
    stack.push(v);
  };
  const jumpTo = (target) => {
    if (target < 0 || target > code.length) throw new VMError('BAD_JUMP', here, `destino ${target}`);
    pc = target;
  };

  while (pc !== code.length) {
    if (steps >= maxSteps) throw new VMError('STEP_LIMIT', pc, `limite de ${maxSteps} passos`);
    here = pc;
    const ins = decode(code, pc);
    if (!ins) throw new VMError('BAD_OPCODE', pc, `opcode 0x${hex(code[pc], 2)}`);
    steps++;
    pc = ins.next;
    switch (ins.op) {
      case OP.HALT:
        return { output, stack, steps };
      case OP.PUSH8:
      case OP.PUSH32:
        push(ins.value);
        break;
      case OP.POP:
        pop();
        break;
      case OP.DUP: {
        const a = pop();
        push(a);
        push(a);
        break;
      }
      case OP.SWAP: {
        const b = pop();
        const a = pop();
        push(b);
        push(a);
        break;
      }
      case OP.OVER: {
        const b = pop();
        const a = pop();
        push(a);
        push(b);
        push(a);
        break;
      }
      case OP.ADD: case OP.SUB: case OP.MUL: case OP.DIV: case OP.MOD:
      case OP.EQ: case OP.LT: case OP.GT: {
        const b = pop();
        const a = pop();
        push(binary(ins.op, a, b, here));
        break;
      }
      case OP.NEG:
        push(-pop() | 0);
        break;
      case OP.NOT:
        push(pop() === 0 ? 1 : 0);
        break;
      case OP.JMP8: case OP.JMP32:
        jumpTo(ins.target);
        break;
      case OP.JZ8: case OP.JZ32:
        if (pop() === 0) jumpTo(ins.target);
        break;
      case OP.JNZ8: case OP.JNZ32:
        if (pop() !== 0) jumpTo(ins.target);
        break;
      case OP.CALL8: case OP.CALL32: {
        const ret = pc;
        jumpTo(ins.target);
        frames.push({ ret, locals: new Array(LOCALS).fill(0) });
        break;
      }
      case OP.RET: {
        if (frames.length === 1) throw new VMError('RET_EMPTY', here, 'ret sem chamada');
        pc = frames.pop().ret;
        break;
      }
      case OP.LOAD: case OP.STORE: {
        if (ins.index >= LOCALS) throw new VMError('BAD_LOCAL', here, `local ${ins.index}`);
        const locals = frames[frames.length - 1].locals;
        if (ins.op === OP.LOAD) push(locals[ins.index]);
        else locals[ins.index] = pop();
        break;
      }
      case OP.PRINT:
        output.push(pop());
        break;
    }
  }
  return { output, stack, steps };
}

function binary(op, a, b, at) {
  switch (op) {
    case OP.ADD: return (a + b) | 0;
    case OP.SUB: return (a - b) | 0;
    case OP.MUL: return Math.imul(a, b);
    case OP.DIV:
      if (b === 0) throw new VMError('DIV_ZERO', at, 'divisão por zero');
      return Math.trunc(a / b) | 0;
    case OP.MOD:
      if (b === 0) throw new VMError('DIV_ZERO', at, 'divisão por zero');
      return (a % b) | 0;
    case OP.EQ: return a === b ? 1 : 0;
    case OP.LT: return a < b ? 1 : 0;
    default: return a > b ? 1 : 0;
  }
}
