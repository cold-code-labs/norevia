/**
 * Parser de arquivos .env.
 */
const KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ESCAPES = { n: '\n', t: '\t', '"': '"', '\\': '\\' };

/**
 * parseEnv(text) → objeto { CHAVE: 'valor' } (todos os valores são strings).
 *
 * - Linhas separadas por \n ou \r\n; linhas em branco e comentários (# como
 *   primeiro caractere não branco) são ignorados.
 * - Prefixo opcional "export ".
 * - A chave é o trecho antes do primeiro '=' (aparado) e deve casar com KEY.
 * - Valor entre aspas duplas: escapes \n \t \" \\ são interpretados.
 * - Valor entre aspas simples: literal.
 * - Valor sem aspas: aparado; um '#' precedido de espaço inicia comentário.
 * - Chave repetida: a última ocorrência vence.
 * Erros de sintaxe lançam SyntaxError mencionando "line N" (1-based).
 */
export function parseEnv(text) {
  const out = {};
  const lines = text.split(/\r?\n/);
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) return;
    const body = line.startsWith('export ') ? line.slice(7) : line;
    const eq = body.lastIndexOf('=');
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
