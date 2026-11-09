/**
 * Receptor: valida quadros, reordena por número de sequência dentro de uma
 * janela e remonta as mensagens.
 */
import { decodeFrame, FrameError, SEQ_MAX } from './frame.mjs';
import { FrameSplitter, concatBytes } from './slip.mjs';
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
    const d = (((frame.seq - this.expected) % MOD) + MOD) % MOD;
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
    this.parts.push(f.payload);
    if (f.more) return;
    const bytes = concatBytes(this.parts);
    this.parts = [];
    let text;
    try {
      text = decodeUtf8(bytes);
    } catch (e) {
      if (!(e instanceof TypeError)) throw e;
      this.stats.invalid++;
      return;
    }
    this.stats.delivered++;
    delivered.push(text);
  }
}
