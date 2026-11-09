/**
 * Emissor: fragmenta mensagens de texto em quadros numerados.
 */
import { encodeUtf8 } from './utf8.mjs';
import { encodeFrame, SEQ_MAX } from './frame.mjs';

function assertSeq(seq, who) {
  if (!Number.isInteger(seq) || seq < 0 || seq > SEQ_MAX) throw new RangeError(`${who}: seq inválido ${seq}`);
}

/** Payloads (Uint8Array) dos fragmentos de `text`. */
export function fragment(text, maxPayload) {
  if (typeof text !== 'string') throw new TypeError('fragment: texto deve ser string');
  if (!Number.isInteger(maxPayload) || maxPayload < 1 || maxPayload > 1024) throw new RangeError(`maxPayload inválido: ${maxPayload}`);
  const bytes = encodeUtf8(text);
  if (bytes.length === 0) return [new Uint8Array(0)];
  const out = [];
  for (let i = 0; i < bytes.length; i += maxPayload) out.push(bytes.slice(i, i + maxPayload));
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
      this.seq = (this.seq + 1) % (SEQ_MAX + 1);
      return encodeFrame({ seq, more: k < parts.length - 1, payload });
    });
    this.framesSent += frames.length;
    this.messagesSent++;
    return frames;
  }
}
