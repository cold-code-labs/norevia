/**
 * Manipulação de caminhos de URL (sempre com '/').
 */

/**
 * normalizePath(p):
 *  - caminho absoluto se começa com '/';
 *  - segmentos vazios e '.' são descartados;
 *  - '..' remove o segmento anterior; se não houver segmento anterior para remover,
 *    é descartado em caminhos absolutos e mantido em caminhos relativos;
 *  - barra final é preservada se a entrada termina com '/' (e sobra algum segmento);
 *  - resultado vazio: '/' se absoluto, '.' se relativo.
 */
export function normalizePath(p) {
  const abs = p.startsWith('/');
  const out = [];
  for (const seg of p.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') {
      if (out.length) out.pop();
      else if (!abs) out.push('..');
    } else {
      out.push(seg);
    }
  }
  if (out.length === 0) return abs ? '/' : '.';
  const trailing = p.endsWith('/') ? '/' : '';
  return (abs ? '/' : '') + out.join('/') + trailing;
}

/** Junta as partes não vazias com '/' e normaliza. Sem partes não vazias → '.'. */
export function joinPath(...parts) {
  const nonEmpty = parts.filter((x) => x !== '');
  if (nonEmpty.length === 0) return '.';
  return normalizePath(nonEmpty.join('/'));
}

/** Último segmento do caminho normalizado ('' para '/'). */
export function basename(p) {
  const n = normalizePath(p).replace(/\/$/, '');
  return n.slice(n.lastIndexOf('/') + 1);
}

/** Extensão do basename a partir do último '.', incluindo o ponto; '' se não houver ou se o nome começa com '.'. */
export function extname(p) {
  const b = basename(p);
  const i = b.lastIndexOf('.');
  return i > 0 ? b.slice(i) : '';
}
