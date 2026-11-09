/**
 * Minimalist "mustache"-style template engine.
 *
 * Supported tags:
 *   {{name}}        variable with HTML escaping
 *   {{{name}}}      variable without escaping (also `{{& name}}`)
 *   {{#name}}…{{/name}}   section
 *   {{^name}}…{{/name}}   inverted section
 *   {{! text }}     comment
 *   {{> name}}      partial
 *
 * The sigil (`#`, `^`, `/`, `!`, `&`, `>`) must come immediately after `{{`;
 * the name is trimmed (surrounding spaces are ignored).
 */

/** Template syntax error; `pos` is the (0-based) index in the template. */
export class TemplateError extends Error {
  constructor(message, pos) {
    super(`${message} (posição ${pos})`);
    this.name = 'TemplateError';
    this.pos = pos;
  }
}

const ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

/**
 * Escapes the six characters `& < > " ' \`` to HTML entities.
 * The value is converted with `String(value)` before escaping.
 */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"'`]/g, (ch) => ESCAPES[ch]);
}

const SIGILS = {
  '#': 'section',
  '^': 'inverted',
  '/': 'close',
  '!': 'comment',
  '&': 'raw',
  '>': 'partial',
};

/** Tag types that can occupy a "standalone" line. */
const STANDALONE_TYPES = new Set(['section', 'inverted', 'close', 'comment']);

const MAX_PARTIAL_DEPTH = 50;

/**
 * Finds all tags of the template, in order.
 * @returns {{type: string, name: string, start: number, end: number}[]}
 */
function scanTags(template) {
  const tags = [];
  let i = 0;
  for (;;) {
    const open = template.indexOf('{{', i);
    if (open === -1) break;
    let type;
    let inner;
    let end;
    if (template.startsWith('{{{', open)) {
      const close = template.indexOf('}}}', open + 3);
      if (close === -1) throw new TemplateError('tag sem fechamento', open);
      type = 'raw';
      inner = template.slice(open + 3, close);
      end = close + 3;
    } else {
      const close = template.indexOf('}}', open + 2);
      if (close === -1) throw new TemplateError('tag sem fechamento', open);
      inner = template.slice(open + 2, close);
      end = close + 2;
      type = SIGILS[inner[0]] ?? 'name';
      if (type !== 'name') inner = inner.slice(1);
    }
    const name = type === 'comment' ? '' : inner.trim();
    if (type !== 'comment' && name === '') throw new TemplateError('tag sem nome', open);
    tags.push({ type, name, start: open, end });
    i = end;
  }
  return tags;
}

/**
 * If the k-th tag is alone on its line (only spaces/tabs
 * around it), returns the range [start, end) to remove: the whole line,
 * including its line break (`\n` or `\r\n`). Otherwise returns null.
 */
function standaloneRange(template, tags, k) {
  const tag = tags[k];
  if (!STANDALONE_TYPES.has(tag.type)) return null;
  const lineStart = template.lastIndexOf('\n', tag.start - 1) + 1;
  const nl = template.indexOf('\n', tag.end);
  const lineEnd = nl === -1 ? template.length : nl;
  const prev = tags[k - 1];
  const next = tags[k + 1];
  if (prev && prev.end > lineStart) return null;
  if (next && next.start < lineEnd) return null;
  if (!/^[ \t]*$/.test(template.slice(lineStart, tag.start))) return null;
  if (!/^[ \t]*\r?$/.test(template.slice(tag.end, lineEnd))) return null;
  return [lineStart, nl === -1 ? lineEnd : nl + 1];
}

/**
 * Converts the template into a flat list of tokens (text and tags), already without the
 * standalone tag lines.
 */
export function tokenize(template) {
  if (typeof template !== 'string') throw new TypeError('template deve ser uma string');
  const tags = scanTags(template);
  const tokens = [];
  let cursor = 0;
  for (let k = 0; k < tags.length; k++) {
    const tag = tags[k];
    const range = standaloneRange(template, tags, k);
    const textEnd = range ? range[0] : tag.start;
    if (textEnd > cursor) tokens.push({ type: 'text', value: template.slice(cursor, textEnd) });
    tokens.push(tag);
    cursor = range ? range[1] : tag.end;
  }
  if (cursor < template.length) tokens.push({ type: 'text', value: template.slice(cursor) });
  return tokens;
}

/**
 * Builds the node tree. Sections opened and not closed, closings without an
 * opening and closings with a different name raise `TemplateError`.
 */
export function parse(template) {
  const tokens = tokenize(template);
  const root = { type: 'root', name: '', children: [] };
  const open = [root];
  for (const tok of tokens) {
    const parent = open[open.length - 1];
    switch (tok.type) {
      case 'section':
      case 'inverted': {
        const node = { ...tok, children: [] };
        parent.children.push(node);
        open.push(node);
        break;
      }
      case 'close':
        if (open.length === 1) {
          throw new TemplateError(`fechamento inesperado de "${tok.name}"`, tok.start);
        }
        if (parent.name !== tok.name) {
          throw new TemplateError(`esperado fechamento de "${parent.name}", encontrado "${tok.name}"`, tok.start);
        }
        open.pop();
        break;
      case 'comment':
        break;
      default:
        parent.children.push(tok);
    }
  }
  if (open.length > 1) {
    const top = open[open.length - 1];
    throw new TemplateError(`seção "${top.name}" não fechada`, top.start);
  }
  return root.children;
}

function isObjectLike(v) {
  return (typeof v === 'object' && v !== null) || typeof v === 'function';
}

/** Values that do not render sections (and do render inverted sections). */
function isEmpty(v) {
  return !v || (Array.isArray(v) && v.length === 0);
}

/**
 * Resolves a name against the context stack (the top is the last frame).
 *  - `.` is the value of the top frame;
 *  - `@index` is the index of the innermost array iteration;
 *  - `a.b.c`: the first segment is looked up from the top to the base; the
 *    others are read from the value found.
 */
function lookup(frames, name) {
  if (name === '.') return frames[frames.length - 1].value;
  if (name === '@index') {
    for (let i = frames.length - 1; i >= 0; i--) {
      if (frames[i].index !== undefined) return frames[i].index;
    }
    return undefined;
  }
  const [head, ...rest] = name.split('.');
  let value;
  for (let i = frames.length - 1; i >= 0; i--) {
    const ctx = frames[i].value;
    if (isObjectLike(ctx) && ctx[head] != null) {
      value = ctx[head];
      break;
    }
  }
  for (const seg of rest) {
    if (value == null) return undefined;
    value = value[seg];
  }
  return value;
}

function renderNodes(nodes, frames, env, depth) {
  let out = '';
  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        out += node.value;
        break;
      case 'name': {
        const v = lookup(frames, node.name);
        if (v != null) out += escapeHtml(v);
        break;
      }
      case 'raw': {
        const v = lookup(frames, node.name);
        if (v != null) out += String(v);
        break;
      }
      case 'partial': {
        if (!Object.hasOwn(env.partials, node.name)) break;
        const src = env.partials[node.name];
        if (typeof src !== 'string') break;
        if (depth >= MAX_PARTIAL_DEPTH) throw new RangeError(`parciais aninhados demais em "${node.name}"`);
        let tree = env.cache.get(node.name);
        if (!tree) {
          tree = parse(src);
          env.cache.set(node.name, tree);
        }
        out += renderNodes(tree, frames, env, depth + 1);
        break;
      }
      case 'section': {
        const v = lookup(frames, node.name);
        if (isEmpty(v)) break;
        if (Array.isArray(v)) {
          for (let index = 0; index < v.length; index++) {
            out += renderNodes(node.children, [...frames, { value: v[index], index }], env, depth);
          }
        } else {
          out += renderNodes(node.children, [...frames, { value: v }], env, depth);
        }
        break;
      }
      case 'inverted':
        if (isEmpty(lookup(frames, node.name))) out += renderNodes(node.children, frames, env, depth);
        break;
      default:
        break;
    }
  }
  return out;
}

/**
 * Compiles the template once; the returned function can be called several
 * times with different views and partials.
 */
export function compile(template) {
  const tree = parse(template);
  return (view, partials = {}) =>
    renderNodes(tree, [{ value: view }], { partials, cache: new Map() }, 0);
}

/** Renders `template` with the view `view` and the partials `partials`. */
export function render(template, view, partials = {}) {
  return compile(template)(view, partials);
}
