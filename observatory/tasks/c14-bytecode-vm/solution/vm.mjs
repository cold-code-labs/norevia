/**
 * Máquina virtual de pilha para o bytecode montado por asm.mjs.
 */
import { OPNAMES, BINARY, applyOp } from './asm.mjs';
import { build } from './compiler.mjs';

export class VmError extends Error {
  constructor(message) {
    super(message);
    this.name = 'VmError';
  }
}

export function run(program, { fns = {}, maxSteps = 100000 } = {}) {
  const { code, consts, names, locals } = program;
  const vars = new Array(locals.length).fill(0);
  const stack = [];
  const output = [];
  const pop = () => {
    if (!stack.length) throw new VmError('pilha vazia');
    return stack.pop();
  };
  let pc = 0;
  let steps = 0;
  for (;;) {
    if (pc < 0 || pc >= code.length) throw new VmError(`pc fora do código: ${pc}`);
    if (++steps > maxSteps) throw new VmError('limite de passos excedido');
    const at = pc;
    const name = OPNAMES[code[pc++]];
    if (name === undefined) throw new VmError(`opcode inválido ${code[at]} em ${at}`);
    if (BINARY.has(name)) {
      const b = pop();
      const a = pop();
      try {
        stack.push(applyOp(name, a, b));
      } catch (e) {
        if (e instanceof RangeError) throw new VmError(e.message);
        throw e;
      }
      continue;
    }
    switch (name) {
      case 'HALT':
        return { output, vars: Object.fromEntries(locals.map((n, i) => [n, vars[i]])) };
      case 'PUSH':
        stack.push(consts[code[pc++]]);
        break;
      case 'LOAD':
        stack.push(vars[code[pc++]]);
        break;
      case 'STORE':
        vars[code[pc++]] = pop();
        break;
      case 'POP':
        pop();
        break;
      case 'NEG':
        stack.push(applyOp('SUB', 0, pop()));
        break;
      case 'PRINT':
        output.push(pop());
        break;
      case 'JMP': {
        const off = code[pc++];
        pc += off;
        break;
      }
      case 'JZ': {
        const off = code[pc++];
        if (pop() === 0) pc += off;
        break;
      }
      case 'CALL': {
        const fname = names[code[pc++]];
        const argc = code[pc++];
        if (stack.length < argc) throw new VmError('pilha vazia');
        const args = stack.splice(stack.length - argc, argc);
        if (!Object.hasOwn(fns, fname) || typeof fns[fname] !== 'function') throw new VmError(`função desconhecida: ${fname}`);
        const r = fns[fname](...args);
        if (!Number.isInteger(r)) throw new VmError(`retorno inválido de ${fname}`);
        stack.push(r === 0 ? 0 : r);
        break;
      }
      default:
        throw new VmError(`opcode inválido ${code[at]} em ${at}`);
    }
  }
}

/** Compila e executa código-fonte. */
export function execute(src, { optimize = true, ...opts } = {}) {
  return run(build(src, { optimize }), opts);
}
