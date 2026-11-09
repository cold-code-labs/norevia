/**
 * Utilidades de quebra de linha: detecção, normalização e ajustes finais.
 * Quebras reconhecidas: CRLF (`\r\n`), LF (`\n`) e CR (`\r`) isolado.
 */

const VALID = new Set(['\n', '\r\n', '\r']);
const BREAK_RE = /\r\n|\r|\n/g;

/** Conta as quebras por tipo; `\r\n` conta só como CRLF. */
export function countEols(text) {
  let crlf = 0;
  let lf = 0;
  let cr = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '\r') {
      if (text[i + 1] === '\n') {
        crlf++;
        i++;
      } else {
        cr++;
      }
    } else if (c === '\n') {
      lf++;
    }
  }
  return { crlf, lf, cr };
}

/** Quebra predominante; empates favorecem `\n`, depois `\r\n`, depois `\r`. */
export function detectEol(text) {
  const { crlf, lf, cr } = countEols(text);
  if (crlf + lf + cr === 0) return '\n';
  const ranked = [['\n', lf], ['\r\n', crlf], ['\r', cr]];
  let best = ranked[0];
  for (const entry of ranked) {
    if (entry[1] > best[1]) best = entry;
  }
  return best[0];
}

function checkEol(eol) {
  if (!VALID.has(eol)) throw new RangeError(`quebra de linha inválida: ${JSON.stringify(eol)}`);
}

/** Troca toda quebra (de qualquer tipo) por `eol`. */
export function normalizeEol(text, eol = '\n') {
  checkEol(eol);
  return text.replace(BREAK_RE, eol);
}

/** Garante que o texto termine com uma quebra; texto vazio fica vazio. */
export function ensureFinalNewline(text, eol = detectEol(text)) {
  checkEol(eol);
  if (text === '' || /[\r\n]$/.test(text)) return text;
  return text + eol;
}

/** Linhas do texto, sem as quebras; uma quebra final não gera linha vazia. */
export function splitLines(text) {
  if (text === '') return [];
  const lines = text.split(BREAK_RE);
  if (/[\r\n]$/.test(text)) lines.pop();
  return lines;
}

/** Remove espaços e tabs antes de cada quebra e no fim do texto. */
export function stripTrailingWhitespace(text) {
  return text.replace(/[ \t]+(?=\r\n|\r|\n|$)/g, '');
}
