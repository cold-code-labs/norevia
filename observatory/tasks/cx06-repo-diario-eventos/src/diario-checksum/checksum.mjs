/**
 * Utilitários de integridade do diário NVJ1: codificação UTF-8, Adler-32 e
 * formatação hexadecimal.
 */

const MOD_ADLER = 65521;
const encoder = new TextEncoder();

/** Codifica uma string em UTF-8. */
export function utf8(str) {
  if (typeof str !== 'string') throw new TypeError('esperava string');
  return encoder.encode(str);
}

/** Número de bytes da string quando codificada em UTF-8. */
export function utf8Length(str) {
  return utf8(str).length;
}

/**
 * Adler-32 (RFC 1950) de uma sequência de bytes ou de uma string (que é
 * codificada em UTF-8 antes). Devolve um inteiro sem sinal de 32 bits.
 * @param {Uint8Array|string} input
 * @returns {number}
 */
export function adler32(input) {
  const bytes = typeof input === 'string' ? utf8(input) : input;
  if (!(bytes instanceof Uint8Array)) throw new TypeError('esperava Uint8Array ou string');
  let a = 1;
  let b = 0;
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]) % MOD_ADLER;
    b = (b + a) % MOD_ADLER;
  }
  return (b * 65536 + a) >>> 0;
}

/** Inteiro sem sinal de 32 bits → 8 dígitos hexadecimais minúsculos. */
export function hex8(n) {
  return (n >>> 0).toString(16).padStart(8, '0');
}

/** Checksum textual (8 dígitos hex) de uma string. */
export function checksumHex(str) {
  return hex8(adler32(str));
}
