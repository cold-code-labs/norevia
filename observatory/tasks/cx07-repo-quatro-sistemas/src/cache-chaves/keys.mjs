/**
 * Chaves canônicas de cache.
 *
 * Duas famílias de chave, ambas começando pelo nome do recurso:
 *   entidade:  <recurso>:<id>
 *   consulta:  <recurso>?<k1>=<v1>&<k2>=<v2>…
 * Os separadores ":" e "?" nunca aparecem num nome de recurso válido, então o
 * prefixo "<recurso>?" identifica todas as consultas de um recurso sem colidir
 * com recursos de nome parecido.
 */

const RESOURCE_RE = /^[a-z][a-z0-9_-]*$/;

/** Valida e devolve o nome de recurso. */
export function checkResource(resource) {
  if (typeof resource !== 'string' || !RESOURCE_RE.test(resource)) {
    throw new TypeError(`recurso inválido: ${resource}`);
  }
  return resource;
}

/**
 * Codifica um valor escalar ou array para uso numa chave.
 * - `null` vira string vazia;
 * - arrays viram os elementos codificados, unidos por ",";
 * - demais valores: `encodeURIComponent(String(v))`.
 */
export function encodeValue(v) {
  if (v === null) return '';
  if (Array.isArray(v)) return v.map(encodeValue).join(',');
  return encodeURIComponent(String(v));
}

/** Chave de uma entidade: `<recurso>:<id codificado>`. */
export function entityKey(resource, id) {
  checkResource(resource);
  if (id === undefined || id === null || id === '') throw new TypeError('id obrigatório');
  return `${resource}:${encodeValue(id)}`;
}

/**
 * Chave de uma consulta: `<recurso>?` seguido dos pares `k=v` unidos por "&",
 * ordenados pelo nome do parâmetro (ordem de code units). Parâmetros com valor
 * `undefined` são omitidos. Consulta sem parâmetros → `<recurso>?`.
 */
export function queryKey(resource, params = {}) {
  checkResource(resource);
  if (params === null || typeof params !== 'object' || Array.isArray(params)) {
    throw new TypeError('params deve ser um objeto');
  }
  const names = Object.keys(params).filter((k) => params[k] !== undefined).sort();
  const parts = names.map((k) => `${encodeURIComponent(k)}=${encodeValue(params[k])}`);
  return `${resource}:${parts.join('&')}`;
}

/** Recurso de uma chave (texto antes do primeiro ":" ou "?"). */
export function resourceOf(key) {
  const m = /^([^:?]*)[:?]/.exec(key);
  if (!m) throw new TypeError(`chave inválida: ${key}`);
  return m[1];
}
