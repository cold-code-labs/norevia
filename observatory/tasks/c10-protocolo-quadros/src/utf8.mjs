/**
 * Codificação UTF-8 feita à mão (o runtime dos agentes embarcados não tem
 * TextEncoder/TextDecoder). Strings JavaScript são sequências de unidades
 * UTF-16; aqui elas são convertidas em pontos de código antes de codificar.
 */

export const REPLACEMENT = 0xfffd;

const MAX_CODE_POINT = 0x10ffff;

/** `true` se `b` é um byte de continuação (10xxxxxx). */
export function isContinuation(b) {
  return (b & 0xc0) === 0x80;
}

/** Nº de bytes UTF-8 de um ponto de código. */
export function codePointSize(cp) {
  if (cp < 0x80) return 1;
  if (cp < 0x800) return 2;
  if (cp < 0x10000) return 3;
  return 4;
}

/** Pontos de código de `str`, na ordem. */
export function* codePoints(str) {
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
      const d = str.charCodeAt(i + 1);
      if (d >= 0xd800 && d <= 0xdbff) {
        yield 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00);
        i++;
        continue;
      }
    }
    yield c;
  }
}

function assertString(str, who) {
  if (typeof str !== 'string') throw new TypeError(`${who}: esperado string`);
}

/** Tamanho em bytes de `encodeUtf8(str)`, sem alocar. */
export function utf8Length(str) {
  assertString(str, 'utf8Length');
  let n = 0;
  for (const cp of codePoints(str)) n += codePointSize(cp);
  return n;
}

/** string → Uint8Array. */
export function encodeUtf8(str) {
  assertString(str, 'encodeUtf8');
  const out = new Uint8Array(utf8Length(str));
  let o = 0;
  for (const cp of codePoints(str)) {
    if (cp < 0x80) {
      out[o++] = cp;
    } else if (cp < 0x800) {
      out[o++] = 0xc0 | (cp >> 6);
      out[o++] = 0x80 | (cp & 0x3f);
    } else if (cp < 0x10000) {
      out[o++] = 0xe0 | (cp >> 12);
      out[o++] = 0x80 | ((cp >> 6) & 0x3f);
      out[o++] = 0x80 | (cp & 0x3f);
    } else {
      out[o++] = 0xf0 | (cp >> 18);
      out[o++] = 0x80 | ((cp >> 12) & 0x3f);
      out[o++] = 0x80 | ((cp >> 6) & 0x3f);
      out[o++] = 0x80 | (cp & 0x3f);
    }
  }
  return out;
}

/** Uint8Array → string; sequência malformada → TypeError. */
export function decodeUtf8(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('decodeUtf8: esperado Uint8Array');
  const n = bytes.length;
  const fail = (at) => {
    throw new TypeError(`UTF-8 inválido no byte ${at}`);
  };
  let out = '';
  let i = 0;
  while (i < n) {
    const b0 = bytes[i];
    if (b0 < 0x80) {
      out += String.fromCharCode(b0);
      i++;
      continue;
    }
    let need;
    let cp;
    let min;
    if (b0 >= 0xc2 && b0 <= 0xdf) {
      need = 1;
      cp = b0 & 0x1f;
      min = 0x80;
    } else if (b0 >= 0xe0 && b0 <= 0xef) {
      need = 2;
      cp = b0 & 0x0f;
      min = 0x800;
    } else if (b0 >= 0xf0 && b0 <= 0xf4) {
      need = 3;
      cp = b0 & 0x07;
      min = 0x10000;
    } else {
      fail(i);
    }
    if (i + need >= n) fail(i);
    for (let k = 1; k <= need; k++) {
      const b = bytes[i + k];
      if (!isContinuation(b)) fail(i + k);
      cp = (cp << 6) | (b & 0x3f);
    }
    if (cp < min || cp > MAX_CODE_POINT) fail(i);
    out += String.fromCodePoint(cp);
    i += need + 1;
  }
  return out;
}
