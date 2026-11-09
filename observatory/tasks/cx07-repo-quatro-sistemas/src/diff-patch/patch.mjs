/**
 * Aplicação e inversão de hunks.
 */
import { splitLines, joinLines } from './diff.mjs';

export class PatchError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PatchError';
  }
}

function tally(h) {
  let o = 0;
  let n = 0;
  for (const line of h.lines) {
    const tag = line[0];
    if (tag === ' ') { o++; n++; }
    else if (tag === '-') o++;
    else if (tag === '+') n++;
    else throw new PatchError(`marcação inválida: ${JSON.stringify(line)}`);
  }
  if (o !== h.oldLines || n !== h.newLines) throw new PatchError('contagens do cabeçalho não conferem com as linhas');
}

/**
 * Aplica `hunks` (em ordem crescente, sem sobreposição) a `text`, conferindo
 * cada linha de contexto/removida com o texto antigo e cada `newStart` com a
 * posição no texto resultante. Qualquer divergência → PatchError.
 * Devolve o novo texto (linhas terminadas em '\n').
 */
export function applyPatch(text, hunks) {
  const src = splitLines(text);
  const out = [];
  let cursor = 0;
  for (const h of hunks) {
    tally(h);
    const pos = h.oldStart - 1;
    if (pos < cursor) throw new PatchError(`hunk fora de ordem ou sobreposto em -${h.oldStart}`);
    if (pos + h.oldLines > src.length) throw new PatchError(`hunk além do fim do texto em -${h.oldStart}`);
    for (let k = cursor; k < pos; k++) out.push(src[k]);
    const expectedNew = out.length + 1;
    if (h.newStart !== expectedNew) throw new PatchError(`+${h.newStart} não confere com a posição ${expectedNew}`);
    let k = pos;
    for (const line of h.lines) {
      const tag = line[0];
      const body = line.slice(1);
      if (tag === '+') {
        out.push(body);
        continue;
      }
      if (src[k] !== body) throw new PatchError(`contexto não confere na linha ${k + 1}`);
      if (tag === ' ') out.push(body);
      k++;
    }
    cursor = k;
  }
  for (let k = cursor; k < src.length; k++) out.push(src[k]);
  return joinLines(out);
}

/** Hunks que desfazem `hunks` (antigo ↔ novo, '-' ↔ '+'). */
export function reversePatch(hunks) {
  const flip = { ' ': ' ', '-': '+', '+': '-' };
  return hunks.map((h) => ({
    oldStart: h.newStart,
    oldLines: h.newLines,
    newStart: h.oldStart,
    newLines: h.oldLines,
    lines: h.lines.map((l) => flip[l[0]] + l.slice(1)),
  }));
}
