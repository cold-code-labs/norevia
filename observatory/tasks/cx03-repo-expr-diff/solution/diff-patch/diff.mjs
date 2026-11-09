/**
 * Diff de linhas baseado em LCS, agrupado em hunks no estilo unified diff.
 *
 * Hunk: { oldStart, oldLines, newStart, newLines, lines }
 *   - `lines`: cada item é um caractere de marcação seguido do texto da linha:
 *     ' ' contexto, '-' removida do antigo, '+' inserida no novo;
 *   - `oldLines` / `newLines`: quantas linhas do hunk existem no texto antigo
 *     (' ' e '-') / novo (' ' e '+');
 *   - `oldStart` / `newStart`: os números que aparecem no cabeçalho
 *     `@@ -oldStart,oldLines +newStart,newLines @@`.
 */

/** Texto → array de linhas. '' → []; um '\n' final não gera linha vazia extra. */
export function splitLines(text) {
  if (typeof text !== 'string') throw new TypeError('texto deve ser string');
  if (text === '') return [];
  const body = text.endsWith('\n') ? text.slice(0, -1) : text;
  return body.split('\n');
}

/** Array de linhas → texto, cada linha terminada por '\n'. */
export function joinLines(lines) {
  return lines.map((l) => l + '\n').join('');
}

/** Script de edição mínimo: [{ tag: ' '|'-'|'+', text }]. */
export function editScript(a, b) {
  const n = a.length;
  const m = b.length;
  const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ tag: ' ', text: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      ops.push({ tag: '-', text: a[i++] });
    } else {
      ops.push({ tag: '+', text: b[j++] });
    }
  }
  while (i < n) ops.push({ tag: '-', text: a[i++] });
  while (j < m) ops.push({ tag: '+', text: b[j++] });
  return ops;
}

/**
 * Hunks que transformam `oldText` em `newText`, com até `context` linhas de
 * contexto em volta de cada grupo de mudanças. Grupos separados por no máximo
 * `2 * context` linhas iguais ficam no mesmo hunk. Textos iguais → [].
 */
export function diffLines(oldText, newText, { context = 3 } = {}) {
  if (!Number.isInteger(context) || context < 0) throw new RangeError(`context inválido: ${context}`);
  const ops = editScript(splitLines(oldText), splitLines(newText));
  const changed = [];
  ops.forEach((op, k) => {
    if (op.tag !== ' ') changed.push(k);
  });
  if (!changed.length) return [];

  const groups = [];
  let first = changed[0];
  let last = changed[0];
  for (const k of changed.slice(1)) {
    if (k - last - 1 <= 2 * context) last = k;
    else {
      groups.push([first, last]);
      first = last = k;
    }
  }
  groups.push([first, last]);

  // posição (0-based) de cada op nos textos antigo e novo
  const oldIdx = [];
  const newIdx = [];
  let oi = 0;
  let ni = 0;
  for (const op of ops) {
    oldIdx.push(oi);
    newIdx.push(ni);
    if (op.tag !== '+') oi++;
    if (op.tag !== '-') ni++;
  }

  return groups.map(([s, e]) => {
    const from = Math.max(0, s - context);
    const to = Math.min(ops.length - 1, e + context);
    const slice = ops.slice(from, to + 1);
    const oldLines = slice.filter((op) => op.tag !== '+').length;
    const newLines = slice.filter((op) => op.tag !== '-').length;
    return {
      oldStart: oldLines ? oldIdx[from] + 1 : oldIdx[from],
      oldLines,
      newStart: newLines ? newIdx[from] + 1 : newIdx[from],
      newLines,
      lines: slice.map((op) => op.tag + op.text),
    };
  });
}
