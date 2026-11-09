/**
 * Armazém de eventos em memória, com concorrência otimista por stream.
 */

export class ConcurrencyError extends Error {
  constructor(streamId, expected, actual) {
    super(`stream ${streamId}: versão esperada ${expected}, atual ${actual}`);
    this.name = 'ConcurrencyError';
    this.streamId = streamId;
    this.expected = expected;
    this.actual = actual;
  }
}

function checkStreamId(streamId) {
  if (typeof streamId !== 'string' || streamId === '') throw new TypeError('streamId inválido');
}

export class EventStore {
  constructor() {
    /** @type {Map<string, object[]>} */
    this.streams = new Map();
  }

  /** Versão atual do stream (= número de eventos; 0 se não existe). */
  version(streamId) {
    checkStreamId(streamId);
    return this.streams.get(streamId)?.length ?? 0;
  }

  /** Ids dos streams existentes, em ordem de criação. */
  streamIds() {
    return [...this.streams.keys()];
  }

  /**
   * Acrescenta eventos a um stream.
   * @param {string} streamId
   * @param {{type:string, data?:object}[]} events
   * @param {number} expectedVersion versão que o chamador acredita ser a atual
   * @returns {number} nova versão do stream
   */
  append(streamId, events, expectedVersion) {
    checkStreamId(streamId);
    if (!Array.isArray(events) || events.length === 0) throw new TypeError('events deve ser um array não vazio');
    for (const e of events) {
      if (!e || typeof e.type !== 'string' || e.type === '') throw new TypeError('evento sem type');
    }
    const current = this.version(streamId);
    if (expectedVersion !== current) throw new ConcurrencyError(streamId, expectedVersion, current);
    if (!this.streams.has(streamId)) this.streams.set(streamId, []);
    const stream = this.streams.get(streamId);
    for (const e of events) {
      stream.push(Object.freeze({ streamId, version: stream.length + 1, type: e.type, data: Object.freeze({ ...(e.data ?? {}) }) }));
    }
    return stream.length;
  }

  /**
   * Eventos do stream com versão maior que `fromVersion`.
   * @param {string} streamId
   * @param {number} [fromVersion=0]
   * @returns {object[]}
   */
  read(streamId, fromVersion = 0) {
    checkStreamId(streamId);
    if (!Number.isSafeInteger(fromVersion) || fromVersion < 0) throw new RangeError(`fromVersion inválido: ${fromVersion}`);
    const stream = this.streams.get(streamId) ?? [];
    const out = [];
    for (let i = fromVersion; i < stream.length; i++) out.push(stream[i]);
    return out;
  }
}
