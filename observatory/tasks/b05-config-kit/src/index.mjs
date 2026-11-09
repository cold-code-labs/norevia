/**
 * Configuration kit: reads a .env, layers it over the defaults and validates.
 */
import { parseEnv } from './env.mjs';
import { deepMerge, mergeAll, isPlainObject } from './merge.mjs';
import { validate } from './validate.mjs';

export { parseEnv, deepMerge, mergeAll, isPlainObject, validate };

/**
 * loadConfig({ defaults, envText, overrides, schema }):
 * layers defaults < .env < overrides, then validation. Only the .env keys
 * that appear in the schema are considered.
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
