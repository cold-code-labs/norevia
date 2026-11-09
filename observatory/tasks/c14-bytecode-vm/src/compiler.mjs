/**
 * Compilador AST → instruções simbólicas, e o pipeline completo `build`.
 */
import { parse } from './parser.mjs';
import { optimize } from './optimize.mjs';
import { assemble } from './asm.mjs';

export class CompileError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CompileError';
  }
}

const BINOPS = {
  '+': 'ADD', '-': 'SUB', '*': 'MUL', '/': 'DIV', '%': 'MOD',
  '==': 'EQ', '!=': 'NE', '<': 'LT', '<=': 'LE', '>': 'GT', '>=': 'GE',
};

export function compile(ast) {
  if (!ast || ast.type !== 'program' || !Array.isArray(ast.body)) throw new TypeError('esperado nó program');
  const instrs = [];
  const locals = [];
  const slots = new Map();
  let nextLabel = 0;
  const newLabel = () => `L${nextLabel++}`;
  const emit = (op, arg, extra) => {
    const ins = { op };
    if (arg !== undefined) ins.arg = arg;
    if (extra) Object.assign(ins, extra);
    instrs.push(ins);
  };
  const slotOf = (name) => {
    if (!slots.has(name)) throw new CompileError(`variável não declarada: ${name}`);
    return slots.get(name);
  };

  function expr(node) {
    switch (node?.type) {
      case 'num':
        if (!Number.isInteger(node.value)) throw new CompileError(`literal inválido: ${node.value}`);
        emit('PUSH', node.value);
        return;
      case 'var':
        emit('LOAD', slotOf(node.name));
        return;
      case 'neg':
        expr(node.arg);
        emit('NEG');
        return;
      case 'bin': {
        const op = BINOPS[node.op];
        if (!op) throw new CompileError(`operador desconhecido: ${node.op}`);
        const operands = [node.left, node.right];
        while (operands.length) expr(operands.pop());
        emit(op);
        return;
      }
      case 'call':
        for (const a of node.args) expr(a);
        emit('CALL', node.name, { argc: node.args.length });
        return;
      default:
        throw new CompileError(`nó de expressão inválido: ${node?.type}`);
    }
  }

  function block(list) {
    for (const s of list) stmt(s);
  }

  function stmt(node) {
    switch (node?.type) {
      case 'let':
        if (slots.has(node.name)) throw new CompileError(`variável já declarada: ${node.name}`);
        expr(node.expr);
        slots.set(node.name, locals.length);
        locals.push(node.name);
        emit('STORE', slots.get(node.name));
        return;
      case 'assign':
        expr(node.expr);
        emit('STORE', slotOf(node.name));
        return;
      case 'print':
        expr(node.expr);
        emit('PRINT');
        return;
      case 'expr':
        expr(node.expr);
        emit('POP');
        return;
      case 'if': {
        expr(node.cond);
        if (node.else) {
          const lElse = newLabel();
          const lEnd = newLabel();
          emit('JZ', lElse);
          block(node.then);
          emit('JMP', lEnd);
          emit('LABEL', lElse);
          block(node.else);
          emit('LABEL', lEnd);
        } else {
          const lEnd = newLabel();
          emit('JZ', lEnd);
          block(node.then);
          emit('LABEL', lEnd);
        }
        return;
      }
      case 'while': {
        const lTop = newLabel();
        const lEnd = newLabel();
        emit('LABEL', lTop);
        expr(node.cond);
        emit('JZ', lEnd);
        block(node.body);
        emit('JMP', lTop);
        emit('LABEL', lEnd);
        return;
      }
      default:
        throw new CompileError(`nó de comando inválido: ${node?.type}`);
    }
  }

  block(ast.body);
  emit('HALT');
  return { instrs, locals };
}

/** Fonte (ou AST) → programa montado. */
export function build(src, { optimize: useOptimizer = true } = {}) {
  const ast = typeof src === 'string' ? parse(src) : src;
  const { instrs, locals } = compile(ast);
  return assemble({ instrs: useOptimizer ? optimize(instrs) : instrs, locals });
}
