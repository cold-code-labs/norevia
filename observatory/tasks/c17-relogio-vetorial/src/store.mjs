/**
 * Registro chave → valor replicado. Cada escrita carrega o relógio vetorial e o
 * remetente da mensagem que a originou; entre duas escritas da mesma chave vence
 * a de maior carimbo (peso do relógio, remetente). Como o peso cresce ao longo
 * de toda cadeia causal, uma escrita nunca perde para outra que ela já conhecia,
 * e escritas concorrentes são decididas igualmente em todas as réplicas.
 */
import { weight } from './vclock.mjs';

export function validateOp(op) {
  if (op === null || typeof op !== 'object') throw new TypeError('operação deve ser objeto');
  if (typeof op.key !== 'string' || op.key === '') throw new RangeError('operação sem chave');
  if (op.type === 'set') {
    if (!Object.hasOwn(op, 'value')) throw new RangeError('set sem valor');
  } else if (op.type !== 'del') {
    throw new RangeError(`tipo de operação desconhecido: ${op.type}`);
  }
  return op;
}

/** true sse o carimbo `a` vence o carimbo `b`. */
export function stampWins(a, b) {
  if (a.weight !== b.weight) return a.weight > b.weight;
  return a.from > b.from;
}

export class Store {
  constructor() {
    this.cells = new Map();
  }

  apply(msg) {
    const op = validateOp(msg.op);
    const cand = {
      weight: weight(msg.vc),
      from: msg.from,
      id: msg.id,
      deleted: op.type === 'del',
      value: op.type === 'set' ? op.value : undefined,
    };
    const cur = this.cells.get(op.key);
    if (cur === undefined || stampWins(cand, cur)) {
      this.cells.set(op.key, cand);
      return true;
    }
    return false;
  }

  get(key) {
    const cell = this.cells.get(key);
    return cell === undefined || cell.deleted ? undefined : cell.value;
  }

  /** Estado visível: objeto com as chaves vivas em ordem crescente. */
  state() {
    const out = {};
    for (const key of [...this.cells.keys()].sort()) {
      const cell = this.cells.get(key);
      if (!cell.deleted) out[key] = cell.value;
    }
    return out;
  }

  /** Id da mensagem que determinou o valor atual de cada chave (inclusive apagadas). */
  writers() {
    const out = {};
    for (const key of [...this.cells.keys()].sort()) out[key] = this.cells.get(key).id;
    return out;
  }
}
