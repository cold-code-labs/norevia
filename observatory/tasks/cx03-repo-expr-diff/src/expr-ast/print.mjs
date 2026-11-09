/**
 * Impressão canônica da AST com o mínimo de parênteses.
 *
 * Formato: operadores binários cercados por um espaço ("a + b"), menos unário
 * colado ao operando ("-a"), parênteses sem espaços internos ("(a + b)").
 */
import { fold } from './walk.mjs';

const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '^': 4, neg: 5 };
const ATOM = 10;

const wrap = (s) => `(${s})`;

/** Texto canônico de `ast`; `parse(print(ast))` reconstrói a mesma árvore. */
export function print(ast) {
  return fold(ast, {
    num: (n) => ({ text: String(n.value), prec: ATOM }),
    var: (n) => ({ text: n.name, prec: ATOM }),
    neg: (_, a) => ({ text: '-' + (a.prec >= PREC.neg ? a.text : wrap(a.text)), prec: PREC.neg }),
    bin: (n, l, r) => {
      const p = PREC[n.op];
      let left;
      let right;
      if (n.op === '^') {
        left = l.prec > p ? l.text : wrap(l.text);
        right = r.prec > PREC['*'] ? r.text : wrap(r.text);
      } else {
        left = l.prec >= p ? l.text : wrap(l.text);
        right = r.prec > p ? r.text : wrap(r.text);
      }
      return { text: `${left} ${n.op} ${right}`, prec: p };
    },
  }).text;
}
