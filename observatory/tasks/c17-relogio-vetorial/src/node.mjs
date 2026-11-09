/**
 * Réplica: difunde operações com relógio vetorial, entrega causalmente as
 * mensagens recebidas e as aplica ao registro local.
 */
import { DeliveryBuffer } from './delivery.mjs';
import { Store, validateOp } from './store.mjs';
import { assertId, compare, format } from './vclock.mjs';

function cloneMessage(msg) {
  return { id: msg.id, from: msg.from, vc: { ...msg.vc }, op: { ...msg.op } };
}

export class Replica {
  constructor(id) {
    this.id = assertId(id);
    this.buffer = new DeliveryBuffer(id);
    this.store = new Store();
    this.log = [];
    this.seq = 0;
  }

  get clock() {
    return { ...this.buffer.clock };
  }

  /** Cria a mensagem da operação, aplica-a localmente e a devolve (para envio). */
  broadcast(op) {
    validateOp(op);
    this.seq += 1;
    const vc = this.buffer.clock;
    this.buffer.stamp();
    const msg = { id: `${this.id}#${this.seq}`, from: this.id, vc, op: { ...op } };
    this.apply(msg);
    return cloneMessage(msg);
  }

  /** Recebe uma mensagem remota; devolve os ids entregues em consequência, em ordem. */
  receive(msg) {
    const delivered = this.buffer.receive(cloneMessage(msg));
    for (const m of delivered) this.apply(m);
    return delivered.map((m) => m.id);
  }

  apply(msg) {
    this.store.apply(msg);
    this.log.push(msg);
  }

  snapshot() {
    return {
      id: this.id,
      clock: format(this.buffer.clock),
      log: this.log.map((m) => m.id),
      pending: this.buffer.pendingIds(),
      state: this.store.state(),
    };
  }

  /** Pares [x, y] de mensagens concorrentes no log, x antes de y no log. */
  concurrentPairs() {
    const out = [];
    for (let i = 0; i < this.log.length; i++) {
      for (let j = i + 1; j < this.log.length; j++) {
        if (compare(this.log[i].vc, this.log[j].vc) === 'concurrent') out.push([this.log[i].id, this.log[j].id]);
      }
    }
    return out;
  }

  /** Ids (em ordem de log) das mensagens entregues que aconteceram antes de `msgId`. */
  causalPast(msgId) {
    const target = this.log.find((m) => m.id === msgId);
    if (!target) throw new RangeError(`mensagem não entregue: ${msgId}`);
    return this.log.filter((m) => compare(target.vc, m.vc) === 'before').map((m) => m.id);
  }
}
