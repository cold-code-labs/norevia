/**
 * Parser de expressões aritméticas (algoritmo shunting-yard) que produz a AST:
 *   { type: 'num', value }            literal numérico (sempre >= 0)
 *   { type: 'var', name }             identificador
 *   { type: 'neg', arg }              menos unário
 *   { type: 'bin', op, left, right }  operador binário: + - * / % ^
 */

const BINARY = {
  '+': { prec: 1, assoc: 'left' },
  '-': { prec: 1, assoc: 'left' },
  '*': { prec: 2, assoc: 'left' },
  '/': { prec: 2, assoc: 'left' },
  '%': { prec: 2, assoc: 'left' },
  '^': { prec: 4, assoc: 'right' },
};
const NEG_PREC = 5;

/**
 * Divide o texto em tokens `{ kind: 'num'|'id'|'op'|'(' |')', text, pos }`.
 * Espaços são ignorados; qualquer outro caractere desconhecido → SyntaxError.
 */
export function tokenize(src) {
  if (typeof src !== 'string') throw new TypeError('a expressão deve ser string');
  const tokens = [];
  const re = /\s*(?:(\d+(?:\.\d+)?)|([A-Za-z_]\w*)|([-+*/%^])|([()]))/y;
  let pos = 0;
  while (pos < src.length) {
    if (/^\s*$/.test(src.slice(pos))) break;
    re.lastIndex = pos;
    const m = re.exec(src);
    if (!m) throw new SyntaxError(`caractere inesperado na posição ${pos}`);
    const at = re.lastIndex - m[0].trimStart().length;
    if (m[1] !== undefined) tokens.push({ kind: 'num', text: m[1], pos: at });
    else if (m[2] !== undefined) tokens.push({ kind: 'id', text: m[2], pos: at });
    else if (m[3] !== undefined) tokens.push({ kind: 'op', text: m[3], pos: at });
    else tokens.push({ kind: m[4], text: m[4], pos: at });
    pos = re.lastIndex;
  }
  return tokens;
}

function reduce(out, op) {
  if (op === 'neg') {
    if (out.length < 1) throw new SyntaxError('operando ausente');
    out.push({ type: 'neg', arg: out.pop() });
    return;
  }
  if (out.length < 2) throw new SyntaxError('operando ausente');
  const left = out.pop();
  const right = out.pop();
  out.push({ type: 'bin', op, left, right });
}

function precOf(op) {
  return op === 'neg' ? NEG_PREC : BINARY[op].prec;
}

/**
 * Converte o texto em AST. Erros de sintaxe (token inesperado, parênteses
 * desbalanceados, expressão vazia ou incompleta) → SyntaxError.
 */
export function parse(src) {
  const tokens = tokenize(src);
  const out = [];
  const ops = [];
  let expectOperand = true;
  for (const tok of tokens) {
    if (expectOperand) {
      if (tok.kind === 'num') { out.push({ type: 'num', value: Number(tok.text) }); expectOperand = false; }
      else if (tok.kind === 'id') { out.push({ type: 'var', name: tok.text }); expectOperand = false; }
      else if (tok.kind === '(') ops.push('(');
      else if (tok.kind === 'op' && tok.text === '-') ops.push('neg');
      else throw new SyntaxError(`token inesperado '${tok.text}' na posição ${tok.pos}`);
      continue;
    }
    if (tok.kind === 'op') {
      const { prec, assoc } = BINARY[tok.text];
      while (ops.length && ops[ops.length - 1] !== '(') {
        const top = precOf(ops[ops.length - 1]);
        if (top > prec || (top === prec && assoc === 'left')) reduce(out, ops.pop());
        else break;
      }
      ops.push(tok.text);
      expectOperand = true;
    } else if (tok.kind === ')') {
      while (ops.length && ops[ops.length - 1] !== '(') reduce(out, ops.pop());
      if (!ops.length) throw new SyntaxError(`')' sem par na posição ${tok.pos}`);
      ops.pop();
    } else {
      throw new SyntaxError(`token inesperado '${tok.text}' na posição ${tok.pos}`);
    }
  }
  if (expectOperand) throw new SyntaxError('expressão incompleta');
  while (ops.length) {
    const op = ops.pop();
    if (op === '(') throw new SyntaxError("'(' sem par");
    reduce(out, op);
  }
  if (out.length !== 1) throw new SyntaxError('expressão malformada');
  return out[0];
}
