/**
 * Léxico e parser da linguagem Calc (programas com variáveis, laços e chamadas).
 */

const KEYWORDS = new Set(['let', 'print', 'if', 'else', 'while']);
const OPS = ['==', '!=', '<=', '>=', '<', '>', '+', '-', '*', '/', '%', '=', '(', ')', '{', '}', ',', ';'];
const CMP = ['==', '!=', '<', '<=', '>', '>='];

export function tokenize(src) {
  if (typeof src !== 'string') throw new TypeError('o código-fonte deve ser string');
  const out = [];
  let i = 0;
  let line = 1;
  while (i < src.length) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }
    if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
    if (c === '#') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (c >= '0' && c <= '9') {
      let j = i;
      while (j < src.length && src[j] >= '0' && src[j] <= '9') j++;
      out.push({ type: 'num', value: Number(src.slice(i, j)), line });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < src.length && /\w/.test(src[j])) j++;
      const word = src.slice(i, j);
      out.push({ type: KEYWORDS.has(word) ? 'kw' : 'ident', value: word, line });
      i = j;
      continue;
    }
    const op = OPS.find((o) => src.startsWith(o, i));
    if (!op) throw new SyntaxError(`caractere inesperado ${JSON.stringify(c)} na linha ${line}`);
    out.push({ type: 'op', value: op, line });
    i += op.length;
  }
  out.push({ type: 'eof', value: null, line });
  return out;
}

export function parse(src) {
  const toks = tokenize(src);
  let p = 0;
  const peek = (k = 0) => toks[Math.min(p + k, toks.length - 1)];
  const isOp = (v, k = 0) => peek(k).type === 'op' && peek(k).value === v;
  const isKw = (v) => peek().type === 'kw' && peek().value === v;
  const fail = (msg) => { throw new SyntaxError(`${msg} na linha ${peek().line}`); };
  const expectOp = (v) => { if (!isOp(v)) fail(`esperado '${v}'`); p++; };
  const expectIdent = () => {
    if (peek().type !== 'ident') fail('esperado identificador');
    return toks[p++].value;
  };

  function primary() {
    const t = peek();
    if (t.type === 'num') { p++; return { type: 'num', value: t.value }; }
    if (t.type === 'ident') {
      p++;
      if (isOp('(')) {
        p++;
        const args = [];
        if (!isOp(')')) {
          args.push(expr());
          while (isOp(',')) { p++; args.push(expr()); }
        }
        expectOp(')');
        return { type: 'call', name: t.value, args };
      }
      return { type: 'var', name: t.value };
    }
    if (isOp('(')) {
      p++;
      const e = expr();
      expectOp(')');
      return e;
    }
    return fail('esperado operando');
  }

  function unary() {
    if (isOp('-')) { p++; return { type: 'neg', arg: unary() }; }
    return primary();
  }

  function level(next, ops) {
    return () => {
      let left = next();
      while (peek().type === 'op' && ops.includes(peek().value)) {
        const op = toks[p++].value;
        const right = next();
        left = { type: 'bin', op, left, right };
      }
      return left;
    };
  }
  const term = level(unary, ['*', '/', '%']);
  const sum = level(term, ['+', '-']);

  function expr() {
    const left = sum();
    if (peek().type === 'op' && CMP.includes(peek().value)) {
      const op = toks[p++].value;
      const right = sum();
      if (peek().type === 'op' && CMP.includes(peek().value)) fail('comparações não são associativas');
      return { type: 'bin', op, left, right };
    }
    return left;
  }

  function block() {
    expectOp('{');
    const body = [];
    while (!isOp('}')) {
      if (peek().type === 'eof') fail("esperado '}'");
      body.push(statement());
    }
    p++;
    return body;
  }

  function ifStatement() {
    p++;
    expectOp('(');
    const cond = expr();
    expectOp(')');
    const then = block();
    let otherwise = null;
    if (isKw('else')) {
      p++;
      otherwise = isKw('if') ? [ifStatement()] : block();
    }
    return { type: 'if', cond, then, else: otherwise };
  }

  function statement() {
    if (isKw('let')) {
      p++;
      const name = expectIdent();
      expectOp('=');
      const e = expr();
      expectOp(';');
      return { type: 'let', name, expr: e };
    }
    if (isKw('print')) {
      p++;
      const e = expr();
      expectOp(';');
      return { type: 'print', expr: e };
    }
    if (isKw('if')) return ifStatement();
    if (isKw('while')) {
      p++;
      expectOp('(');
      const cond = expr();
      expectOp(')');
      return { type: 'while', cond, body: block() };
    }
    if (peek().type === 'ident' && isOp('=', 1)) {
      const name = toks[p].value;
      p += 2;
      const e = expr();
      expectOp(';');
      return { type: 'assign', name, expr: e };
    }
    const e = expr();
    expectOp(';');
    return { type: 'expr', expr: e };
  }

  const body = [];
  while (peek().type !== 'eof') body.push(statement());
  return { type: 'program', body };
}
