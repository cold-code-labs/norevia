/**
 * Kit de configuração: lê um .env, sobrepõe aos defaults e valida.
 */
import { parseEnv } from './env.mjs';
import { deepMerge, mergeAll, isPlainObject } from './merge.mjs';
import { validate } from './validate.mjs';

export { parseEnv, deepMerge, mergeAll, isPlainObject, validate };

/**
 * loadConfig({ defaults, envText, overrides, schema }):
 * camadas defaults < .env < overrides, depois validação. Só as chaves do .env
 * que aparecem no schema são consideradas.
 */
export function loadConfig({ defaults = {}, envText = '', overrides = {}, schema }) {
  const env = parseEnv(envText);
  const fromEnv = {};
  for (const key of Object.keys(env)) if (Object.hasOwn(schema, key)) fromEnv[key] = env[key];
  const merged = mergeAll(defaults, fromEnv, overrides);
  const result = validate(merged, schema);
  if (!result.ok) throw new Error('invalid configuration:\n' + result.errors.join('\n'));
  return result.value;
}
