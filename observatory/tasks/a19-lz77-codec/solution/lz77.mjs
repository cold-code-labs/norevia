/**
 * Codec LZ77 orientado a bytes com análise gulosa e formato de tokens em varints.
 *
 * Formato do fluxo comprimido:
 *   varint(tamanho original) seguido de tokens até reconstituir o tamanho original.
 *   Token = varint(t):
 *     t par   → sequência de (t / 2) + 1 bytes literais, copiados em seguida;
 *     t ímpar → cópia de comprimento (t - 1) / 2 + MIN_MATCH, seguida de varint(distância - 1).
 */

export const WINDOW = 4096;
export const MIN_MATCH = 3;
export const MAX_MATCH = 258;
const VARINT_MAX = 0xffffffff;

function assertBytes(value, what) {
  if (!(value instanceof Uint8Array)) throw new TypeError(`${what} deve ser Uint8Array`);
}

/** Varint LEB128 sem sinal: 7 bits por byte, grupo menos significativo primeiro. */
export function encodeVarint(n) {
  if (!Number.isInteger(n) || n < 0 || n > VARINT_MAX) throw new RangeError(`varint fora do intervalo: ${n}`);
  const out = [];
  while (n >= 0x80) {
    out.push((n % 0x80) | 0x80);
    n = Math.floor(n / 0x80);
  }
  out.push(n);
  return Uint8Array.from(out);
}

/** Lê um varint em `bytes[pos]`; devolve `{ value, next }`. */
export function decodeVarint(bytes, pos = 0) {
  assertBytes(bytes, 'bytes');
  if (!Number.isInteger(pos) || pos < 0) throw new RangeError(`posição inválida: ${pos}`);
  let value = 0;
  let scale = 1;
  for (let k = 0; k < 5; k++) {
    if (pos + k >= bytes.length) throw new RangeError('varint truncado');
    const b = bytes[pos + k];
    value += (b & 0x7f) * scale;
    scale *= 0x80;
    if (b < 0x80) {
      if (k > 0 && b === 0) throw new RangeError('varint não mínimo');
      if (value > VARINT_MAX) throw new RangeError('varint excede 32 bits');
      return { value, next: pos + k + 1 };
    }
  }
  throw new RangeError('varint longo demais');
}

function key3(input, p) {
  return (input[p] << 16) | (input[p + 1] << 8) | input[p + 2];
}

/**
 * Índice de posições anteriores agrupadas pelos 3 bytes iniciais. `head` guarda a posição
 * mais recente de cada chave e `prev[p]` a posição anterior com a mesma chave que `p`.
 */
function createIndex(input) {
  const head = new Map();
  const prev = new Int32Array(input.length).fill(-1);
  const insert = (p) => {
    if (p + MIN_MATCH > input.length) return;
    const k = key3(input, p);
    const h = head.get(k);
    if (h !== undefined) prev[p] = h;
    head.set(k, p);
  };
  return { head, prev, insert };
}

function longestMatch(input, i, index) {
  const n = input.length;
  const maxLen = Math.min(MAX_MATCH, n - i);
  if (maxLen < MIN_MATCH) return null;
  let j = index.head.get(key3(input, i));
  let bestLen = 0;
  let bestDist = 0;
  while (j !== undefined && j >= 0 && i - j <= WINDOW) {
    let len = 0;
    while (len < maxLen && input[j + len] === input[i + len]) len++;
    if (len > bestLen) {
      bestLen = len;
      bestDist = i - j;
      if (len === maxLen) break;
    }
    j = index.prev[j];
  }
  return bestLen >= MIN_MATCH ? { len: bestLen, dist: bestDist } : null;
}

/**
 * Análise gulosa: em cada posição, a cópia mais longa (empate → menor distância) dentre as
 * distâncias 1..WINDOW; se ela tem menos de MIN_MATCH bytes, emite um literal.
 */
export function tokenize(input) {
  assertBytes(input, 'input');
  const index = createIndex(input);
  const tokens = [];
  let i = 0;
  let indexed = 0;
  while (i < input.length) {
    while (indexed < i) {
      index.insert(indexed);
      indexed++;
    }
    const m = longestMatch(input, i, index);
    if (m) {
      tokens.push({ type: 'match', len: m.len, dist: m.dist });
      i += m.len;
    } else {
      tokens.push({ type: 'lit', byte: input[i] });
      i++;
    }
  }
  return tokens;
}

function pushBytes(out, bytes) {
  for (const b of bytes) out.push(b);
}

/** Serializa tokens no formato do fluxo, agrupando literais consecutivos numa só sequência. */
export function serialize(tokens, originalLength) {
  if (!Array.isArray(tokens)) throw new TypeError('tokens deve ser um array');
  const out = [];
  pushBytes(out, encodeVarint(originalLength));
  let run = [];
  const flush = () => {
    if (!run.length) return;
    pushBytes(out, encodeVarint((run.length - 1) * 2));
    pushBytes(out, run);
    run = [];
  };
  for (const tok of tokens) {
    if (tok.type === 'lit') {
      run.push(tok.byte);
    } else {
      flush();
      pushBytes(out, encodeVarint((tok.len - MIN_MATCH) * 2 + 1));
      pushBytes(out, encodeVarint(tok.dist - 1));
    }
  }
  flush();
  return Uint8Array.from(out);
}

/** Comprime `input` (Uint8Array). */
export function compress(input) {
  assertBytes(input, 'input');
  return serialize(tokenize(input), input.length);
}

/**
 * Lê o fluxo token a token, validando-o. Produz primeiro `{ type: 'header', length }` e
 * depois um token por literal (`{ type: 'lit', byte }`) ou cópia (`{ type: 'match', len, dist }`).
 */
function* readStream(data) {
  assertBytes(data, 'data');
  const header = decodeVarint(data, 0);
  const n = header.value;
  let p = header.next;
  let pos = 0;
  yield { type: 'header', length: n };
  while (pos < n) {
    const tag = decodeVarint(data, p);
    p = tag.next;
    if (tag.value % 2 === 0) {
      const count = tag.value / 2 + 1;
      if (pos + count > n) throw new RangeError('literais excedem o tamanho declarado');
      if (p + count > data.length) throw new RangeError('literais truncados');
      for (let k = 0; k < count; k++) yield { type: 'lit', byte: data[p + k] };
      p += count;
      pos += count;
    } else {
      const len = (tag.value - 1) / 2 + MIN_MATCH;
      const d = decodeVarint(data, p);
      p = d.next;
      const dist = d.value + 1;
      if (dist > pos) throw new RangeError(`distância ${dist} antes do início`);
      if (pos + len > n) throw new RangeError('cópia excede o tamanho declarado');
      yield { type: 'match', len, dist };
      pos += len;
    }
  }
  if (p !== data.length) throw new RangeError('bytes sobrando após o fluxo');
}

/** Descomprime um fluxo produzido por `compress` (ou qualquer fluxo válido do formato). */
export function decompress(data) {
  const out = [];
  for (const tok of readStream(data)) {
    if (tok.type === 'lit') {
      out.push(tok.byte);
    } else if (tok.type === 'match') {
      const from = out.length - tok.dist;
      for (let k = 0; k < tok.len; k++) out.push(out[from + k]);
    }
  }
  return Uint8Array.from(out);
}

/** Tokens de um fluxo, sem reconstruir os dados: `{ length, tokens }` (literais individuais). */
export function decodeTokens(data) {
  const tokens = [];
  let length = 0;
  for (const tok of readStream(data)) {
    if (tok.type === 'header') length = tok.length;
    else tokens.push(tok);
  }
  return { length, tokens };
}

/** Representação textual de tokens: literal ASCII imprimível como o caractere, senão `\xNN`; cópia como `<len,dist>`. */
export function formatTokens(tokens) {
  return tokens
    .map((t) => {
      if (t.type === 'match') return `<${t.len},${t.dist}>`;
      return t.byte >= 0x21 && t.byte <= 0x7e ? String.fromCharCode(t.byte) : `\\x${t.byte.toString(16).padStart(2, '0')}`;
    })
    .join(' ');
}

/** Bytes → hexadecimal minúsculo sem separadores. */
export function toHex(bytes) {
  assertBytes(bytes, 'bytes');
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
}

/** Hexadecimal (pares de dígitos, maiúsculas ou minúsculas, espaços ignorados) → bytes. */
export function fromHex(text) {
  if (typeof text !== 'string') throw new TypeError('fromHex espera string');
  const clean = text.replace(/\s+/g, '');
  if (clean.length % 2 !== 0 || /[^0-9a-f]/i.test(clean)) throw new RangeError('hexadecimal inválido');
  const out = new Uint8Array(clean.length / 2);
  for (let k = 0; k < out.length; k++) out[k] = parseInt(clean.slice(2 * k, 2 * k + 2), 16);
  return out;
}

/** Comprime o texto em UTF-8. */
export function compressText(text) {
  if (typeof text !== 'string') throw new TypeError('compressText espera string');
  return compress(new TextEncoder().encode(text));
}

/** Descomprime e decodifica UTF-8. */
export function decompressText(data) {
  return new TextDecoder().decode(decompress(data));
}

/** Estatísticas da análise: nº de literais, nº de cópias, bytes cobertos por cópias e tamanho comprimido. */
export function stats(input) {
  const tokens = tokenize(input);
  let literals = 0;
  let matches = 0;
  let copied = 0;
  for (const t of tokens) {
    if (t.type === 'lit') literals++;
    else {
      matches++;
      copied += t.len;
    }
  }
  return { literals, matches, copied, compressedSize: serialize(tokens, input.length).length };
}
