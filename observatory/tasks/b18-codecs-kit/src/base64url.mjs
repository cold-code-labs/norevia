/**
 * Base64url (RFC 4648 §5) sem padding.
 */
import { utf8Encode, utf8Decode } from './utf8.mjs';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const VALUE = new Map([...ALPHABET].map((ch, i) => [ch, i]));

function toByteArray(bytes) {
  if (!(bytes instanceof Uint8Array) && !Array.isArray(bytes)) throw new TypeError('esperado Uint8Array ou array de bytes');
  for (const b of bytes) if (!Number.isInteger(b) || b < 0 || b > 255) throw new RangeError(`byte inválido: ${b}`);
  return bytes;
}

export function encode(bytes) {
  const src = toByteArray(bytes);
  let out = '';
  let acc = 0;
  let bits = 0;
  for (const b of src) {
    acc = ((acc << 8) | b) & 0xffff;
    bits += 8;
    while (bits >= 6) {
      bits -= 6;
      out += ALPHABET[(acc >> bits) & 0x3f];
    }
  }
  if (bits > 0) out += ALPHABET[(acc << (6 - bits)) & 0x3f];
  return out;
}

export function decode(text) {
  if (typeof text !== 'string') throw new TypeError('decode espera string');
  const out = [];
  let acc = 0;
  let bits = 0;
  for (let i = 0; i < text.length; i++) {
    const v = VALUE.get(text[i]);
    if (v === undefined) throw new RangeError(`caractere inválido na posição ${i}: ${text[i]}`);
    acc = ((acc << 6) | v) & 0xffff;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((acc >> bits) & 0xff);
    }
  }
  if ((acc & ((1 << bits) - 1)) !== 0) throw new RangeError('bits finais não-nulos');
  return Uint8Array.from(out);
}

export function encodeText(text) {
  return encode(utf8Encode(text));
}

export function decodeText(text) {
  return utf8Decode(decode(text));
}

/** Comprimento da codificação de `n` bytes. */
export function encodedLength(n) {
  if (!Number.isInteger(n) || n < 0) throw new RangeError(`n inválido: ${n}`);
  return Math.floor(n / 3) * 4 + [0, 2, 3][n % 3];
}
