/**
 * Formato de telemetria compacta (NTEL v1) — constantes e utilitários comuns
 * ao escritor e ao leitor.
 *
 * Um pacote NTEL v1 é:
 *   MAGIC (1 byte) | VERSION (1 byte) | droneId (uvarint) | n (uvarint) | n leituras
 * Cada leitura é: campo de tempo | altitude (svarint, em decímetros).
 */

export const MAGIC = 0x4e;
export const VERSION = 1;

/** Maior inteiro aceito por uvarint (inteiros seguros do JavaScript). */
export const MAX_UVARINT = Number.MAX_SAFE_INTEGER;

/** Mapeia inteiro com sinal para sem sinal: 0→0, -1→1, 1→2, -2→3, 2→4, … */
export function zigzag(n) {
  if (!Number.isSafeInteger(n)) throw new RangeError(`inteiro inválido: ${n}`);
  return n >= 0 ? n * 2 : -n * 2 - 1;
}

/** Inversa de `zigzag`. */
export function unzigzag(z) {
  if (!Number.isSafeInteger(z) || z < 0) throw new RangeError(`zigzag inválido: ${z}`);
  return z % 2 === 0 ? z / 2 : -(z + 1) / 2;
}

/** Converte metros (número) em decímetros inteiros, arredondando ao mais próximo. */
export function metersToDm(m) {
  if (typeof m !== 'number' || !Number.isFinite(m)) throw new TypeError(`altitude inválida: ${m}`);
  return Math.round(m * 10);
}

/** Converte decímetros inteiros em metros. */
export function dmToMeters(dm) {
  return dm / 10;
}

/** Bytes → string hexadecimal minúscula separada por espaços ("4e 01 07"). */
export function toHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(' ');
}

/** String hexadecimal (espaços opcionais) → Uint8Array. */
export function fromHex(hex) {
  const clean = String(hex).replace(/\s+/g, '');
  if (clean.length % 2 !== 0 || /[^0-9a-fA-F]/.test(clean)) throw new SyntaxError(`hex inválido: ${hex}`);
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}
