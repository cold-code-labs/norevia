/**
 * Validação de configuração contra um schema simples.
 *
 * schema: { [chave]: { type: 'string' | 'number' | 'integer' | 'boolean',
 *                      required?: boolean, default?: any,
 *                      min?: number, max?: number, oneOf?: any[] } }
 */

function coerce(type, v) {
  if (typeof v !== 'string') return v;
  if ((type === 'number' || type === 'integer') && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  if (type === 'boolean') {
    if (v === 'true' || v === '1') return true;
    if (v === 'false' || v === '0') return false;
  }
  return v;
}

function check(key, spec, v) {
  const t = spec.type;
  if (t === 'string' && typeof v !== 'string') return `${key}: expected string`;
  if ((t === 'number' || t === 'integer') && (typeof v !== 'number' || !Number.isFinite(v))) return `${key}: expected ${t}`;
  if (t === 'integer' && !Number.isInteger(v)) return `${key}: expected integer`;
  if (t === 'boolean' && typeof v !== 'boolean') return `${key}: expected boolean`;
  if (spec.min !== undefined && v <= spec.min) return `${key}: must be >= ${spec.min}`;
  if (spec.max !== undefined && v > spec.max) return `${key}: must be <= ${spec.max}`;
  if (spec.oneOf && !spec.oneOf.includes(v)) return `${key}: must be one of ${spec.oneOf.join(', ')}`;
  return null;
}

/**
 * validate(input, schema) → { ok, value, errors }
 *
 * Para cada chave do schema, na ordem do schema:
 *  - ausente (undefined): usa `default` se houver; senão, se `required`, erro "<k>: required";
 *  - strings são convertidas para number/integer/boolean quando o tipo pede;
 *  - verifica tipo, depois min/max (inclusivos), depois oneOf; no máximo um erro por chave;
 *  - valores válidos (já convertidos) vão para `value`.
 * Depois, cada chave de input ausente do schema gera "<k>: unknown key".
 */
export function validate(input, schema) {
  const value = {};
  const errors = [];
  for (const [key, spec] of Object.entries(schema)) {
    const raw = input[key];
    if (raw === undefined) {
      if (spec.default !== undefined) value[key] = spec.default;
      else if (spec.required) errors.push(`${key}: required`);
      continue;
    }
    const v = coerce(spec.type, raw);
    const err = check(key, spec, v);
    if (err) errors.push(err);
    else value[key] = v;
  }
  for (const key of Object.keys(input)) {
    if (!Object.hasOwn(schema, key)) errors.push(`${key}: unknown key`);
  }
  return { ok: errors.length === 0, value, errors };
}
