/**
 * Codificação UTF-8 estrita (sem dependência de TextEncoder/TextDecoder).
 */

/** String JS → bytes UTF-8. Surrogates isolados viram U+FFFD. */
export function utf8Encode(text) {
  if (typeof text !== 'string') throw new TypeError('utf8Encode espera string');
  const out = [];
  for (let i = 0; i < text.length; i++) {
    let cp = text.codePointAt(i);
    if (cp > 0xffff) i++;
    else if (cp >= 0xd800 && cp <= 0xdfff) cp = 0xfffd;
    if (cp < 0x80) out.push(cp);
    else if (cp < 0x800) out.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
    else if (cp < 0x10000) out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    else out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
  }
  return Uint8Array.from(out);
}

function sequenceInfo(b0) {
  if (b0 >= 0xc2 && b0 <= 0xdf) return { len: 2, cp: b0 & 0x1f, lo: 0x80, hi: 0xbf };
  if (b0 >= 0xe0 && b0 <= 0xef) return { len: 3, cp: b0 & 0x0f, lo: b0 === 0xe0 ? 0xa0 : 0x80, hi: b0 === 0xef ? 0x9f : 0xbf };
  if (b0 >= 0xf0 && b0 <= 0xf4) return { len: 4, cp: b0 & 0x07, lo: b0 === 0xf0 ? 0x90 : 0x80, hi: b0 === 0xf4 ? 0x8f : 0xbf };
  return null;
}

/** Bytes UTF-8 → string. Qualquer sequência malformada → RangeError (com a posição). */
export function utf8Decode(bytes) {
  if (!(bytes instanceof Uint8Array) && !Array.isArray(bytes)) throw new TypeError('utf8Decode espera Uint8Array ou array');
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i];
    if (b0 < 0x80) {
      out += String.fromCharCode(b0);
      i++;
      continue;
    }
    const info = sequenceInfo(b0);
    if (!info) throw new RangeError(`byte inicial inválido na posição ${i}`);
    let cp = info.cp;
    for (let k = 1; k < info.len; k++) {
      const b = bytes[i + k];
      if (b === undefined) throw new RangeError(`sequência truncada na posição ${i}`);
      const lo = k === 1 ? info.lo : 0x80;
      const hi = k === 1 ? info.hi : 0xbf;
      if (b < lo || b > hi) throw new RangeError(`byte de continuação inválido na posição ${i + k}`);
      cp = (cp << 6) | (b & 0x3f);
    }
    out += String.fromCodePoint(cp);
    i += info.len;
  }
  return out;
}

/** Nº de bytes que `text` ocupa em UTF-8. */
export function utf8Length(text) {
  return utf8Encode(text).length;
}
