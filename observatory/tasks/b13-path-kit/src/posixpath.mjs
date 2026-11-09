/**
 * Manipulação de caminhos POSIX (separador `/`), sem acesso ao sistema de
 * arquivos.
 */

function checkString(p) {
  if (typeof p !== 'string') throw new TypeError('caminho deve ser uma string');
}

/**
 * Remove `.`, barras repetidas e resolve `..`. Em caminho absoluto, `..`
 * acima da raiz é descartado; em caminho relativo, `..` iniciais são mantidos.
 * Uma barra final é preservada.
 */
export function normalize(p) {
  checkString(p);
  if (p === '') return '.';
  const abs = p.startsWith('/');
  const trailing = p.endsWith('/');
  const out = [];
  for (const seg of p.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') {
      if (out.length > 0) out.pop();
      else if (!abs) out.push('..');
    } else {
      out.push(seg);
    }
  }
  let res = (abs ? '/' : '') + out.join('/');
  if (res === '') res = '.';
  if (trailing && !res.endsWith('/')) res += '/';
  return res;
}

/** Junta as partes não vazias com `/` e normaliza; sem partes → `'.'`. */
export function join(...parts) {
  parts.forEach(checkString);
  const used = parts.filter((p) => p !== '');
  return used.length === 0 ? '.' : normalize(used.join('/'));
}

function segments(abs) {
  return normalize(abs).split('/').filter(Boolean);
}

/** Caminho relativo de `from` até `to` (ambos absolutos). */
export function relative(from, to) {
  checkString(from);
  checkString(to);
  if (!from.startsWith('/') || !to.startsWith('/')) throw new RangeError('relative exige caminhos absolutos');
  const a = segments(from);
  const b = segments(to);
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return [...a.slice(i).map(() => '..'), ...b.slice(i)].join('/');
}

function stripTrailingSlashes(p) {
  let end = p.length;
  while (end > 1 && p[end - 1] === '/') end--;
  return p.slice(0, end);
}

/** Diretório pai: `'/a/b/'` → `'/a'`, `'a'` → `'.'`, `'/a'` → `'/'`. */
export function dirname(p) {
  checkString(p);
  const s = stripTrailingSlashes(p);
  const idx = s.lastIndexOf('/');
  if (idx === -1) return '.';
  if (idx === 0) return '/';
  return stripTrailingSlashes(s.slice(0, idx));
}

/** Último segmento; remove `ext` do fim se coincidir e não for o nome todo. */
export function basename(p, ext = '') {
  checkString(p);
  const s = stripTrailingSlashes(p);
  const base = s === '/' ? '' : s.slice(s.lastIndexOf('/') + 1);
  if (ext && base !== ext && base.endsWith(ext)) return base.slice(0, -ext.length);
  return base;
}

/** Extensão a partir do último `.` do nome; nomes como `.bashrc` não têm. */
export function extname(p) {
  const base = basename(p);
  if (base === '..') return '';
  const idx = base.lastIndexOf('.');
  return idx <= 0 ? '' : base.slice(idx);
}
