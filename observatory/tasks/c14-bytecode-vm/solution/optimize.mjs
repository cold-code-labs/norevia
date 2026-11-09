/**
 * Otimizador peephole sobre instruções simbólicas (dobra e reassociação de constantes).
 */
import { BINARY, applyOp } from './asm.mjs';

const REASSOC = {
  'ADD,ADD': ['ADD', 'ADD'],
  'ADD,SUB': ['ADD', 'SUB'],
  'SUB,ADD': ['SUB', 'SUB'],
  'SUB,SUB': ['SUB', 'ADD'],
  'MUL,MUL': ['MUL', 'MUL'],
};

export function optimize(instrs) {
  if (!Array.isArray(instrs)) throw new TypeError('instrs deve ser array');
  const out = [];
  for (const ins of instrs) {
    const n = out.length;
    const last = out[n - 1];
    if (BINARY.has(ins.op) && n >= 2 && last.op === 'PUSH' && out[n - 2].op === 'PUSH') {
      const a = last.arg;
      const b = out[n - 2].arg;
      if (!((ins.op === 'DIV' || ins.op === 'MOD') && a === 0)) {
        out.splice(n - 2, 2, { op: 'PUSH', arg: applyOp(ins.op, b, a) });
        continue;
      }
    }
    if (n >= 3 && last.op === 'PUSH' && out[n - 3].op === 'PUSH' && Object.hasOwn(REASSOC, `${out[n - 2].op},${ins.op}`)) {
      const [op, combine] = REASSOC[`${out[n - 2].op},${ins.op}`];
      out.splice(n - 3, 3, { op: 'PUSH', arg: applyOp(combine, out[n - 3].arg, last.arg) }, { op });
      continue;
    }
    if (ins.op === 'NEG' && last?.op === 'PUSH') {
      out[n - 1] = { op: 'PUSH', arg: applyOp('SUB', 0, last.arg) };
      continue;
    }
    if (ins.op === 'JZ' && last?.op === 'PUSH') {
      if (last.arg === 0) out[n - 1] = { op: 'JMP', arg: ins.arg };
      else out.pop();
      continue;
    }
    out.push({ ...ins });
  }
  return out;
}
