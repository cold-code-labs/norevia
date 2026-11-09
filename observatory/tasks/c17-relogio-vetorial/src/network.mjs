/**
 * Simulação determinística de um grupo de réplicas: cada broadcast gera uma
 * cópia em trânsito para cada outro nó; o teste escolhe quando e em que ordem
 * cada cópia chega.
 */
import { Replica } from './node.mjs';
import { assertId } from './vclock.mjs';

export class Cluster {
  constructor(ids) {
    if (!Array.isArray(ids) || ids.length === 0) throw new RangeError('grupo vazio');
    this.order = [];
    this.replicas = new Map();
    for (const id of ids) {
      assertId(id);
      if (this.replicas.has(id)) throw new RangeError(`nó repetido: ${id}`);
      this.order.push(id);
      this.replicas.set(id, new Replica(id));
    }
    this.inflight = [];
  }

  replica(id) {
    const r = this.replicas.get(id);
    if (!r) throw new RangeError(`nó desconhecido: ${id}`);
    return r;
  }

  /** O nó `from` difunde `op`; devolve o id da mensagem. */
  broadcast(from, op) {
    const msg = this.replica(from).broadcast(op);
    for (const to of this.order) if (to !== from) this.inflight.push({ to, msg });
    return msg.id;
  }

  /** Entrega a cópia de `msgId` em trânsito para `to`; devolve os ids entregues em `to`. */
  deliver(to, msgId) {
    const replica = this.replica(to);
    const k = this.inflight.findIndex((x) => x.to === to && x.msg.id === msgId);
    if (k < 0) throw new RangeError(`nenhuma cópia de ${msgId} em trânsito para ${to}`);
    const [{ msg }] = this.inflight.splice(k, 1);
    return replica.receive(msg);
  }

  /** Reentrega (duplicata) uma mensagem já recebida pela rede. */
  duplicate(to, msg) {
    return this.replica(to).receive(msg);
  }

  /** Entrega todas as cópias em trânsito, na ordem de envio; devolve quantas entregas causou. */
  deliverAll() {
    let n = 0;
    while (this.inflight.length > 0) {
      const { to, msg } = this.inflight.shift();
      n += this.replica(to).receive(msg).length;
    }
    return n;
  }

  /**
   * Executa um roteiro de passos ['bcast', nó, op] | ['deliver', nó, msgId] | ['all'];
   * devolve, por passo, o id difundido, os ids entregues ou a contagem.
   */
  run(steps) {
    const out = [];
    for (const step of steps) {
      if (!Array.isArray(step)) throw new TypeError('passo deve ser array');
      if (step[0] === 'bcast') out.push(this.broadcast(step[1], step[2]));
      else if (step[0] === 'deliver') out.push(this.deliver(step[1], step[2]));
      else if (step[0] === 'all') out.push(this.deliverAll());
      else throw new RangeError(`passo desconhecido: ${step[0]}`);
    }
    return out;
  }

  inTransit(to) {
    return this.inflight.filter((x) => x.to === to).map((x) => x.msg.id);
  }

  snapshots() {
    const out = {};
    for (const id of this.order) out[id] = this.replica(id).snapshot();
    return out;
  }

  /** true sse todas as réplicas têm o mesmo estado visível e nada está pendente. */
  converged() {
    const snaps = this.order.map((id) => this.replica(id).snapshot());
    const first = JSON.stringify(snaps[0].state);
    return snaps.every((s) => JSON.stringify(s.state) === first && s.pending.length === 0) && this.inflight.length === 0;
  }
}
