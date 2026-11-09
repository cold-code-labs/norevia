/**
 * Formatação de hunks como texto unified diff.
 */
import { diffLines } from './diff.mjs';

/** Faixa do cabeçalho "start,count", usando a forma abreviada do formato quando cabe. */
function range(start, count) {
  return count ? `${start},${count}` : `${start}`;
}

/** Cabeçalho de um hunk: "@@ -<faixa antiga> +<faixa nova> @@". */
export function hunkHeader(h) {
  return `@@ -${range(h.oldStart, h.oldLines)} +${range(h.newStart, h.newLines)} @@`;
}

/**
 * Texto unified: "--- from", "+++ to" e, para cada hunk, o cabeçalho seguido
 * das linhas marcadas. Toda linha termina em '\n'. Sem hunks → ''.
 */
export function formatUnified(hunks, { from = 'a', to = 'b' } = {}) {
  if (!hunks.length) return '';
  let out = `--- ${from}\n+++ ${to}\n`;
  for (const h of hunks) {
    out += hunkHeader(h) + '\n';
    for (const line of h.lines) out += line + '\n';
  }
  return out;
}

/** Atalho: `formatUnified(diffLines(oldText, newText, { context }), { from, to })`. */
export function createPatch(oldText, newText, { context = 3, from = 'a', to = 'b' } = {}) {
  return formatUnified(diffLines(oldText, newText, { context }), { from, to });
}
