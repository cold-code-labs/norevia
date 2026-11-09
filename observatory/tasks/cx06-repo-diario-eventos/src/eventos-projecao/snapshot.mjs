/**
 * Snapshots de projeção e repositório de contas com snapshot periódico.
 */
import { project } from './project.mjs';

/**
 * Projeta o stream inteiro.
 * @returns {{streamId:string, version:number, state:object}}
 */
export function takeSnapshot(store, streamId) {
  const events = store.read(streamId);
  const state = project(events);
  const version = events.length ? events[0].version : 0;
  return { streamId, version, state };
}

/**
 * Reconstrói o estado atual a partir de um snapshot, aplicando só os eventos
 * posteriores a ele.
 * @param {{streamId:string, version:number, state:object}} snapshot
 */
export function rebuild(store, snapshot) {
  const events = store.read(snapshot.streamId, snapshot.version);
  const state = project(events, snapshot.state);
  const version = events.length ? events[0].version : snapshot.version;
  return { streamId: snapshot.streamId, version, state };
}

export class AccountRepository {
  /**
   * @param {import('./store.mjs').EventStore} store
   * @param {{snapshotEvery?: number}} [opts]
   */
  constructor(store, { snapshotEvery = 3 } = {}) {
    if (!Number.isSafeInteger(snapshotEvery) || snapshotEvery < 1) throw new RangeError('snapshotEvery inválido');
    this.store = store;
    this.snapshotEvery = snapshotEvery;
    this.snapshots = new Map();
  }

  /** Snapshot guardado para o stream, ou null. */
  snapshotOf(streamId) {
    return this.snapshots.get(streamId) ?? null;
  }

  /**
   * Estado atual do stream: `{ version, state }`.
   */
  load(streamId) {
    const snap = this.snapshots.get(streamId);
    const current = snap ? rebuild(this.store, snap) : takeSnapshot(this.store, streamId);
    const base = snap ? snap.version : 0;
    if (current.version - base >= this.snapshotEvery) this.snapshots.set(streamId, current);
    return { version: current.version, state: current.state };
  }

  /**
   * Executa um comando: `decide(state)` devolve os eventos a gravar.
   * @returns {number} versão do stream após o comando
   */
  execute(streamId, decide) {
    const { version, state } = this.load(streamId);
    const events = decide(state);
    if (!Array.isArray(events)) throw new TypeError('decide deve devolver um array');
    if (events.length === 0) return version;
    return this.store.append(streamId, events, version);
  }
}
