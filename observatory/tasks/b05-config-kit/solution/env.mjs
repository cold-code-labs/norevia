/**
 * Parser for .env files.
 */
const KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ESCAPES = { n: '\n', t: '\t', '"': '"', '\\': '\\' };

/**
 * parseEnv(text) → object { KEY: 'value' } (all values are strings).
 *
 * - Lines separated by \n or \r\n; blank lines and comments (# as
 *   the first non-blank character) are ignored.
 * - Optional "export " prefix.
 * - The key is the part before the first '=' (trimmed) and must match KEY.
 * - Double-quoted value: escapes \n \t \" \\ are interpreted.
 * - Single-quoted value: literal.
 * - Unquoted value: trimmed; a '#' preceded by a space starts a comment.
 * - Repeated key: the last occurrence wins.
 * Syntax errors throw SyntaxError mentioning "line N" (1-based).
 */
export function parseEnv(text) {
  const out = {};
  const lines = text.split(/\r?\n/);
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) return;
    const body = line.startsWith('export ') ? line.slice(7) : line;
    const eq = body.indexOf('=');
    if (eq === -1) throw new SyntaxError(`line ${i + 1}: missing '='`);
    const key = body.slice(0, eq).trim();
    if (!KEY.test(key)) throw new SyntaxError(`line ${i + 1}: invalid key '${key}'`);
    out[key] = parseValue(body.slice(eq + 1).trim(), i + 1);
  });
  return out;
}

function parseValue(v, lineNo) {
  if (v.startsWith('"')) {
    if (v.length < 2 || !v.endsWith('"') || v.endsWith('\\"')) throw new SyntaxError(`line ${lineNo}: unterminated string`);
    return v.slice(1, -1).replace(/\\(.)/g, (m, c) => ESCAPES[c] ?? m);
  }
  if (v.startsWith("'")) {
    if (v.length < 2 || !v.endsWith("'")) throw new SyntaxError(`line ${lineNo}: unterminated string`);
    return v.slice(1, -1);
  }
  const hash = v.search(/\s#/);
  return (hash === -1 ? v : v.slice(0, hash)).trim();
}
