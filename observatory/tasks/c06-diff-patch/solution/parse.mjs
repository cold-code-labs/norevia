/**
 * Leitura de texto unified diff para hunks.
 */

const HEADER = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

function count(raw) {
  return raw === undefined ? 1 : Number(raw);
}

/**
 * Converte texto unified em `[{ oldStart, oldLines, newStart, newLines, lines }]`.
 * Linhas "--- " e "+++ " antes do primeiro hunk são ignoradas. O corpo de cada
 * hunk tem exatamente as linhas anunciadas no cabeçalho; qualquer outra
 * estrutura → SyntaxError.
 */
export function parseUnified(text) {
  if (typeof text !== 'string') throw new TypeError('texto deve ser string');
  const rows = text.split('\n');
  if (rows[rows.length - 1] === '') rows.pop();
  const hunks = [];
  let k = 0;
  while (k < rows.length && !rows[k].startsWith('@@')) {
    if (!rows[k].startsWith('--- ') && !rows[k].startsWith('+++ ')) {
      throw new SyntaxError(`linha inesperada antes do primeiro hunk: ${rows[k]}`);
    }
    k++;
  }
  while (k < rows.length) {
    const m = HEADER.exec(rows[k]);
    if (!m) throw new SyntaxError(`cabeçalho de hunk inválido: ${rows[k]}`);
    const h = { oldStart: Number(m[1]), oldLines: count(m[2]), newStart: Number(m[3]), newLines: count(m[4]), lines: [] };
    if (h.oldLines + h.newLines === 0) throw new SyntaxError(`hunk vazio: ${rows[k]}`);
    k++;
    let seenOld = 0;
    let seenNew = 0;
    while (seenOld < h.oldLines || seenNew < h.newLines) {
      if (k >= rows.length) throw new SyntaxError('hunk truncado');
      const line = rows[k];
      const tag = line[0];
      if (tag === ' ') { seenOld++; seenNew++; }
      else if (tag === '-') seenOld++;
      else if (tag === '+') seenNew++;
      else throw new SyntaxError(`linha de hunk inválida: ${line}`);
      if (seenOld > h.oldLines || seenNew > h.newLines) throw new SyntaxError('hunk maior que o cabeçalho');
      h.lines.push(line);
      k++;
    }
    hunks.push(h);
  }
  return hunks;
}
