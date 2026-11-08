// Text, frontmatter (YAML subset) and Markdown utilities — no dependencies.
// All card content is treated as untrusted: raw HTML is escaped,
// links only accept http(s)/mailto or paths that resolve to archive cards.

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function slug(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function norm(s) {
  return slug(s);
}

// ---------------------------------------------------------------- frontmatter

export function parseFrontmatter(text) {
  const src = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const m = src.match(/^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  if (!m) return { fm: null, body: src };
  let fm;
  try {
    fm = yamlLite(m[1]);
  } catch (e) {
    fm = { __error: String(e && e.message) };
  }
  return { fm, body: src.slice(m[0].length) };
}

function stripComment(v) {
  const t = v.trim();
  if (t.startsWith('"') || t.startsWith("'")) {
    const q = t[0];
    if (t.length > 1 && t.endsWith(q)) return t; // tolerant of unescaped inner quotes
    for (let i = 1; i < t.length; i++) {
      if (q === '"' && t[i] === '\\') { i++; continue; }
      if (t[i] === q) {
        if (q === "'" && t[i + 1] === "'") { i++; continue; }
        return t.slice(0, i + 1);
      }
    }
    return t;
  }
  if (t.startsWith('[') || t.startsWith('{')) {
    // strip a comment after the closing quote
    const close = t.startsWith('[') ? ']' : '}';
    const idx = t.lastIndexOf(close);
    if (idx >= 0 && /^\s*(#.*)?$/.test(t.slice(idx + 1))) return t.slice(0, idx + 1);
    return t;
  }
  return t.replace(/\s+#.*$/, '').trim();
}

function splitFlow(inner) {
  const out = [];
  let cur = '', q = null, depth = 0;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (q) {
      cur += c;
      if (c === '\\' && q === '"') { cur += inner[++i] ?? ''; continue; }
      if (c === q) q = null;
      continue;
    }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if (c === '[' || c === '{') depth++;
    if (c === ']' || c === '}') depth--;
    if (c === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim() !== '') out.push(cur);
  return out.map((s) => s.trim()).filter((s) => s !== '');
}

export function scalar(v) {
  const t = String(v ?? '').trim();
  if (t === '') return '';
  if (t.startsWith('[') && t.endsWith(']')) return splitFlow(t.slice(1, -1)).map(scalar);
  if (t.startsWith('{') && t.endsWith('}')) {
    const o = {};
    for (const part of splitFlow(t.slice(1, -1))) {
      const m = part.match(/^("[^"]*"|'[^']*'|[^:]+):\s*(.*)$/);
      if (m) o[String(scalar(m[1]))] = scalar(m[2]);
    }
    return o;
  }
  if (t.startsWith('"') && t.endsWith('"') && t.length >= 2) {
    try { return JSON.parse(t); } catch { return t.slice(1, -1); }
  }
  if (t.startsWith("'") && t.endsWith("'") && t.length >= 2) return t.slice(1, -1).replace(/''/g, "'");
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === 'null' || t === '~') return null;
  if (/^-?\d+(\.\d+)?$/.test(t) && !/^0\d/.test(t)) return Number(t);
  return t;
}

function indentOf(l) {
  return l.match(/^ */)[0].length;
}

export function yamlLite(src) {
  const lines = src.replace(/\t/g, '  ').split('\n');
  return parseMap(lines, 0, lines.length, 0);
}

function parseMap(lines, start, end, baseIndent) {
  const obj = {};
  let i = start;
  while (i < end) {
    const line = lines[i];
    if (!line.trim() || /^\s*#/.test(line)) { i++; continue; }
    const ind = indentOf(line);
    const m = line.slice(ind).match(/^("[^"]+"|'[^']+'|[^:#][^:]*?)\s*:(?:\s+(.*)|\s*)$/);
    if (!m || ind < baseIndent) { i++; continue; }
    const key = String(scalar(m[1]));
    const rest = stripComment(m[2] ?? '');
    i++;
    // child block
    let j = i;
    while (j < end && (!lines[j].trim() || indentOf(lines[j]) > ind || (/^\s*-(\s|$)/.test(lines[j]) && indentOf(lines[j]) === ind && rest === ''))) j++;
    if (rest === '') {
      obj[key] = parseBlock(lines, i, j, ind);
      i = j;
    } else if (/^[|>][-+]?\d*$/.test(rest)) {
      const body = lines.slice(i, j);
      const minInd = Math.min(...body.filter((l) => l.trim()).map(indentOf), 1e9);
      const parts = body.map((l) => l.slice(Math.min(minInd, indentOf(l))));
      obj[key] = rest.startsWith('|')
        ? parts.join('\n').trim()
        : parts.join('\n').replace(/([^\n])\n(?=[^\n])/g, '$1 ').trim();
      i = j;
    } else {
      // value with continuation (simple multi-line text)
      let val = rest;
      const cont = lines.slice(i, j).filter((l) => l.trim());
      if (cont.length && !/^["'[{]/.test(val)) val += ' ' + cont.map((l) => l.trim()).join(' ');
      obj[key] = scalar(val);
      i = j;
    }
  }
  return obj;
}

function parseBlock(lines, start, end, parentIndent) {
  const first = lines.slice(start, end).find((l) => l.trim() && !/^\s*#/.test(l));
  if (!first) return '';
  if (/^\s*-(\s|$)/.test(first)) {
    const items = [];
    const ind = indentOf(first);
    let i = start;
    while (i < end) {
      const l = lines[i];
      if (!l.trim() || /^\s*#/.test(l)) { i++; continue; }
      const m = l.match(/^(\s*)-(?:\s+(.*)|\s*)$/);
      if (m && indentOf(l) === ind) {
        let j = i + 1;
        while (j < end && (!lines[j].trim() || indentOf(lines[j]) > ind)) j++;
        const head = stripComment(m[2] ?? '');
        const kv = head.match(/^("[^"]+"|'[^']+'|[A-Za-z0-9_\- ]+?)\s*:(\s+.*|\s*)$/);
        if (kv && !/^["']/.test(head.trim())) {
          const fake = [' '.repeat(ind + 2) + head, ...lines.slice(i + 1, j)];
          items.push(parseMap(fake, 0, fake.length, 0));
        } else if (head === '' && j > i + 1) {
          items.push(parseBlock(lines, i + 1, j, ind));
        } else {
          const cont = lines.slice(i + 1, j).filter((x) => x.trim()).map((x) => x.trim());
          items.push(scalar(cont.length && !/^["'[{]/.test(head) ? [head, ...cont].join(' ') : head));
        }
        i = j;
      } else i++;
    }
    return items;
  }
  return parseMap(lines, start, end, indentOf(first));
}

// ---------------------------------------------------------------- markdown

const SAFE_PROTO = /^(https?:|mailto:)/i;

export function linkifyRef(s) {
  // For sources: turns URLs, DOIs and arXiv ids into links.
  return inline(String(s ?? ''), {});
}

export function inline(text, ctx = {}) {
  const stash = [];
  const put = (h) => `\u0000${stash.push(h) - 1}\u0000`;
  let s = String(text ?? '');
  // code spans
  s = s.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (_, __, c) => put(`<code>${esc(c.trim())}</code>`));
  // wikilinks [[id]] / [[id|label]]
  s = s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (m, id, label) => {
    const card = ctx.resolveId?.(id.trim());
    if (card) return put(`<a class="ref" href="${esc(card.url)}">${esc(label || card.id)}</a>`);
    return put(`<span class="ref-missing" title="card does not exist yet">${esc(label || id)}</span>`);
  });
  // markdown links (images too: they become links — no external media is loaded)
  s = s.replace(/!?\[((?:[^\[\]]|\[[^\]]*\])*)\]\(\s*<?([^)\s>]+)>?(?:\s+["'][^"']*["'])?\s*\)/g, (m, label, href) => {
    const inner = emph(esc(label));
    const target = resolveHref(href, ctx);
    if (!target) return put(`<span class="ref-plain" title="${esc(href)}">${inner}</span>`);
    const ext = /^https?:/i.test(target);
    return put(`<a href="${esc(target)}"${ext ? ' rel="noopener noreferrer"' : ''}>${inner}</a>`);
  });
  // autolinks <http://...>
  s = s.replace(/<(https?:\/\/[^\s>]+)>/g, (m, u) => put(extLink(u)));
  // from here on, the text is escaped
  s = s.split(/(\u0000\d+\u0000)/).map((part) => (/^\u0000\d+\u0000$/.test(part) ? part : esc(part))).join('');
  // bare URLs
  s = s.replace(/\bhttps?:\/\/[^\s<\u0000]+/g, (u) => {
    const m = u.match(/^(.*?)([).,;:!?\]]*)$/);
    let url = m[1], trail = m[2];
    // keep balanced parentheses
    if (trail.startsWith(')') && (url.match(/\(/g) || []).length > (url.match(/\)/g) || []).length) { url += ')'; trail = trail.slice(1); }
    return put(extLink(unesc(url))) + trail;
  });
  // DOIs
  s = s.replace(/\b(?:doi:\s*|DOI:\s*)(10\.\d{4,9}\/[^\s<\u0000,;]+[^\s<\u0000,;.)])/g, (m, d) =>
    put(`<a href="https://doi.org/${esc(unesc(d))}" rel="noopener noreferrer">doi:${d}</a>`));
  // arXiv
  s = s.replace(/\barXiv:\s*(\d{4}\.\d{4,5}(?:v\d+)?)/gi, (m, a) =>
    put(`<a href="https://arxiv.org/abs/${a}" rel="noopener noreferrer">arXiv:${a}</a>`));
  // known card ids
  if (ctx.idRegex) {
    s = s.replace(ctx.idRegex, (m, pre, id) => {
      const card = ctx.resolveId(id);
      if (!card || card.id === ctx.selfId) return m;
      return pre + put(`<a class="ref" href="${esc(card.url)}" title="${esc(card.title)}">${id}</a>`);
    });
  }
  s = emph(s);
  s = s.replace(/ {2,}\n/g, '<br>\n');
  // unstash (may be nested)
  for (let k = 0; k < 4 && s.includes('\u0000'); k++) s = s.replace(/\u0000(\d+)\u0000/g, (_, n) => stash[+n]);
  return s;
}

function unesc(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function extLink(u) {
  const short = u.replace(/^https?:\/\//, '').replace(/\?utm_[^#]*$/, '');
  return `<a href="${esc(u)}" rel="noopener noreferrer">${esc(short.length > 64 ? short.slice(0, 61) + '…' : short)}</a>`;
}

function resolveHref(href, ctx) {
  if (SAFE_PROTO.test(href)) return href;
  if (href.startsWith('#')) return href;
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return null; // javascript:, data:, etc.
  if (ctx.resolvePath) return ctx.resolvePath(href);
  return null;
}

function emph(s) {
  return s
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w])__(?=\S)([\s\S]*?\S)__(?!\w)/g, '$1<strong>$2</strong>')
    .replace(/(^|[^\w*])\*(?=[^\s*])([^*\n]*?[^\s*])\*(?![\w*])/g, '$1<em>$2</em>')
    .replace(/(^|[^\w])_(?=[^\s_])([^_\n]*?[^\s_])_(?!\w)/g, '$1<em>$2</em>')
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>');
}

const RE_FENCE = /^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)/;
const RE_HEAD = /^ {0,3}(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/;
const RE_HR = /^ {0,3}([-*_])([ \t]*\1){2,}[ \t]*$/;
const RE_QUOTE = /^ {0,3}>/;
const RE_LIST = /^( *)([-*+]|\d{1,9}[.)])[ \t]+(.*)$/;
const RE_TABLE_SEP = /^ *\|? *:?-{2,}:? *(\| *:?-{2,}:? *)*\|? *$/;

export function markdown(src, ctx = {}) {
  const lines = String(src ?? '').replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n');
  const headings = [];
  const html = blocks(lines, { ...ctx, headings, usedIds: new Set() });
  return { html, headings };
}

function isBlockStart(l) {
  return RE_FENCE.test(l) || RE_HEAD.test(l) || RE_HR.test(l) || RE_QUOTE.test(l) || RE_LIST.test(l);
}

function splitRow(l) {
  let t = l.trim();
  if (t.startsWith('|')) t = t.slice(1);
  if (t.endsWith('|') && !t.endsWith('\\|')) t = t.slice(0, -1);
  const cells = [];
  let cur = '', code = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === '\\' && t[i + 1] === '|') { cur += '|'; i++; continue; }
    if (c === '`') code = !code;
    if (c === '|' && !code) { cells.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  cells.push(cur.trim());
  return cells;
}

function blocks(lines, ctx) {
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if ((m = l.match(RE_FENCE))) {
      const fence = m[1];
      const lang = m[2];
      const body = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence)) body.push(lines[i++]);
      i++;
      out.push(`<pre${lang ? ` data-lang="${esc(lang)}"` : ''}><code>${esc(body.join('\n'))}</code></pre>`);
      continue;
    }
    if ((m = l.match(RE_HEAD))) {
      const level = Math.min(6, m[1].length + 1); // the page h1 is the card title
      const text = m[2];
      let id = slug(text.replace(/[`*_]/g, '')) || 'secao';
      while (ctx.usedIds.has(id)) id += '-x';
      ctx.usedIds.add(id);
      ctx.headings.push({ level, text: text.replace(/[`*_]/g, ''), id });
      out.push(`<h${level} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">§</a>${inline(text, ctx)}</h${level}>`);
      i++;
      continue;
    }
    if (RE_HR.test(l)) { out.push('<hr>'); i++; continue; }
    if (RE_QUOTE.test(l)) {
      const body = [];
      while (i < lines.length && lines[i].trim() && (RE_QUOTE.test(lines[i]) || !isBlockStart(lines[i]))) {
        body.push(lines[i].replace(/^ {0,3}> ?/, ''));
        i++;
      }
      out.push(`<blockquote>${blocks(body, ctx)}</blockquote>`);
      continue;
    }
    if ((m = l.match(RE_LIST))) {
      const r = parseList(lines, i, ctx);
      out.push(r.html);
      i = r.next;
      continue;
    }
    if (l.includes('|') && i + 1 < lines.length && RE_TABLE_SEP.test(lines[i + 1]) && lines[i + 1].includes('-')) {
      const head = splitRow(l);
      const aligns = splitRow(lines[i + 1]).map((c) => (c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : ''));
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes('|')) rows.push(splitRow(lines[i++]));
      const al = (k) => (aligns[k] ? ` class="al-${aligns[k]}"` : '');
      out.push(
        `<div class="table-wrap" tabindex="0"><table><thead><tr>${head.map((c, k) => `<th scope="col"${al(k)}>${inline(c, ctx)}</th>`).join('')}</tr></thead><tbody>${rows
          .map((r) => `<tr>${head.map((_, k) => `<td${al(k)}>${inline(r[k] ?? '', ctx)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table></div>`
      );
      continue;
    }
    // paragraph
    const para = [];
    while (i < lines.length && lines[i].trim() && !(para.length && isBlockStart(lines[i])) && !(para.length === 0 && false)) {
      if (para.length && lines[i].includes('|') && RE_TABLE_SEP.test(lines[i + 1] || '')) break;
      para.push(lines[i].replace(/^ +/, ''));
      i++;
    }
    out.push(`<p>${inline(para.join('\n'), ctx)}</p>`);
  }
  return out.join('\n');
}

function parseList(lines, start, ctx) {
  const first = lines[start].match(RE_LIST);
  const base = first[1].length;
  const ordered = /\d/.test(first[2]);
  const startNum = ordered ? parseInt(first[2], 10) : 1;
  const items = [];
  let i = start;
  let loose = false;
  while (i < lines.length) {
    const m = lines[i].match(RE_LIST);
    if (!m || m[1].length !== base || /\d/.test(m[2]) !== ordered) break;
    const contentIndent = base + m[2].length + 1;
    const body = [m[3]];
    i++;
    let sawBlank = false;
    while (i < lines.length) {
      const l = lines[i];
      if (!l.trim()) {
        // blank line: continue only if the next one is indented
        const next = lines.slice(i + 1).find((x) => x.trim());
        if (next !== undefined && indentOf(next) >= contentIndent) { body.push(''); sawBlank = true; i++; continue; }
        break;
      }
      const ind = indentOf(l);
      if (ind >= contentIndent || (ind > base && RE_LIST.test(l))) {
        body.push(l.slice(Math.min(ind, contentIndent)));
        i++;
        continue;
      }
      if (ind <= base && (RE_LIST.test(l) || isBlockStart(l))) break;
      if (sawBlank) break;
      body.push(l.trim()); // lazy continuation
      i++;
    }
    if (sawBlank) loose = true;
    items.push(body);
    // blank lines between items
    let k = i;
    while (k < lines.length && !lines[k].trim()) k++;
    if (k > i && k < lines.length) {
      const nm = lines[k].match(RE_LIST);
      if (nm && nm[1].length === base && /\d/.test(nm[2]) === ordered) { loose = true; i = k; continue; }
    }
  }
  const tag = ordered ? 'ol' : 'ul';
  const lis = items.map((body) => {
    let task = '';
    const tm = body[0].match(/^\[([ xX])\]\s+(.*)$/);
    if (tm) {
      task = tm[1] === ' ' ? '<span class="task" aria-label="pendente">☐</span> ' : '<span class="task done" aria-label="feito">☑</span> ';
      body = [tm[2], ...body.slice(1)];
    }
    let h = blocks(body, ctx);
    if (!loose) h = h.replace(/^<p>([\s\S]*?)<\/p>/, '$1');
    return `<li${task ? ' class="task-item"' : ''}>${task}${h}</li>`;
  });
  return { html: `<${tag}${ordered && startNum !== 1 ? ` start="${startNum}"` : ''}>${lis.join('')}</${tag}>`, next: i };
}

export function plain(md, max = 220) {
  const t = String(md ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return t.length > max ? t.slice(0, max - 1).replace(/\s+\S*$/, '') + '…' : t;
}
