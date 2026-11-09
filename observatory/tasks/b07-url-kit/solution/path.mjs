/**
 * URL path manipulation (always with '/').
 */

/**
 * normalizePath(p):
 *  - absolute path if it starts with '/';
 *  - empty segments and '.' are discarded;
 *  - '..' removes the previous segment; if there is no previous segment to remove,
 *    it is discarded in absolute paths and kept in relative paths;
 *  - a trailing slash is preserved if the input ends with '/' (and some segment remains);
 *  - empty result: '/' if absolute, '.' if relative.
 */
export function normalizePath(p) {
  const abs = p.startsWith('/');
  const out = [];
  for (const seg of p.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') {
      if (out.length && out[out.length - 1] !== '..') out.pop();
      else if (!abs) out.push('..');
    } else {
      out.push(seg);
    }
  }
  if (out.length === 0) return abs ? '/' : '.';
  const trailing = p.endsWith('/') ? '/' : '';
  return (abs ? '/' : '') + out.join('/') + trailing;
}

/** Joins the non-empty parts with '/' and normalizes. No non-empty parts → '.'. */
export function joinPath(...parts) {
  const nonEmpty = parts.filter((x) => x !== '');
  if (nonEmpty.length === 0) return '.';
  return normalizePath(nonEmpty.join('/'));
}

/** Last segment of the normalized path ('' for '/'). */
export function basename(p) {
  const n = normalizePath(p).replace(/\/$/, '');
  return n.slice(n.lastIndexOf('/') + 1);
}

/** Extension of the basename from the last '.', including the dot; '' if there is none or if the name starts with '.'. */
export function extname(p) {
  const b = basename(p);
  const i = b.lastIndexOf('.');
  return i > 0 ? b.slice(i) : '';
}
