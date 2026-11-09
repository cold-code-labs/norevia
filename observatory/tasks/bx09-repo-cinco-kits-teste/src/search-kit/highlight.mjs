/**
 * Destaque de trechos encontrados: intervalos semiabertos [início, fim) em
 * unidades UTF-16, mesclagem e renderização com escape HTML.
 */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

/**
 * Ordena e mescla intervalos que se sobrepõem ou se tocam. Intervalos vazios
 * são descartados. Não altera a entrada.
 */
export function mergeRanges(ranges) {
  const list = [];
  for (const r of ranges) {
    if (!Array.isArray(r) || r.length !== 2) throw new TypeError('intervalo deve ser [início, fim]');
    const [s, e] = r;
    if (!Number.isInteger(s) || !Number.isInteger(e) || s < 0 || e < s) {
      throw new RangeError(`intervalo inválido: [${s}, ${e}]`);
    }
    if (s !== e) list.push([s, e]);
  }
  list.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const out = [];
  for (const [s, e] of list) {
    const last = out[out.length - 1];
    if (last && s < last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}

/**
 * Ocorrências de cada termo (sem distinção de maiúsculas) em `text`. Para um
 * mesmo termo, as ocorrências não se sobrepõem (a busca recomeça no fim da
 * anterior). Termos vazios são ignorados. Resultado ordenado por início e fim.
 */
export function findMatches(text, terms) {
  const hay = text.toLowerCase();
  const out = [];
  for (const term of terms) {
    const needle = term.toLowerCase();
    if (needle === '') continue;
    for (let i = hay.indexOf(needle); i !== -1; i = hay.indexOf(needle, i + needle.length)) {
      out.push([i, i + needle.length]);
    }
  }
  return out.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

/** Envolve os intervalos mesclados com `open`/`close`; o texto é escapado, os marcadores não. */
export function highlight(text, ranges, { open = '<mark>', close = '</mark>' } = {}) {
  const merged = mergeRanges(ranges);
  if (merged.length && merged[merged.length - 1][1] > text.length) {
    throw new RangeError('intervalo além do fim do texto');
  }
  let out = '';
  let pos = 0;
  for (const [s, e] of merged) {
    out += escapeHtml(text.slice(pos, s)) + open + escapeHtml(text.slice(s, e)) + close;
    pos = e;
  }
  return out + escapeHtml(text.slice(pos));
}

/**
 * Trecho em torno da primeira ocorrência: janela [max(0, s − radius),
 * min(len, e + radius)), destacada e com `ellipsis` onde o texto foi cortado.
 */
export function snippet(text, terms, { radius = 20, ellipsis = '…', open, close } = {}) {
  const matches = findMatches(text, terms);
  if (!matches.length) {
    const cut = text.slice(0, 2 * radius);
    return escapeHtml(cut) + (cut.length < text.length ? ellipsis : '');
  }
  const [s, e] = matches[0];
  const from = Math.max(0, s - radius);
  const to = Math.min(text.length, e + radius);
  const local = [];
  for (const [a, b] of matches) {
    const x = Math.max(a, from);
    const y = Math.min(b, to);
    if (x < y) local.push([x - from, y - from]);
  }
  const body = highlight(text.slice(from, to), local, { open, close });
  return (from > 0 ? ellipsis : '') + body + (to < text.length ? ellipsis : '');
}
