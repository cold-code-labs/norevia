/**
 * Geração de slugs para URLs.
 *
 * slugify(input, { separator = '-', maxLength = Infinity }):
 *  1. normaliza em NFD e remove as marcas diacríticas (ç → c, ã → a);
 *  2. converte para minúsculas;
 *  3. cada sequência de caracteres fora de [a-z0-9] vira UM separador;
 *  4. remove separadores do início e do fim;
 *  5. se o resultado tiver mais que maxLength caracteres, é cortado em maxLength
 *     e o slug final nunca termina com separador.
 */
export function slugify(input, { separator = '-', maxLength = Infinity } = {}) {
  if (typeof input !== 'string') throw new TypeError('input must be a string');
  if (!(maxLength >= 0)) throw new RangeError('maxLength must be >= 0');
  let s = input.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  s = s.replace(/[^a-z0-9]+/g, separator);
  s = trimSeparator(s, separator);
  if (s.length > maxLength) s = s.slice(0, maxLength);
  return s;
}

function trimSeparator(s, sep) {
  if (!sep) return s;
  while (s.startsWith(sep)) s = s.slice(sep.length);
  while (s.endsWith(sep)) s = s.slice(0, -sep.length);
  return s;
}

/**
 * Slug que não colide com nenhum de `taken` (Set ou array de slugs existentes).
 * Se slugify(input) já existe, acrescenta separador + 2, 3, ... até achar um livre.
 */
export function uniqueSlug(input, taken, options = {}) {
  const used = taken instanceof Set ? taken : new Set(taken);
  const base = slugify(input, options);
  if (!used.has(base)) return base;
  const sep = options.separator ?? '-';
  for (let i = 2; ; i++) {
    const candidate = `${base}${sep}${i}`;
    if (!used.has(candidate)) return candidate;
  }
}
