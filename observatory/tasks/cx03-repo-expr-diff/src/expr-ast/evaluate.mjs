/**
 * Avaliação numérica da AST.
 */
import { fold } from './walk.mjs';
import { parse } from './parser.mjs';

function apply(op, a, b) {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/':
      if (b === 0) throw new RangeError('divisão por zero');
      return a / b;
    case '%':
      if (b === 0) throw new RangeError('resto por zero');
      return a % b;
    case '^': return a ** b;
    default: throw new TypeError(`operador desconhecido: ${op}`);
  }
}

/**
 * Avalia `ast` com as variáveis de `env`. Variável ausente ou não numérica →
 * ReferenceError. `/` ou `%` com divisor zero → RangeError.
 */
export function evaluate(ast, env = {}) {
  return fold(ast, {
    num: (n) => n.value,
    var: (n) => {
      const v = Object.hasOwn(env, n.name) ? env[n.name] : undefined;
      if (typeof v !== 'number') throw new ReferenceError(`variável indefinida: ${n.name}`);
      return v;
    },
    neg: (_, a) => -a,
    bin: (n, l, r) => apply(n.op, l, r),
  });
}

/** Atalho: `evaluate(parse(src), env)`. */
export function evaluateSource(src, env = {}) {
  return evaluate(parse(src), env);
}
