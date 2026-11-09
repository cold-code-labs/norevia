/**
 * Casamento de rotas no estilo '/users/:id/posts/*'.
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
 *  - pattern começa com '/' (senão SyntaxError);
 *  - ':nome' captura um trecho não vazio sem '/'; '*' no FINAL captura o resto (parâmetro '*');
 *  - todo o resto do padrão é literal e diferencia maiúsculas/minúsculas;
 *  - uma barra final no caminho é tolerada;
 *  - match devolve { nome: valorDecodificado } ou null.
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

/** Roteador simples: a primeira rota registrada que casar vence. */
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
