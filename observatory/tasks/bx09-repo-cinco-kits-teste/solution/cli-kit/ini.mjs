/**
 * Leitor de arquivos INI.
 *
 * parseIni(text) devolve um objeto: chaves antes de qualquer seção ficam na
 * raiz; `[a.b]` cria/abre a subseção `b` dentro de `a`. Valores são strings.
 */

function unquote(value) {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\(["\\])/g, '$1');
  }
  return value;
}

function openSection(root, header, lineNo) {
  const parts = header.split('.').map((p) => p.trim());
  if (parts.some((p) => p === '')) throw new SyntaxError(`linha ${lineNo}: nome de seção inválido`);
  let node = root;
  parts.forEach((part) => {
    if (Object.hasOwn(node, part) && typeof node[part] !== 'object') {
      throw new SyntaxError(`linha ${lineNo}: "${part}" já é uma chave`);
    }
    if (!Object.hasOwn(node, part)) node[part] = {};
    node = node[part];
  });
  return node;
}

export function parseIni(text) {
  if (typeof text !== 'string') throw new TypeError('o conteúdo INI deve ser string');
  const root = {};
  let current = root;
  text.split(/\r?\n/).forEach((raw, idx) => {
    const lineNo = idx + 1;
    const line = raw.trim();
    if (line === '' || line.startsWith(';') || line.startsWith('#')) return;
    if (line.startsWith('[')) {
      if (!line.endsWith(']')) throw new SyntaxError(`linha ${lineNo}: cabeçalho de seção malformado`);
      current = openSection(root, line.slice(1, -1), lineNo);
      return;
    }
    const eq = line.indexOf('=');
    if (eq === -1) throw new SyntaxError(`linha ${lineNo}: esperado "chave = valor"`);
    const key = line.slice(0, eq).trim();
    if (key === '') throw new SyntaxError(`linha ${lineNo}: chave vazia`);
    if (Object.hasOwn(current, key) && typeof current[key] === 'object') {
      throw new SyntaxError(`linha ${lineNo}: "${key}" já é uma seção`);
    }
    current[key] = unquote(line.slice(eq + 1).trim());
  });
  return root;
}

/** Lê `section.sub.key` de um resultado de parseIni; ausente -> `fallback`. */
export function getIni(data, path, fallback = undefined) {
  let node = data;
  for (const part of path.split('.')) {
    if (node === null || typeof node !== 'object' || !Object.hasOwn(node, part)) return fallback;
    node = node[part];
  }
  return node;
}
