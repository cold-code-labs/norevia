/**
 * Agendador de tarefas com relógio simulado (em milissegundos).
 */
import { Heap } from './heap.mjs';

/** Comparador das entradas da fila do agendador. */
export function compareEntries(a, b) {
  return b.at - a.at || a.priority - b.priority || b.seq - a.seq;
}

export class Scheduler {
  /** @param {{now?: number}} [opts] instante inicial do relógio, em ms */
  constructor({ now = 0 } = {}) {
    if (!Number.isSafeInteger(now) || now < 0) throw new RangeError(`now inválido: ${now}`);
    this.now = now;
    this.queue = new Heap(compareEntries);
    this.live = new Set();
    this.seq = 0;
    this.nextId = 1;
  }

  /**
   * Agenda uma tarefa e devolve seu id.
   * @param {string} name
   * @param {{at?: number, delay?: number, every?: number, priority?: number}} [opts]
   * @param {(s: Scheduler, time: number, id: number) => void} [fn]
   */
  schedule(name, opts = {}, fn = null) {
    if (typeof name !== 'string' || name === '') throw new TypeError('nome inválido');
    const { at, delay, every, priority = 0 } = opts;
    if (at !== undefined && delay !== undefined) throw new TypeError('use at OU delay');
    let when;
    if (at !== undefined) {
      if (!Number.isSafeInteger(at) || at < this.now) throw new RangeError(`at inválido: ${at}`);
      when = at;
    } else {
      const d = delay ?? 0;
      if (!Number.isSafeInteger(d) || d < 0) throw new RangeError(`delay inválido: ${d}`);
      when = this.now + d;
    }
    if (!Number.isSafeInteger(priority)) throw new RangeError(`prioridade inválida: ${priority}`);
    let periodMs = 0;
    if (every !== undefined) {
      if (typeof every !== 'number' || !Number.isFinite(every) || every <= 0) throw new RangeError(`every inválido: ${every}`);
      periodMs = Math.round(every);
      if (periodMs < 1) throw new RangeError(`every abaixo de 1 ms: ${every}`);
    }
    if (fn !== null && typeof fn !== 'function') throw new TypeError('fn deve ser função');
    const id = this.nextId++;
    this.live.add(id);
    this.queue.push({ id, name, at: when, priority, periodMs, fn, seq: this.seq++ });
    return id;
  }

  /** Cancela uma tarefa pendente (inclusive periódica). Devolve se havia algo a cancelar. */
  cancel(id) {
    return this.live.delete(id);
  }

  /** Quantidade de tarefas pendentes. */
  get pending() {
    return this.live.size;
  }

  /**
   * Executa, em ordem, todas as tarefas com instante <= t e avança o relógio
   * para t. Devolve o registro das execuções feitas nesta chamada.
   * @returns {{time:number, name:string}[]}
   */
  runUntil(t) {
    if (!Number.isSafeInteger(t) || t < this.now) throw new RangeError(`t inválido: ${t}`);
    const log = [];
    while (!this.queue.isEmpty() && this.queue.peek().at <= t) {
      const entry = this.queue.pop();
      if (!this.live.has(entry.id)) continue;
      this.now = entry.at;
      log.push({ time: entry.at, name: entry.name });
      if (entry.fn) entry.fn(this, entry.at, entry.id);
      if (entry.periodMs > 0 && this.live.has(entry.id)) {
        this.queue.push({ ...entry, at: entry.at + entry.periodMs, seq: this.seq++ });
      } else {
        this.live.delete(entry.id);
      }
    }
    this.now = t;
    return log;
  }
}
