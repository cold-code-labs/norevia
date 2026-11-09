/**
 * Entrega causal: retém mensagens até que todas as suas dependências causais
 * tenham sido entregues no nó local.
 */
import { assertId, get, merge, tick, normalize, coveredExcept } from './vclock.mjs';

export function validateMessage(msg) {
  if (msg === null || typeof msg !== 'object') throw new TypeError('mensagem deve ser objeto');
  assertId(msg.from);
  if (typeof msg.id !== 'string') throw new TypeError('mensagem sem id');
  normalize(msg.vc);
  return msg;
}

/** A mensagem pode ser entregue agora a um nó cujo relógio é `local`? */
export function isReady(local, msg) {
  return get(msg.vc, msg.from) === get(local, msg.from) && coveredExcept(msg.vc, local, msg.from);
}

/** A mensagem já foi entregue (ou é anterior a uma entregue) do mesmo remetente? */
export function isDelivered(local, msg) {
  return get(msg.vc, msg.from) < get(local, msg.from);
}

export class DeliveryBuffer {
  constructor(self) {
    this.self = assertId(self);
    this.clock = {};
    this.pending = [];
  }

  /** Registra um evento local (broadcast) e devolve o relógio da mensagem. */
  stamp() {
    this.clock = tick(this.clock, this.self);
    return { ...this.clock };
  }

  /**
   * Recebe uma mensagem remota; devolve, em ordem, as mensagens entregues por
   * causa dela (possivelmente nenhuma). Duplicatas são ignoradas.
   */
  receive(msg) {
    validateMessage(msg);
    if (msg.from === this.self) throw new RangeError('nó não recebe as próprias mensagens');
    if (isDelivered(this.clock, msg)) return [];
    this.pending.push(msg);
    return this.drain();
  }

  drain() {
    const out = [];
    for (;;) {
      const ready = this.pending.filter((m) => isReady(this.clock, m));
      if (ready.length === 0) break;
      const next = ready[0];
      this.pending.splice(this.pending.indexOf(next), 1);
      this.clock = merge(this.clock, tick(next.vc, next.from));
      out.push(next);
    }
    return out;
  }

  pendingIds() {
    return this.pending.map((m) => m.id).sort();
  }
}
