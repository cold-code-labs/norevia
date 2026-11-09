/**
 * Carimbos de Lamport, relógio lógico e vetores de versão.
 *
 * Um carimbo é { c, r }: contador inteiro >= 1 e id da réplica de origem.
 * Vetor de versão: objeto simples { [réplica]: maior contador visto daquela origem }.
 */

export function assertReplicaId(id) {
  if (typeof id !== 'string') throw new TypeError('id de réplica deve ser string');
  if (id.length === 0 || /\s/.test(id)) throw new RangeError(`id de réplica inválido: ${JSON.stringify(id)}`);
  return id;
}

export function makeStamp(c, r) {
  if (!Number.isSafeInteger(c) || c < 1) throw new RangeError(`contador inválido: ${c}`);
  assertReplicaId(r);
  return Object.freeze({ c, r });
}

/** Ordem total: contador; empate → id da réplica (ordem de unidades de código). */
export function compareStamps(a, b) {
  if (a.c !== b.c) return a.c < b.c ? -1 : 1;
  if (a.r === b.r) return 0;
  return a.r.localeCompare(b.r) < 0 ? -1 : 1;
}

export function maxStamp(a, b) {
  return compareStamps(a, b) >= 0 ? a : b;
}

export function formatStamp(s) {
  return `${s.r}@${s.c}`;
}

export class LamportClock {
  #value;

  constructor(value = 0) {
    if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`valor inicial inválido: ${value}`);
    this.#value = value;
  }

  get value() {
    return this.#value;
  }

  /** Evento local: avança e devolve o novo contador. */
  tick() {
    this.#value += 1;
    return this.#value;
  }

  /** Recepção: o relógio passa a ser max(local, c). */
  observe(c) {
    if (!Number.isSafeInteger(c) || c < 0) throw new RangeError(`contador inválido: ${c}`);
    if (c > this.#value) this.#value = c;
    return this.#value;
  }
}

function sortKeys(o) {
  const out = {};
  for (const k of Object.keys(o).sort()) out[k] = o[k];
  return out;
}

export function vvGet(vv, r) {
  return vv[r] ?? 0;
}

export function vvObserve(vv, stamp) {
  const out = { ...vv };
  if (stamp.c > vvGet(vv, stamp.r)) out[stamp.r] = stamp.c;
  return sortKeys(out);
}

export function vvMerge(a, b) {
  const out = { ...a };
  for (const [r, c] of Object.entries(b)) if (c > vvGet(out, r)) out[r] = c;
  return sortKeys(out);
}

export function vvMax(vv) {
  let m = 0;
  for (const c of Object.values(vv)) if (c > m) m = c;
  return m;
}

/** true se `a` já incorporou tudo o que `b` incorporou. */
export function vvDominates(a, b) {
  for (const [r, c] of Object.entries(b)) if (vvGet(a, r) < c) return false;
  return true;
}
