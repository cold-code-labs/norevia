/**
 * Casamento de caminhos com padrões glob (separador `/`).
 *
 *   *        qualquer sequência (inclusive vazia) dentro de um segmento
 *   ?        exatamente um caractere de um segmento
 *   [abc]    classe; aceita intervalos (`a-z`) e negação com `[!…]`
 *   **       segmento inteiro: zero ou mais segmentos
 *   \x       o caractere x literal
 *
 * Segmentos que começam com `.` só casam com segmentos do padrão que começam
 * com um `.` literal.
 */

const DOT_SAFE_SEGMENT = '(?!\\.)[^/]+';

function escapeRe(ch) {
  return /[\\^$.*+?()[\]{}|]/.test(ch) ? '\\' + ch : ch;
}

function classEnd(seg, start) {
  let j = start + 1;
  if (seg[j] === '!') j++;
  if (seg[j] === ']') j++;
  return seg.indexOf(']', j);
}

function classBody(body) {
  return body.replace(/[\\\]\[^]/g, (c) => '\\' + c);
}

function compileSegment(seg) {
  let re = '';
  for (let i = 0; i < seg.length; i++) {
    const c = seg[i];
    if (c === '\\') {
      re += i + 1 < seg.length ? escapeRe(seg[++i]) : '\\\\';
    } else if (c === '*') {
      while (seg[i + 1] === '*') i++;
      re += '[^/]*';
    } else if (c === '?') {
      re += '[^/]';
    } else if (c === '[') {
      const end = classEnd(seg, i);
      if (end === -1) {
        re += '\\[';
        continue;
      }
      let body = seg.slice(i + 1, end);
      const negate = body[0] === '!';
      if (negate) body = body.slice(1);
      re += negate ? `[^${classBody(body)}]` : `[${classBody(body)}]`;
      i = end;
    } else {
      re += escapeRe(c);
    }
  }
  return re;
}

function startsWithLiteralDot(seg) {
  return seg.startsWith('.') || seg.startsWith('\\.');
}

/** Compila o padrão numa RegExp ancorada. */
export function globToRegExp(pattern) {
  if (typeof pattern !== 'string') throw new TypeError('o padrão deve ser uma string');
  const segs = pattern.split('/').filter((s, i, all) => !(s === '**' && all[i - 1] === '**'));
  let re = '';
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    const last = i === segs.length - 1;
    if (seg === '**') {
      if (!last) re += `(?:${DOT_SAFE_SEGMENT}/)*`;
      else if (i === 0) re += `${DOT_SAFE_SEGMENT}(?:/${DOT_SAFE_SEGMENT})*`;
      else re = re.slice(0, -1) + `(?:/${DOT_SAFE_SEGMENT})*`;
      continue;
    }
    const guard = startsWithLiteralDot(seg) ? '' : '(?!\\.)';
    re += guard + compileSegment(seg) + (last ? '' : '/');
  }
  return new RegExp(`^${re}$`);
}

/** `true` se `path` casa inteiro com `pattern`. */
export function matchGlob(pattern, path) {
  if (typeof path !== 'string') throw new TypeError('o caminho deve ser uma string');
  return globToRegExp(pattern).test(path);
}

/** Caminhos de `paths` que casam com `pattern`, na ordem original. */
export function filterGlob(pattern, paths) {
  const re = globToRegExp(pattern);
  return paths.filter((p) => re.test(p));
}
