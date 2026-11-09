/**
 * Patches no estilo JSON Patch sobre documentos imutáveis.
 *
 * Caminhos são arrays de chaves: strings para objetos, inteiros >= 0 para
 * arrays e `'-'` (somente em `add`) para o fim de um array. O documento de
 * entrada nunca é alterado; subárvores não tocadas são compartilhadas.
 */

export class PatchError extends Error {
  constructor(message, index) {
    super(message);
    this.name = 'PatchError';
    this.index = index;
  }
}

class OpFailure extends Error {}

function isContainer(v) {
  return v !== null && typeof v === 'object';
}

function isIndex(k) {
  return Number.isInteger(k) && k >= 0;
}

function child(node, key) {
  if (Array.isArray(node)) {
    if (isIndex(key) && key < node.length) return node[key];
  } else if (isContainer(node) && typeof key === 'string' && Object.hasOwn(node, key)) {
    return node[key];
  }
  throw new OpFailure(`caminho inexistente em ${JSON.stringify(key)}`);
}

function valueAt(doc, path) {
  let cur = doc;
  for (const key of path) cur = child(cur, key);
  return cur;
}

/** Copia apenas os nós do caminho; `edit(pai, chave)` produz o novo pai. */
function withParent(node, path, depth, edit) {
  const key = path[depth];
  if (depth === path.length - 1) return edit(node, key);
  const updated = withParent(child(node, key), path, depth + 1, edit);
  if (Array.isArray(node)) {
    const copy = node.slice();
    copy[key] = updated;
    return copy;
  }
  return { ...node, [key]: updated };
}

function addEdit(value) {
  return (parent, key) => {
    if (Array.isArray(parent)) {
      const at = key === '-' ? parent.length : key;
      if (!isIndex(at) || at > parent.length) throw new OpFailure(`índice inválido para add: ${key}`);
      const copy = parent.slice();
      copy.splice(at, 0, value);
      return copy;
    }
    if (isContainer(parent) && typeof key === 'string') return { ...parent, [key]: value };
    throw new OpFailure('destino de add não é um contêiner');
  };
}

function removeEdit(parent, key) {
  child(parent, key);
  if (Array.isArray(parent)) {
    parent.splice(key, 1);
    return parent.slice();
  }
  const copy = { ...parent };
  delete copy[key];
  return copy;
}

function replaceEdit(value) {
  return (parent, key) => {
    child(parent, key);
    if (Array.isArray(parent)) {
      const copy = parent.slice();
      copy[key] = value;
      return copy;
    }
    return { ...parent, [key]: value };
  };
}

function isProperPrefix(a, b) {
  return a.length < b.length && a.every((k, i) => k === b[i]);
}

/** Igualdade estrutural de valores JSON (ordem das chaves é irrelevante). */
export function deepEqual(a, b) {
  if (a === b) return true;
  if (!isContainer(a) || !isContainer(b)) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.hasOwn(b, k) && deepEqual(a[k], b[k]));
}

function applyOp(doc, op) {
  if (!isContainer(op) || !Array.isArray(op.path)) throw new OpFailure('operação malformada');
  const { path } = op;
  switch (op.op) {
    case 'add':
      return path.length === 0 ? op.value : withParent(doc, path, 0, addEdit(op.value));
    case 'remove':
      if (path.length === 0) throw new OpFailure('não é possível remover a raiz');
      return withParent(doc, path, 0, removeEdit);
    case 'replace':
      if (path.length === 0) return op.value;
      return withParent(doc, path, 0, replaceEdit(op.value));
    case 'move': {
      if (!Array.isArray(op.from)) throw new OpFailure('move exige from');
      if (isProperPrefix(op.from, path)) throw new OpFailure('não é possível mover um valor para dentro dele mesmo');
      const value = valueAt(doc, op.from);
      const removed = applyOp(doc, { op: 'remove', path: op.from });
      return applyOp(removed, { op: 'add', path, value });
    }
    case 'copy': {
      if (!Array.isArray(op.from)) throw new OpFailure('copy exige from');
      return applyOp(doc, { op: 'add', path, value: valueAt(doc, op.from) });
    }
    case 'test':
      if (!deepEqual(valueAt(doc, path), op.value)) throw new OpFailure('test falhou');
      return doc;
    default:
      throw new OpFailure(`operação desconhecida: ${op.op}`);
  }
}

/** Aplica `ops` em ordem e devolve o novo documento. */
export function applyPatch(doc, ops) {
  if (!Array.isArray(ops)) throw new TypeError('ops deve ser um array');
  let cur = doc;
  for (let i = 0; i < ops.length; i++) {
    try {
      cur = applyOp(cur, ops[i]);
    } catch (e) {
      if (e instanceof OpFailure) throw new PatchError(e.message, i);
      throw e;
    }
  }
  return cur;
}

/** Valor em `path`, ou `fallback` se o caminho não existir. */
export function get(doc, path, fallback = undefined) {
  try {
    return valueAt(doc, path);
  } catch (e) {
    if (e instanceof OpFailure) return fallback;
    throw e;
  }
}
