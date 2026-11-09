/**
 * Projeção de eventos de conta (valores em centavos) num estado.
 */

export function initialState() {
  return { balance: 0, status: 'open', overdraftLimit: 0, rejected: 0 };
}

function amountOf(event) {
  const amount = event.data?.amount;
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new TypeError(`${event.type}: amount inválido`);
  return amount;
}

/**
 * Aplica um evento a um estado e devolve um NOVO estado (não altera `state`).
 * @param {{balance:number, status:string, overdraftLimit:number, rejected:number}} state
 * @param {{type:string, data?:object}} event
 */
export function apply(state, event) {
  const s = { ...state };
  switch (event.type) {
    case 'deposited': {
      const amount = amountOf(event);
      if (s.status === 'closed') s.rejected += 1;
      else s.balance += amount;
      return s;
    }
    case 'withdrawn': {
      const amount = amountOf(event);
      if (s.status !== 'open' || s.balance - amount < -s.overdraftLimit) s.rejected += 1;
      else s.balance -= amount;
      return s;
    }
    case 'interest': {
      const bps = event.data?.bps;
      if (!Number.isSafeInteger(bps)) throw new TypeError('interest: bps inválido');
      if (s.balance > 0) s.balance += Math.floor((s.balance * bps) / 10000);
      return s;
    }
    case 'limitSet': {
      const limit = event.data?.limit;
      if (!Number.isSafeInteger(limit) || limit < 0) throw new TypeError('limitSet: limit inválido');
      s.overdraftLimit = limit;
      return s;
    }
    case 'frozen':
      if (s.status === 'open') s.status = 'frozen';
      return s;
    case 'unfrozen':
      if (s.status === 'frozen') s.status = 'open';
      return s;
    case 'closed':
      s.status = 'closed';
      return s;
    default:
      throw new Error(`tipo de evento desconhecido: ${event.type}`);
  }
}

/**
 * Projeta uma sequência de eventos a partir de `initial` (não alterado).
 * @param {object[]} events
 * @param {object} [initial]
 */
export function project(events, initial = initialState()) {
  let state = { ...initial };
  for (let i = events.length; i-- > 0; ) state = apply(state, events[i]);
  return state;
}
