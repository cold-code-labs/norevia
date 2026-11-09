/**
 * Arithmetic expressions: tokenization, parsing, printing with
 * minimal parentheses, simplification and evaluation.
 *
 * AST format (plain objects, with no other keys):
 *   { type: 'num', value }            numeric literal
 *   { type: 'var', name }             identifier
 *   { type: 'neg', arg }              unary minus
 *   { type: 'bin', op, left, right }  binary operator (+ - * / % ^)
 *   { type: 'call', name, args }      function call
 */

const BINARY = {
  '+': { prec: 1, rightAssoc: false },
  '-': { prec: 1, rightAssoc: false },
  '*': { prec: 2, rightAssoc: false },
  '/': { prec: 2, rightAssoc: false },
  '%': { prec: 2, rightAssoc: false },
  '^': { prec: 4, rightAssoc: true },
};
const PREC_NEG = 3;
const PREC_ATOM = 9;
const PUNCT = new Set(['+', '-', '*', '/', '%', '^', '(', ')', ',']);
const SPACE = new Set([' ', '\t', '\n', '\r']);

const isDigit = (c) => c !== undefined && c >= '0' && c <= '9';
const isIdStart = (c) => c !== undefined && ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_');
const isIdPart = (c) => isIdStart(c) || isDigit(c);

// ------------------------------------------------------------------ tokenize

/**
 * Converts the text into tokens `{ type, value, pos }`:
 *   - `num`: `value` is the number. Accepts integer, fraction (`1.25`) and exponent
 *     (`1e3`, `2.5E-4`). The exponent is only part of the number when `e`/`E` is
 *     followed by a digit (optionally after `+`/`-`); otherwise the number ends
 *     before the `e`.
 *   - `id`: `value` is the name (`[A-Za-z_][A-Za-z0-9_]*`).
 *   - `op`: `value` is one of `+ - * / % ^ ( ) ,`.
 * `pos` is the index of the token's first character. Spaces are ignored.
 */
export function tokenize(src) {
  if (typeof src !== 'string') throw new TypeError('a expressão deve ser uma string');
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (SPACE.has(c)) { i++; continue; }
    if (isDigit(c)) {
      const start = i;
      while (isDigit(src[i])) i++;
      if (src[i] === '.') {
        if (!isDigit(src[i + 1])) throw new SyntaxError(`número malformado na posição ${start}`);
        i++;
        while (isDigit(src[i])) i++;
      }
      if (src[i] === 'e' || src[i] === 'E') {
        let j = i + 1;
        if (src[j] === '+' || src[j] === '-') j++;
        if (isDigit(src[j])) {
          i = j;
          while (isDigit(src[i])) i++;
        }
      }
      tokens.push({ type: 'num', value: Number(src.slice(start, i)), pos: start });
      continue;
    }
    if (isIdStart(c)) {
      const start = i;
      while (isIdPart(src[i])) i++;
      tokens.push({ type: 'id', value: src.slice(start, i), pos: start });
      continue;
    }
    if (PUNCT.has(c)) {
      tokens.push({ type: 'op', value: c, pos: i });
      i++;
      continue;
    }
    throw new SyntaxError(`caractere inesperado '${c}' na posição ${i}`);
  }
  return tokens;
}

// --------------------------------------------------------------------- parse

/**
 * Parses the expression and returns the AST. Grammar:
 *   expr    := term (('+' | '-') term)*
 *   term    := unary (('*' | '/' | '%') unary)*
 *   unary   := '-' unary | power
 *   power   := primary ('^' unary)?
 *   primary := num | id | id '(' [expr (',' expr)*] ')' | '(' expr ')'
 * Any deviation throws `SyntaxError`.
 */
export function parse(src) {
  const tokens = tokenize(src);
  let k = 0;
  const peek = () => tokens[k];
  const isOp = (t, v) => t !== undefined && t.type === 'op' && t.value === v;
  const fail = (t, what) => {
    throw new SyntaxError(t ? `${what}: '${t.value}' na posição ${t.pos}` : `${what}: fim da expressão`);
  };
  const expect = (v) => {
    if (!isOp(tokens[k], v)) fail(tokens[k], `esperado '${v}'`);
    k++;
  };

  function parseExpr() {
    let left = parseTerm();
    while (isOp(peek(), '+') || isOp(peek(), '-')) {
      const op = tokens[k++].value;
      left = { type: 'bin', op, left, right: parseTerm() };
    }
    return left;
  }

  function parseTerm() {
    let left = parseUnary();
    while (isOp(peek(), '*') || isOp(peek(), '/') || isOp(peek(), '%')) {
      const op = tokens[k++].value;
      left = { type: 'bin', op, left, right: parseUnary() };
    }
    return left;
  }

  function parseUnary() {
    if (isOp(peek(), '-')) {
      k++;
      return { type: 'neg', arg: parseUnary() };
    }
    return parsePower();
  }

  function parsePower() {
    const base = parsePrimary();
    if (isOp(peek(), '^')) {
      k++;
      return { type: 'bin', op: '^', left: base, right: parseUnary() };
    }
    return base;
  }

  function parsePrimary() {
    const t = tokens[k];
    if (t === undefined) fail(t, 'esperado operando');
    if (t.type === 'num') { k++; return { type: 'num', value: t.value }; }
    if (t.type === 'id') {
      k++;
      if (!isOp(peek(), '(')) return { type: 'var', name: t.value };
      k++;
      const args = [];
      if (!isOp(peek(), ')')) {
        for (;;) {
          args.push(parseExpr());
          if (!isOp(peek(), ',')) break;
          k++;
        }
      }
      expect(')');
      return { type: 'call', name: t.value, args };
    }
    if (isOp(t, '(')) {
      k++;
      const inner = parseExpr();
      expect(')');
      return inner;
    }
    return fail(t, 'esperado operando');
  }

  const ast = parseExpr();
  if (k < tokens.length) fail(tokens[k], 'token inesperado');
  return ast;
}

// -------------------------------------------------------------------- format

function precOf(node) {
  switch (node.type) {
    case 'bin': return BINARY[node.op].prec;
    case 'neg': return PREC_NEG;
    case 'num': return node.value < 0 ? PREC_NEG : PREC_ATOM;
    default: return PREC_ATOM;
  }
}

function needsParens(child, op, side) {
  const { prec, rightAssoc } = BINARY[op];
  const cp = precOf(child);
  if (cp !== prec) return cp < prec;
  return side === (rightAssoc ? 'left' : 'right');
}

function formatNumber(value) {
  if (!Number.isFinite(value)) throw new RangeError(`literal não finito: ${value}`);
  return String(value);
}

/**
 * Prints the AST with the minimum of parentheses that preserves the structure.
 * `+ - * / %` get one space on each side; `^`, unary minus and calls
 * get no spaces (arguments separated by `", "`).
 */
export function format(node) {
  switch (node.type) {
    case 'num': return formatNumber(node.value);
    case 'var': return node.name;
    case 'call': return `${node.name}(${node.args.map(format).join(', ')})`;
    case 'neg': {
      const inner = format(node.arg);
      return precOf(node.arg) <= PREC_NEG ? `-(${inner})` : `-${inner}`;
    }
    case 'bin': {
      if (!Object.hasOwn(BINARY, node.op)) throw new TypeError(`operador desconhecido: ${node.op}`);
      const wrap = (child, side) => (needsParens(child, node.op, side) ? `(${format(child)})` : format(child));
      const l = wrap(node.left, 'left');
      const r = wrap(node.right, 'right');
      return node.op === '^' ? `${l}^${r}` : `${l} ${node.op} ${r}`;
    }
    default:
      throw new TypeError(`nó desconhecido: ${node.type}`);
  }
}

// ------------------------------------------------------------------ evaluate

function applyBinary(op, a, b) {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/':
      if (b === 0) throw new RangeError('divisão por zero');
      return a / b;
    case '%':
      if (b === 0) throw new RangeError('módulo por zero');
      return ((a % b) + b) % b;
    case '^': return a ** b;
    default: throw new TypeError(`operador desconhecido: ${op}`);
  }
}

const BUILTINS = {
  min: { min: 1, max: Infinity, fn: (...xs) => Math.min(...xs) },
  max: { min: 1, max: Infinity, fn: (...xs) => Math.max(...xs) },
  abs: { min: 1, max: 1, fn: (x) => Math.abs(x) },
  sqrt: {
    min: 1, max: 1,
    fn: (x) => {
      if (x < 0) throw new RangeError('sqrt de número negativo');
      return Math.sqrt(x);
    },
  },
  round: { min: 1, max: 1, fn: (x) => Math.sign(x) * Math.round(Math.abs(x)) },
};

function evalNode(node, env) {
  switch (node.type) {
    case 'num': return node.value;
    case 'var': {
      if (!Object.hasOwn(env, node.name)) throw new ReferenceError(`variável indefinida: ${node.name}`);
      const v = env[node.name];
      if (typeof v !== 'number') throw new TypeError(`${node.name} não é um número`);
      return v;
    }
    case 'neg': return -evalNode(node.arg, env);
    case 'bin': return applyBinary(node.op, evalNode(node.left, env), evalNode(node.right, env));
    case 'call': {
      const args = node.args.map((a) => evalNode(a, env));
      if (Object.hasOwn(env, node.name) && typeof env[node.name] === 'function') return env[node.name](...args);
      if (!Object.hasOwn(BUILTINS, node.name)) throw new ReferenceError(`função indefinida: ${node.name}`);
      const { min, max, fn } = BUILTINS[node.name];
      if (args.length < min || args.length > max) throw new RangeError(`aridade inválida para ${node.name}`);
      return fn(...args);
    }
    default:
      throw new TypeError(`nó desconhecido: ${node.type}`);
  }
}

/** Evaluates an expression (text or AST) with the variables/functions of `env`. */
export function evaluate(input, env = {}) {
  const ast = typeof input === 'string' ? parse(input) : input;
  return evalNode(ast, env);
}

// ------------------------------------------------------------------ simplify

function tryFold(op, a, b) {
  let v;
  try {
    v = applyBinary(op, a, b);
  } catch (e) {
    if (e instanceof RangeError) return null;
    throw e;
  }
  return Number.isFinite(v) ? v : null;
}

const isNum = (n, v) => n.type === 'num' && n.value === v;

/**
 * Returns a NEW simplified tree (the input is not changed):
 * folds constants, eliminates double minus and applies simple identities.
 */
export function simplify(node) {
  switch (node.type) {
    case 'num': return { type: 'num', value: node.value };
    case 'var': return { type: 'var', name: node.name };
    case 'call': return { type: 'call', name: node.name, args: node.args.map(simplify) };
    case 'neg': {
      const arg = simplify(node.arg);
      if (arg.type === 'num') return { type: 'num', value: -arg.value };
      if (arg.type === 'neg') return arg.arg;
      return { type: 'neg', arg };
    }
    case 'bin': {
      const left = simplify(node.left);
      const right = simplify(node.right);
      if (left.type === 'num' && right.type === 'num') {
        const folded = tryFold(node.op, left.value, right.value);
        if (folded !== null) return { type: 'num', value: folded };
      }
      switch (node.op) {
        case '+':
          if (isNum(right, 0)) return left;
          if (isNum(left, 0)) return right;
          break;
        case '-':
          if (isNum(right, 0)) return left;
          break;
        case '*':
          if (isNum(right, 1)) return left;
          if (isNum(left, 1)) return right;
          break;
        case '/':
        case '^':
          if (isNum(right, 1)) return left;
          break;
        default:
          break;
      }
      return { type: 'bin', op: node.op, left, right };
    }
    default:
      throw new TypeError(`nó desconhecido: ${node.type}`);
  }
}
