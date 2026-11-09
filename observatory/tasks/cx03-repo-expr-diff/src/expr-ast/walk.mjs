/**
 * Percurso pós-ordem iterativo (sem recursão) sobre a AST de expressões.
 */

const TYPES = new Set(['num', 'var', 'neg', 'bin']);

function check(node) {
  if (!node || typeof node !== 'object' || !TYPES.has(node.type)) {
    throw new TypeError(`nó inválido: ${JSON.stringify(node)}`);
  }
}

/**
 * Reduz a árvore de baixo para cima. `handlers` tem as funções
 *   num(node), var(node), neg(node, argResult), bin(node, leftResult, rightResult)
 * e cada uma devolve o resultado do nó. Os filhos são visitados da esquerda
 * para a direita. Suporta árvores muito profundas (não usa a pilha de chamadas).
 */
export function fold(root, handlers) {
  const values = [];
  const work = [{ node: root, done: false }];
  while (work.length) {
    const item = work.pop();
    const n = item.node;
    check(n);
    if (n.type === 'num') values.push(handlers.num(n));
    else if (n.type === 'var') values.push(handlers.var(n));
    else if (!item.done) {
      work.push({ node: n, done: true });
      if (n.type === 'neg') work.push({ node: n.arg, done: false });
      else {
        work.push({ node: n.right, done: false });
        work.push({ node: n.left, done: false });
      }
    } else if (n.type === 'neg') {
      values.push(handlers.neg(n, values.pop()));
    } else {
      const left = values.pop();
      const right = values.pop();
      values.push(handlers.bin(n, left, right));
    }
  }
  return values.pop();
}

/** Número de nós da árvore. */
export function size(root) {
  return fold(root, {
    num: () => 1,
    var: () => 1,
    neg: (_, a) => a + 1,
    bin: (_, l, r) => l + r + 1,
  });
}

/** Nomes das variáveis, sem repetição, na ordem da primeira ocorrência (esquerda → direita). */
export function variables(root) {
  const merge = (a, b) => [...a, ...b.filter((x) => !a.includes(x))];
  return fold(root, {
    num: () => [],
    var: (n) => [n.name],
    neg: (_, a) => a,
    bin: (_, l, r) => merge(l, r),
  });
}
