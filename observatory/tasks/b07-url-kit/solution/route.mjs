/**
 * Route matching in the style '/users/:id/posts/*'.
 */

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeDecode(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * compileRoute(pattern) → { names, match(path) }
 *  - pattern starts with '/' (otherwise SyntaxError);
 *  - ':name' captures a non-empty stretch without '/'; '*' at the END captures the rest (parameter '*');
 *  - everything else in the pattern is literal and case-sensitive;
 *  - one trailing slash in the path is tolerated;
 *  - match returns { name: decodedValue } or null.
 */
export function compileRoute(pattern) {
  if (!pattern.startsWith('/')) throw new SyntaxError('pattern must start with /');
  const names = [];
  let src = '';
  let last = 0;
  for (const m of pattern.matchAll(/:([A-Za-z_][A-Za-z0-9_]*)|\*$/g)) {
    src += escapeRegex(pattern.slice(last, m.index));
    if (m[0] === '*') {
      names.push('*');
      src += '(.*)';
    } else {
      names.push(m[1]);
      src += '([^/]+?)';
    }
    last = m.index + m[0].length;
  }
  src += escapeRegex(pattern.slice(last));
  const re = new RegExp(`^${src.replace(/\/$/, '')}/?$`);
  return {
    names,
    match(path) {
      const m = re.exec(path);
      if (!m) return null;
      const params = {};
      names.forEach((n, i) => {
        params[n] = safeDecode(m[i + 1]);
      });
      return params;
    },
  };
}

/** Simple router: the first registered route that matches wins. */
export function createRouter() {
  const routes = [];
  return {
    add(pattern, handler) {
      routes.push({ route: compileRoute(pattern), handler });
      return this;
    },
    resolve(path) {
      for (const { route, handler } of routes) {
        const params = route.match(path);
        if (params) return { handler, params };
      }
      return null;
    },
  };
}
