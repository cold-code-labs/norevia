/**
 * Conjunto de instruções, montador, desmontador e análise de pilha.
 */

export class AsmError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AsmError';
  }
}

export const OPCODES = Object.freeze({
  HALT: 0, PUSH: 1, LOAD: 2, STORE: 3, POP: 4,
  ADD: 5, SUB: 6, MUL: 7, DIV: 8, MOD: 9, NEG: 10,
  EQ: 11, NE: 12, LT: 13, LE: 14, GT: 15, GE: 16,
  JMP: 17, JZ: 18, PRINT: 19, CALL: 20,
});

export const OPNAMES = Object.freeze(Object.fromEntries(Object.entries(OPCODES).map(([k, v]) => [v, k])));

export const BINARY = new Set(['ADD', 'SUB', 'MUL', 'DIV', 'MOD', 'EQ', 'NE', 'LT', 'LE', 'GT', 'GE']);

export function operandCount(name) {
  if (name === 'CALL') return 2;
  if (name === 'PUSH' || name === 'LOAD' || name === 'STORE' || name === 'JMP' || name === 'JZ') return 1;
  return 0;
}

/** Operação binária sobre inteiros: `left op right`. */
export function applyOp(name, left, right) {
  let r;
  switch (name) {
    case 'ADD': r = left + right; break;
    case 'SUB': r = left - right; break;
    case 'MUL': r = left * right; break;
    case 'DIV':
      if (right === 0) throw new RangeError('divisão por zero');
      r = Math.trunc(left / right);
      break;
    case 'MOD':
      if (right === 0) throw new RangeError('divisão por zero');
      r = left % right;
      break;
    case 'EQ': r = left === right ? 1 : 0; break;
    case 'NE': r = left !== right ? 1 : 0; break;
    case 'LT': r = left < right ? 1 : 0; break;
    case 'LE': r = left <= right ? 1 : 0; break;
    case 'GT': r = left > right ? 1 : 0; break;
    case 'GE': r = left >= right ? 1 : 0; break;
    default: throw new AsmError(`operação binária desconhecida: ${name}`);
  }
  return r === 0 ? 0 : r;
}

function intern(pool, value) {
  let i = pool.indexOf(value);
  if (i < 0) {
    i = pool.length;
    pool.push(value);
  }
  return i;
}

/** Monta instruções simbólicas em bytecode. */
export function assemble({ instrs, locals = [] }) {
  if (!Array.isArray(instrs)) throw new TypeError('instrs deve ser array');
  const code = [];
  const consts = [];
  const names = [];
  const labels = new Map();
  const fixups = [];
  for (const ins of instrs) {
    if (ins.op === 'LABEL') {
      if (labels.has(ins.arg)) throw new AsmError(`rótulo duplicado: ${ins.arg}`);
      labels.set(ins.arg, code.length);
      continue;
    }
    if (!Object.hasOwn(OPCODES, ins.op)) throw new AsmError(`instrução desconhecida: ${ins.op}`);
    const addr = code.length;
    code.push(OPCODES[ins.op]);
    switch (ins.op) {
      case 'PUSH':
        if (!Number.isInteger(ins.arg)) throw new AsmError(`constante inválida: ${ins.arg}`);
        code.push(intern(consts, ins.arg));
        break;
      case 'LOAD':
      case 'STORE':
        if (!Number.isInteger(ins.arg) || ins.arg < 0 || ins.arg >= locals.length) throw new AsmError(`slot inválido: ${ins.arg}`);
        code.push(ins.arg);
        break;
      case 'JMP':
      case 'JZ':
        code.push(0);
        fixups.push({ at: addr + 1, from: addr + 2, label: ins.arg });
        break;
      case 'CALL':
        if (typeof ins.arg !== 'string' || !Number.isInteger(ins.argc) || ins.argc < 0) throw new AsmError('CALL inválido');
        code.push(intern(names, ins.arg), ins.argc);
        break;
      default:
        break;
    }
  }
  for (const f of fixups) {
    if (!labels.has(f.label)) throw new AsmError(`rótulo indefinido: ${f.label}`);
    code[f.at] = labels.get(f.label) - f.from;
  }
  const program = { code, consts, names, locals: [...locals], maxStack: 0 };
  program.maxStack = maxStack(program);
  return program;
}

/** Decodifica o bytecode em instruções `{ addr, name, operands, size }`. */
export function decode(code) {
  const out = [];
  let pc = 0;
  while (pc < code.length) {
    const name = OPNAMES[code[pc]];
    if (name === undefined) throw new AsmError(`opcode inválido ${code[pc]} em ${pc}`);
    const n = operandCount(name);
    if (pc + n > code.length - 1) throw new AsmError(`operandos truncados em ${pc}`);
    out.push({ addr: pc, name, operands: code.slice(pc + 1, pc + 1 + n), size: 1 + n });
    pc += 1 + n;
  }
  return out;
}

function effect(ins) {
  if (BINARY.has(ins.name)) return [2, 1];
  switch (ins.name) {
    case 'PUSH': case 'LOAD': return [0, 1];
    case 'STORE': case 'POP': case 'PRINT': case 'JZ': return [1, 0];
    case 'NEG': return [1, 1];
    case 'CALL': return [ins.operands[1], 1];
    default: return [0, 0];
  }
}

/** Endereço de destino de um JMP/JZ decodificado. */
export function jumpTarget(ins) {
  return ins.addr + ins.size + ins.operands[0];
}

/** Profundidade máxima da pilha em qualquer caminho de execução a partir do endereço 0. */
export function maxStack(program) {
  const list = decode(program.code);
  if (!list.length) return 0;
  const byAddr = new Map(list.map((i) => [i.addr, i]));
  const depthAt = new Map([[0, 0]]);
  const work = [0];
  let max = 0;
  while (work.length) {
    const addr = work.pop();
    const ins = byAddr.get(addr);
    if (!ins) throw new AsmError(`fluxo chega a um endereço que não inicia instrução: ${addr}`);
    const before = depthAt.get(addr);
    const [pops, pushes] = effect(ins);
    if (before < pops) throw new AsmError(`pilha insuficiente em ${addr}`);
    const after = before - pops + pushes;
    if (after > max) max = after;
    const next = addr + ins.size;
    const succ = [];
    if (ins.name === 'JMP') succ.push(jumpTarget(ins));
    else if (ins.name === 'JZ') succ.push(next, jumpTarget(ins));
    else if (ins.name !== 'HALT') succ.push(next);
    for (const s of succ) {
      if (!depthAt.has(s)) {
        depthAt.set(s, after);
        work.push(s);
      } else if (depthAt.get(s) !== after) {
        throw new AsmError(`profundidade inconsistente em ${s}`);
      }
    }
  }
  return max;
}

const pad = (n) => String(n).padStart(4, '0');

/** Texto legível: uma linha por instrução. */
export function disassemble(program) {
  return decode(program.code).map((ins) => {
    let text = ins.name;
    switch (ins.name) {
      case 'PUSH': text += ` ${program.consts[ins.operands[0]]}`; break;
      case 'LOAD':
      case 'STORE': text += ` ${program.locals[ins.operands[0]]}`; break;
      case 'JMP':
      case 'JZ': text += ` ${pad(jumpTarget(ins))}`; break;
      case 'CALL': text += ` ${program.names[ins.operands[0]]}/${ins.operands[1]}`; break;
      default: break;
    }
    return `${pad(ins.addr)}  ${text}`;
  }).join('\n');
}
