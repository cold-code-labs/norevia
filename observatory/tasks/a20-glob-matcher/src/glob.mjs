/**
 * Glob de caminhos: expansão de chaves, compilação de padrões em segmentos e casamento
 * com retrocesso (`*`, `?`, classes `[...]`, `**` como segmento inteiro e escapes).
 */

const GLOBSTAR = Object.freeze({ t: 'globstar' });
const SPECIAL = new Set(['\\', '*', '?', '[', ']', '{', '}', ',']);

function assertString(value, what) {
  if (typeof value !== 'string') throw new TypeError(`${what} deve ser string`);
}

function normalizeOptions(opts) {
  if (opts === undefined) return { dot: false, nocase: false };
  if (opts === null || typeof opts !== 'object') throw new TypeError('opções devem ser um objeto');
  return { dot: opts.dot === true, nocase: opts.nocase === true };
}

/**
 * Procura o fechamento do grupo `{` em `start`. Devolve `{ end, parts }` se houver `}`
 * correspondente e ao menos uma vírgula de nível superior; senão `null`.
 */
function scanGroup(pattern, start) {
  let depth = 0;
  let from = start + 1;
  const parts = [];
  for (let j = start + 1; j < pattern.length; j++) {
    const c = pattern[j];
    if (c === '\\') {
      j++;
    } else if (c === '{') {
      depth++;
    } else if (c === '}') {
      if (depth === 0) {
        if (!parts.length) return null;
        parts.push(pattern.slice(from, j));
        return { end: j, parts };
      }
      depth--;
    } else if (c === ',' && depth === 0) {
      parts.push(pattern.slice(from, j));
      from = j + 1;
    }
  }
  return null;
}

/** Expande os grupos `{a,b}` (aninháveis) em ordem; escapes são preservados no resultado. */
export function expandBraces(pattern) {
  assertString(pattern, 'padrão');
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '\\') {
      i++;
      continue;
    }
    if (c !== '{') continue;
    const group = scanGroup(pattern, i);
    if (!group) continue;
    const prefix = pattern.slice(0, i);
    const suffixes = expandBraces(pattern.slice(group.end + 1));
    const out = [];
    for (const part of group.parts) {
      for (const middle of expandBraces(part)) {
        for (const suffix of suffixes) out.push(prefix + middle + suffix);
      }
    }
    return out;
  }
  return [pattern];
}

/** Lê o caractere (possivelmente escapado) em `j` dentro de uma classe. */
function classChar(src, j) {
  if (src[j] === '\\') {
    if (j + 1 >= src.length || src[j + 1] === '/') return null;
    return { c: src[j + 1], next: j + 2 };
  }
  if (j >= src.length || src[j] === '/') return null;
  return { c: src[j], next: j + 1 };
}

/** Tenta ler uma classe a partir do `[` em `start`; `null` se não houver `]` no segmento. */
function parseClass(src, start) {
  let j = start + 1;
  let negated = false;
  if (src[j] === '!' || src[j] === '^') {
    negated = true;
    j++;
  }
  const ranges = [];
  let first = true;
  for (;;) {
    if (j >= src.length || src[j] === '/') return null;
    if (src[j] === ']' && !first) break;
    first = false;
    const lo = classChar(src, j);
    if (!lo) return null;
    j = lo.next;
    if (src[j] === '-' && j + 1 < src.length && src[j + 1] !== ']') {
      const hi = classChar(src, j + 1);
      if (!hi) return null;
      ranges.push([lo.c, hi.c]);
      j = hi.next;
    } else {
      ranges.push([lo.c, lo.c]);
    }
  }
  return { token: { t: 'class', negated, ranges }, end: j };
}

/** Converte uma alternativa (sem chaves) em lista de segmentos. */
function compileAlternative(alt) {
  const segments = [];
  let tokens = [];
  let segStart = 0;
  const close = (end) => {
    segments.push(alt.slice(segStart, end) === '**' ? GLOBSTAR : { t: 'segment', tokens });
    tokens = [];
    segStart = end + 1;
  };
  for (let i = 0; i < alt.length; i++) {
    const c = alt[i];
    if (c === '\\') {
      if (i + 1 >= alt.length) throw new SyntaxError(`escape incompleto no fim de "${alt}"`);
      tokens.push({ t: 'lit', c: alt[++i] });
    } else if (c === '/') {
      close(i);
    } else if (c === '*') {
      if (tokens.length === 0 || tokens[tokens.length - 1].t !== 'star') tokens.push({ t: 'star' });
    } else if (c === '?') {
      tokens.push({ t: 'any' });
    } else if (c === '[') {
      const cls = parseClass(alt, i);
      if (cls) {
        tokens.push(cls.token);
        i = cls.end;
      } else {
        tokens.push({ t: 'lit', c });
      }
    } else {
      tokens.push({ t: 'lit', c });
    }
  }
  close(alt.length);
  return segments;
}

function inClass(token, ch) {
  for (const [lo, hi] of token.ranges) if (ch >= lo && ch <= hi) return true;
  return false;
}

function matchOne(token, ch, opts) {
  switch (token.t) {
    case 'any':
      return true;
    case 'lit':
      return opts.nocase ? token.c.toLowerCase() === ch.toLowerCase() : token.c === ch;
    case 'class': {
      const hit = inClass(token, ch) || (opts.nocase && (inClass(token, ch.toLowerCase()) || inClass(token, ch.toUpperCase())));
      return hit !== token.negated;
    }
    default:
      return false;
  }
}

/** Casa um segmento de padrão (tokens) com um segmento de caminho. */
function matchSegment(tokens, text, opts) {
  if (!opts.dot && text[0] === '.' && !(tokens.length && tokens[0].t === 'lit' && tokens[0].c === '.')) return false;
  let p = 0;
  let i = 0;
  let starP = -1;
  let starI = 0;
  while (i < text.length) {
    const tk = tokens[p];
    if (tk && tk.t === 'star') {
      starP = p++;
      starI = i;
      continue;
    }
    if (tk && matchOne(tk, text[i], opts)) {
      p++;
      i++;
      continue;
    }
    if (starP >= 0) {
      p = starP + 1;
      i = ++starI;
      continue;
    }
    return false;
  }
  while (p < tokens.length && tokens[p].t === 'star') p++;
  return p === tokens.length;
}

/** Casa a lista de segmentos do padrão com as partes do caminho (`**` consome 0+ partes). */
function matchSegments(segs, parts, opts) {
  const S = segs.length;
  const memo = new Uint8Array((S + 1) * (parts.length + 1));
  const rec = (si, pi) => {
    const key = pi * S + si;
    if (memo[key]) return memo[key] === 1;
    let r;
    if (si === S) {
      r = pi === parts.length;
    } else if (segs[si] === GLOBSTAR) {
      r = rec(si + 1, pi) || (pi < parts.length && (opts.dot || parts[pi][0] !== '.') && rec(si, pi + 1));
    } else {
      r = pi < parts.length && matchSegment(segs[si].tokens, parts[pi], opts) && rec(si + 1, pi + 1);
    }
    memo[key] = r ? 1 : 2;
    return r;
  };
  return rec(0, 0);
}

/** Compila o padrão: expande chaves e converte cada alternativa em segmentos. */
export function compile(pattern, options) {
  assertString(pattern, 'padrão');
  const opts = normalizeOptions(options);
  const alternatives = expandBraces(pattern).map(compileAlternative);
  return { pattern, options: opts, alternatives };
}

/** Devolve uma função `(path) => boolean` para o padrão. */
export function makeMatcher(pattern, options) {
  const compiled = compile(pattern, options);
  return (path) => {
    assertString(path, 'caminho');
    const parts = path.split('/');
    return compiled.alternatives.some((segs) => matchSegments(segs, parts, compiled.options));
  };
}

/** `true` se `path` casa com `pattern`. */
export function isMatch(path, pattern, options) {
  assertString(path, 'caminho');
  return makeMatcher(pattern, options)(path);
}

/** Os caminhos de `paths` que casam com o padrão, na ordem original. */
export function filter(paths, pattern, options) {
  if (!Array.isArray(paths)) throw new TypeError('paths deve ser um array');
  const m = makeMatcher(pattern, options);
  return paths.filter((p) => m(p));
}

/** Escapa com `\` todo caractere especial de glob, de modo que o resultado case só o texto literal. */
export function escapeGlob(text) {
  assertString(text, 'texto');
  let out = '';
  for (const c of text) out += SPECIAL.has(c) ? '\\' + c : c;
  return out;
}

/** `true` se o padrão tem algum curinga (`*`, `?`, classe válida, `**`) ou grupo de chaves válido. */
export function hasMagic(pattern) {
  const { alternatives } = compile(pattern);
  if (alternatives.length > 1) return true;
  return alternatives[0].some((seg) => seg === GLOBSTAR || seg.tokens.some((tk) => tk.t !== 'lit'));
}
