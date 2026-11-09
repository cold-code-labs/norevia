/**
 * Repositório com cache de leitura sobre um armazenamento de registros.
 */
import { entityKey, queryKey, checkResource } from './keys.mjs';

/**
 * Armazenamento em memória usado como "banco". Conta as leituras que recebe em
 * `calls` para que se possa observar quando o cache foi usado.
 */
export class MemoryStore {
  constructor(records = []) {
    this.rows = new Map(records.map((r) => [r.id, { ...r }]));
    this.calls = { get: 0, list: 0, update: 0 };
  }

  get(id) {
    this.calls.get++;
    const r = this.rows.get(id);
    return r ? { ...r } : undefined;
  }

  /** Registros cujos campos são iguais (===) a todos os `params` definidos, ordenados por id. */
  list(params = {}) {
    this.calls.list++;
    const out = [];
    for (const r of this.rows.values()) {
      if (Object.entries(params).every(([k, v]) => v === undefined || r[k] === v)) out.push({ ...r });
    }
    return out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }

  update(id, patch) {
    this.calls.update++;
    const r = this.rows.get(id);
    if (!r) throw new Error(`registro inexistente: ${id}`);
    Object.assign(r, patch, { id });
    return { ...r };
  }
}

export class Repository {
  /**
   * @param {{ resource: string, store: MemoryStore, cache: import('./cache.mjs').TtlCache, ttlSeconds?: number }} o
   */
  constructor({ resource, store, cache, ttlSeconds = 60 }) {
    this.resource = checkResource(resource);
    this.store = store;
    this.cache = cache;
    this.ttlSeconds = ttlSeconds;
  }

  #read(key, load) {
    const hit = this.cache.get(key);
    if (hit !== undefined) return hit;
    const value = load();
    if (value !== undefined) this.cache.set(key, value, this.ttlSeconds * 1000);
    return value;
  }

  /** Registro pelo id (com cache), ou `undefined` se não existir (não é cacheado). */
  get(id) {
    return this.#read(entityKey(this.resource, id), () => this.store.get(id));
  }

  /** Lista filtrada (com cache por combinação de parâmetros). */
  list(params = {}) {
    return this.#read(queryKey(this.resource, params), () => this.store.list(params));
  }

  /**
   * Atualiza o registro e invalida exatamente: a chave da entidade alterada e
   * todas as chaves de consulta deste recurso.
   */
  update(id, patch) {
    const updated = this.store.update(id, patch);
    this.cache.invalidate(entityKey(this.resource, id));
    this.cache.invalidatePrefix(`${this.resource}:`);
    return updated;
  }
}
