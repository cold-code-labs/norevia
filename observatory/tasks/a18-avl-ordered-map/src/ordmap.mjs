/**
 * Mapa ordenado sobre árvore AVL com estatística de ordem (cada nó guarda altura e
 * tamanho da subárvore). Inserção e remoção são iterativas: o caminho da raiz até o
 * ponto alterado é guardado e depois percorrido de baixo para cima.
 */

export function defaultCompare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function node(key, value) {
  return { key, value, left: null, right: null, height: 1, size: 1 };
}

const h = (n) => (n ? n.height : 0);
const sz = (n) => (n ? n.size : 0);

function update(n) {
  n.height = Math.max(h(n.left), h(n.right)) + 1;
  n.size = sz(n.left) + sz(n.right) + 1;
}

const bal = (n) => h(n.left) - h(n.right);

function rotateRight(y) {
  const x = y.left;
  y.left = x.right;
  x.right = y;
  update(y);
  update(x);
  return x;
}

function rotateLeft(x) {
  const y = x.right;
  x.right = y.left;
  y.left = x;
  update(x);
  update(y);
  return y;
}

/** Recalcula `n` e, se desbalanceado, rotaciona. Devolve a nova raiz da subárvore. */
function rebalance(n) {
  update(n);
  const b = bal(n);
  if (b > 1) {
    const double = bal(n.left) < 0;
    if (double) n.left = rotateLeft(n.left);
    return { root: rotateRight(n), rotations: double ? 2 : 1 };
  }
  if (b < -1) {
    const double = bal(n.right) > 0;
    if (double) n.right = rotateRight(n.right);
    return { root: rotateLeft(n), rotations: double ? 2 : 1 };
  }
  return { root: n, rotations: 0 };
}

export class OrderedMap {
  #root = null;
  #cmp;
  #rotations = 0;

  constructor(compare = defaultCompare) {
    if (typeof compare !== 'function') throw new TypeError('compare deve ser função');
    this.#cmp = compare;
  }

  get size() {
    return sz(this.#root);
  }

  height() {
    return h(this.#root);
  }

  get rotations() {
    return this.#rotations;
  }

  #find(key) {
    let n = this.#root;
    while (n) {
      const c = this.#cmp(key, n.key);
      if (c === 0) return n;
      n = c < 0 ? n.left : n.right;
    }
    return null;
  }

  has(key) {
    return this.#find(key) !== null;
  }

  get(key) {
    const n = this.#find(key);
    return n ? n.value : undefined;
  }

  /** Sobe pelo caminho (do fim para a raiz) recalculando e rebalanceando. */
  #retrace(path) {
    let heightChanged = true;
    for (let i = path.length - 1; i >= 0; i--) {
      const n = path[i];
      if (!heightChanged) {
        n.size = sz(n.left) + sz(n.right) + 1;
        continue;
      }
      const before = n.height;
      const { root, rotations } = rebalance(n);
      this.#rotations += rotations;
      if (i === 0) this.#root = root;
      else if (path[i - 1].left === n) path[i - 1].left = root;
      else path[i - 1].right = root;
      heightChanged = rotations > 0 ? false : root.height !== before;
    }
  }

  set(key, value) {
    const path = [];
    let n = this.#root;
    let c = 0;
    while (n) {
      c = this.#cmp(key, n.key);
      if (c === 0) {
        n.value = value;
        return this;
      }
      path.push(n);
      n = c < 0 ? n.left : n.right;
    }
    const leaf = node(key, value);
    if (path.length === 0) {
      this.#root = leaf;
      return this;
    }
    if (c < 0) path[path.length - 1].left = leaf;
    else path[path.length - 1].right = leaf;
    this.#retrace(path);
    return this;
  }

  delete(key) {
    const path = [];
    let n = this.#root;
    while (n) {
      const c = this.#cmp(key, n.key);
      if (c === 0) break;
      path.push(n);
      n = c < 0 ? n.left : n.right;
    }
    if (!n) return false;
    if (n.left && n.right) {
      path.push(n);
      let s = n.right;
      while (s.left) {
        path.push(s);
        s = s.left;
      }
      n.key = s.key;
      n.value = s.value;
      n = s;
    }
    const child = n.left ?? n.right;
    if (path.length === 0) this.#root = child;
    else if (path[path.length - 1].left === n) path[path.length - 1].left = child;
    else path[path.length - 1].right = child;
    this.#retrace(path);
    return true;
  }

  clear() {
    this.#root = null;
  }

  // ------------------------------------------------------------ consultas ordenadas

  min() {
    let n = this.#root;
    if (!n) return undefined;
    while (n.left) n = n.left;
    return n.key;
  }

  max() {
    let n = this.#root;
    if (!n) return undefined;
    while (n.right) n = n.right;
    return n.key;
  }

  /** Maior chave < key (ou <= key se inclusive), ou undefined. */
  #below(key, inclusive) {
    let n = this.#root;
    let best;
    while (n) {
      const c = this.#cmp(n.key, key);
      if (c < 0 || (inclusive && c === 0)) {
        best = n.key;
        n = n.right;
      } else {
        n = n.left;
      }
    }
    return best;
  }

  #above(key, inclusive) {
    let n = this.#root;
    let best;
    while (n) {
      const c = this.#cmp(n.key, key);
      if (c > 0 || (inclusive && c === 0)) {
        best = n.key;
        n = n.left;
      } else {
        n = n.right;
      }
    }
    return best;
  }

  floorKey(key) {
    return this.#below(key, true);
  }

  lowerKey(key) {
    return this.#below(key, false);
  }

  ceilingKey(key) {
    return this.#above(key, true);
  }

  higherKey(key) {
    return this.#above(key, false);
  }

  /** Nº de chaves estritamente menores que `key` (ou <= se inclusive). */
  rank(key, inclusive = false) {
    let n = this.#root;
    let r = 0;
    while (n) {
      const c = this.#cmp(key, n.key);
      if (c < 0 || (c === 0 && !inclusive)) {
        n = n.left;
      } else {
        r += sz(n.left) + 1;
        if (c === 0) break;
        n = n.right;
      }
    }
    return r;
  }

  select(i) {
    if (!Number.isInteger(i) || i < 0 || i >= this.size) throw new RangeError(`índice inválido: ${i}`);
    let n = this.#root;
    for (;;) {
      const l = sz(n.left);
      if (i < l) n = n.left;
      else if (i === l) return n.key;
      else {
        i -= l + 1;
        n = n.right;
      }
    }
  }

  rangeCount(lo, hi, { loInclusive = true, hiInclusive = false } = {}) {
    const c = this.#cmp(lo, hi);
    if (c > 0) return 0;
    const upto = this.rank(hi, hiInclusive);
    const below = this.rank(lo, !loInclusive);
    return Math.max(0, upto - below);
  }

  *entries() {
    const stack = [];
    let n = this.#root;
    while (n || stack.length) {
      while (n) {
        stack.push(n);
        n = n.left;
      }
      n = stack.pop();
      yield [n.key, n.value];
      n = n.right;
    }
  }

  *keys() {
    for (const [k] of this.entries()) yield k;
  }

  [Symbol.iterator]() {
    return this.entries();
  }

  /** Estrutura da árvore: `{ key, left, right }` aninhados (null para vazio). */
  toTree() {
    const walk = (n) => (n ? { key: n.key, left: walk(n.left), right: walk(n.right) } : null);
    return walk(this.#root);
  }
}
