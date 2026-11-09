/**
 * CRC-32 (IEEE 802.3, polinômio refletido 0xEDB88320).
 */
import { utf8Encode } from './utf8.mjs';

const TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  TABLE[n] = c >>> 0;
}

function toBytes(data) {
  if (typeof data === 'string') return utf8Encode(data);
  if (data instanceof Uint8Array || Array.isArray(data)) return data;
  throw new TypeError('esperado string, Uint8Array ou array');
}

function update(register, bytes) {
  let c = register;
  for (let i = 0; i < bytes.length; i++) c = TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return c >>> 0;
}

/** CRC-32 de `data` (strings em UTF-8), como inteiro sem sinal. */
export function crc32(data) {
  return (update(0xffffffff, toBytes(data)) ^ 0xffffffff) >>> 0;
}

/** Continua um CRC: `crc32Continue(crc32(a), b) === crc32(a ++ b)`. */
export function crc32Continue(previous, data) {
  if (!Number.isInteger(previous) || previous < 0 || previous > 0xffffffff) throw new RangeError(`crc anterior inválido: ${previous}`);
  return (update((previous ^ 0xffffffff) >>> 0, toBytes(data)) ^ 0xffffffff) >>> 0;
}

/** 8 dígitos hexadecimais minúsculos. */
export function crcHex(crc) {
  return crc.toString(16).padStart(8, '0');
}
