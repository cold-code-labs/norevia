/**
 * Emissor: fragmenta mensagens de texto em quadros numerados.
 */
import { encodeUtf8 } from './utf8.mjs';
import { encodeFrame, SEQ_MAX } from './frame.mjs';
import { concatBytes } from './slip.mjs';

function assertSeq(seq, who) {
  if (!Number.isInteger(seq) || seq < 0 || seq > SEQ_MAX) throw new RangeError(`${who}: seq inválido ${seq}`);
}

/** Payloads (Uint8Array) dos fragmentos de `text`. */
export function fragment(text, maxPayload) {
  if (typeof text !== 'string') throw new TypeError('fragment: texto deve ser string');
  if (!Number.isInteger(maxPayload) || maxPayload < 1 || maxPayload > 1024) throw new RangeError(`maxPayload inválido: ${maxPayload}`);
  if (text.length === 0) return [new Uint8Array(0)];
  const out = [];
  let cur = [];
  let size = 0;
  for (let i = 0; i < text.length; i++) {
    const piece = encodeUtf8(text[i]);
    if (size > 0 && size + piece.length > maxPayload) {
      out.push(concatBytes(cur));
      cur = [];
      size = 0;
    }
    cur.push(piece);
    size += piece.length;
  }
  out.push(concatBytes(cur));
  return out;
}

export class Sender {
  constructor({ maxPayload = 64, initialSeq = 0 } = {}) {
    if (!Number.isInteger(maxPayload) || maxPayload < 1 || maxPayload > 1024) throw new RangeError(`maxPayload inválido: ${maxPayload}`);
    assertSeq(initialSeq, 'Sender');
    this.maxPayload = maxPayload;
    this.seq = initialSeq;
    this.framesSent = 0;
    this.messagesSent = 0;
  }

  /** Próximo número de sequência a ser usado. */
  get nextSeq() {
    return this.seq;
  }

  /** Mensagem → array de quadros (bytes no fio), na ordem de envio. */
  send(text) {
    const parts = fragment(text, this.maxPayload);
    const frames = parts.map((payload, k) => {
      const seq = this.seq;
      this.seq = (this.seq + 1) % SEQ_MAX;
      return encodeFrame({ seq, more: k < parts.length - 1, payload });
    });
    this.framesSent += frames.length;
    this.messagesSent++;
    return frames;
  }
}
