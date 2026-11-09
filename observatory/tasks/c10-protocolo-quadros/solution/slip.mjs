/**
 * Enquadramento no estilo SLIP: cada quadro vai entre dois bytes END e os
 * bytes END/ESC do conteúdo são escapados.
 */

export const END = 0xc0;
export const ESC = 0xdb;
export const ESC_END = 0xdc;
export const ESC_ESC = 0xdd;

/** Concatena arrays de bytes (Uint8Array ou arrays de números). */
export function concatBytes(parts) {
  let n = 0;
  for (const p of parts) n += p.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** Bytes → texto hexadecimal minúsculo separado por espaços ('c0 61 c0'). */
export function toHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(' ');
}

/** Inverso de `toHex` (aceita qualquer quantidade de espaços). */
export function fromHex(text) {
  if (typeof text !== 'string') throw new TypeError('fromHex: esperado string');
  const parts = text.trim() === '' ? [] : text.trim().split(/\s+/);
  return Uint8Array.from(parts, (h) => {
    if (!/^[0-9a-fA-F]{2}$/.test(h)) throw new RangeError(`fromHex: byte inválido ${JSON.stringify(h)}`);
    return parseInt(h, 16);
  });
}

/** Escapa os bytes END e ESC do conteúdo. */
export function stuff(bytes) {
  const out = [];
  for (const b of bytes) {
    if (b === END) out.push(ESC, ESC_END);
    else if (b === ESC) out.push(ESC, ESC_ESC);
    else out.push(b);
  }
  return Uint8Array.from(out);
}

/** Inverso de `stuff`; sequência de escape inválida → RangeError. */
export function unstuff(bytes) {
  const out = [];
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === END) throw new RangeError(`END cru na posição ${i}`);
    if (b !== ESC) {
      out.push(b);
      continue;
    }
    const next = bytes[i + 1];
    if (next === ESC_END) out.push(END);
    else if (next === ESC_ESC) out.push(ESC);
    else throw new RangeError(`escape inválido na posição ${i}`);
    i++;
  }
  return Uint8Array.from(out);
}

/**
 * Separa um fluxo de bytes (entregue em pedaços arbitrários) em quadros.
 */
export class FrameSplitter {
  constructor() {
    this.synced = false;
    this.buf = new Uint8Array(64);
    this.len = 0;
    this.discarded = 0;
  }

  append(b) {
    if (this.len === this.buf.length) {
      const bigger = new Uint8Array(this.buf.length * 2);
      bigger.set(this.buf);
      this.buf = bigger;
    }
    this.buf[this.len++] = b;
  }

  push(chunk) {
    const frames = [];
    for (const b of chunk) {
      if (b === END) {
        if (this.synced && this.len > 0) frames.push(this.buf.slice(0, this.len));
        this.len = 0;
        this.synced = true;
      } else if (this.synced) {
        this.append(b);
      } else {
        this.discarded++;
      }
    }
    return frames;
  }

  get pending() {
    return this.len;
  }
}
