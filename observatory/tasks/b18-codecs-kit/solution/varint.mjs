/**
 * Varints LEB128 sem sinal (até 64 bits) e ZigZag para inteiros com sinal.
 */

const MAX_U64 = (1n << 64n) - 1n;
const MIN_I64 = -(1n << 63n);
const MAX_I64 = (1n << 63n) - 1n;

function toBigInt(value) {
  if (typeof value === 'bigint') return value;
  if (Number.isSafeInteger(value)) return BigInt(value);
  throw new RangeError(`valor inválido: ${value}`);
}

/** Codifica um inteiro sem sinal (number seguro ou bigint em 0..2^64-1). */
export function encodeVarint(value) {
  let v = toBigInt(value);
  if (v < 0n || v > MAX_U64) throw new RangeError(`fora de 0..2^64-1: ${value}`);
  const out = [];
  do {
    let byte = Number(v & 0x7fn);
    v >>= 7n;
    if (v > 0n) byte |= 0x80;
    out.push(byte);
  } while (v > 0n);
  return Uint8Array.from(out);
}

/** Decodifica um varint a partir de `offset`: `{ value: bigint, length }`. */
export function decodeVarint(bytes, offset = 0) {
  if (!(bytes instanceof Uint8Array) && !Array.isArray(bytes)) throw new TypeError('esperado Uint8Array ou array');
  if (!Number.isInteger(offset) || offset < 0 || offset > bytes.length) throw new RangeError(`offset inválido: ${offset}`);
  let value = 0n;
  let shift = 0n;
  for (let i = offset; ; i++) {
    if (i >= bytes.length) throw new RangeError('varint truncado');
    const b = bytes[i];
    if (i - offset === 9 && b > 1) throw new RangeError('varint excede 64 bits');
    value |= BigInt(b & 0x7f) << shift;
    if ((b & 0x80) === 0) {
      if (b === 0 && i > offset) throw new RangeError('varint não-mínimo');
      return { value, length: i - offset + 1 };
    }
    shift += 7n;
  }
}

/** Decodifica uma sequência de varints que ocupa `bytes` inteiro. */
export function decodeAll(bytes) {
  const out = [];
  let pos = 0;
  while (pos < bytes.length) {
    const { value, length } = decodeVarint(bytes, pos);
    out.push(value);
    pos += length;
  }
  return out;
}

export function encodeZigZag(value) {
  const n = toBigInt(value);
  if (n < MIN_I64 || n > MAX_I64) throw new RangeError(`fora do intervalo de 64 bits: ${value}`);
  return n >= 0n ? n << 1n : ((-n) << 1n) - 1n;
}

export function decodeZigZag(value) {
  const z = toBigInt(value);
  if (z < 0n || z > MAX_U64) throw new RangeError(`fora de 0..2^64-1: ${value}`);
  return (z >> 1n) ^ -(z & 1n);
}

export function encodeSigned(value) {
  return encodeVarint(encodeZigZag(value));
}

export function decodeSigned(bytes, offset = 0) {
  const { value, length } = decodeVarint(bytes, offset);
  return { value: decodeZigZag(value), length };
}
