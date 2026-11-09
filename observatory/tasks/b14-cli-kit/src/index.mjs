/**
 * Kit de CLI: reexporta os módulos e oferece `parseCli`, que combina o
 * analisador de argumentos com conversões tipadas e sugestões de opções.
 */
import { parseArgs } from './argv.mjs';
import { parseDuration, formatDuration } from './duration.mjs';
import { formatBytes, parseBytes } from './bytes.mjs';
import { parseIni, getIni } from './ini.mjs';
import { distance, suggest, didYouMean } from './suggest.mjs';

export { parseArgs, parseDuration, formatDuration, formatBytes, parseBytes, parseIni, getIni, distance, suggest, didYouMean };

const CONVERTERS = {
  string: (v) => v,
  boolean: (v) => v,
  duration: (v) => parseDuration(v),
  bytes: (v) => parseBytes(v),
};

/**
 * parseCli(argv, spec): `spec` mapeia nome canônico -> { type, alias?, default? },
 * com type em 'string' | 'boolean' | 'duration' | 'bytes'.
 * Devolve `{ _, values }`. Opção desconhecida -> Error com sugestão.
 */
export function parseCli(argv, spec) {
  const boolean = [];
  const alias = {};
  const defaults = {};
  for (const [name, def] of Object.entries(spec)) {
    if (!Object.hasOwn(CONVERTERS, def.type)) throw new TypeError(`tipo desconhecido em ${name}: ${def.type}`);
    if (def.type === 'boolean') boolean.push(name);
    if (def.alias !== undefined) alias[def.alias] = name;
    if (def.default !== undefined) defaults[name] = def.default;
  }
  const parsed = parseArgs(argv, { boolean, alias, defaults });
  const values = {};
  for (const [key, raw] of Object.entries(parsed)) {
    if (key === '_') continue;
    if (!Object.hasOwn(spec, key)) {
      const hint = didYouMean(key, Object.keys(spec));
      throw new Error(`opção desconhecida: --${key}${hint ? `. ${hint}` : ''}`);
    }
    const convert = CONVERTERS[spec[key].type];
    values[key] = Array.isArray(raw) ? raw.map(convert) : typeof raw === 'string' ? convert(raw) : raw;
  }
  return { _: parsed._, values };
}
