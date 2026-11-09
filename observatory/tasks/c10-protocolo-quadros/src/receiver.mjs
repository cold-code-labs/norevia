/**
 * Receptor: valida quadros, reordena por número de sequência dentro de uma
 * janela e remonta as mensagens.
 */
import { decodeFrame, FrameError, SEQ_MAX } from './frame.mjs';
import { FrameSplitter } from './slip.mjs';
import { decodeUtf8 } from './utf8.mjs';

const MOD = SEQ_MAX + 1;
export const WINDOW = MOD / 2 - 1;

export class Receiver {
  constructor({ initialSeq = 0 } = {}) {
    if (!Number.isInteger(initialSeq) || initialSeq < 0 || initialSeq > SEQ_MAX) throw new RangeError(`Receiver: seq inválido ${initialSeq}`);
    this.expected = initialSeq;
    this.pending = new Map();
    this.parts = [];
    this.splitter = new FrameSplitter();
    this.stats = { frames: 0, delivered: 0, duplicates: 0, corrupt: 0, invalid: 0 };
  }

  /** Nº de quadros guardados fora de ordem. */
  get buffered() {
    return this.pending.size;
  }

  /** Um quadro completo (com ou sem END) → mensagens entregues por ele. */
  push(wire) {
    let frame;
    try {
      frame = decodeFrame(wire);
    } catch (e) {
      if (e instanceof FrameError) {
        this.stats.corrupt++;
        return [];
      }
      throw e;
    }
    return this.accept(frame);
  }

  /** Pedaço arbitrário do fluxo de bytes → mensagens entregues. */
  pushBytes(chunk) {
    const out = [];
    for (const inner of this.splitter.push(chunk)) out.push(...this.push(inner));
    return out;
  }

  accept(frame) {
    this.stats.frames++;
    const d = (frame.seq - this.expected) % MOD;
    if (d !== 0) {
      if (d <= WINDOW && !this.pending.has(frame.seq)) this.pending.set(frame.seq, frame);
      else this.stats.duplicates++;
      return [];
    }
    const delivered = [];
    let f = frame;
    while (f) {
      this.consume(f, delivered);
      this.expected = (this.expected + 1) % MOD;
      f = this.pending.get(this.expected);
      if (f) this.pending.delete(this.expected);
    }
    return delivered;
  }

  consume(f, delivered) {
    try {
      this.parts.push(decodeUtf8(f.payload));
    } catch (e) {
      if (!(e instanceof TypeError)) throw e;
      this.parts.push(null);
    }
    if (f.more) return;
    const parts = this.parts;
    this.parts = [];
    if (parts.includes(null)) {
      this.stats.invalid++;
      return;
    }
    this.stats.delivered++;
    delivered.push(parts.join(''));
  }
}
