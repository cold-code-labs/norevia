/**
 * CSV serialization in RFC 4180 style.
 *
 * Rules for a field:
 *   - null/undefined become an empty field;
 *   - other non-string values are converted with String(value);
 *   - the field is wrapped in double quotes if it contains the delimiter, double
 *     quotes, \n or \r, or if it starts or ends with a space;
 *   - inside a quoted field, each double quote is written doubled.
 *
 * Rows are separated by \r\n, without a trailing line break.
 */

const DEFAULT_DELIMITER = ',';

function needsQuoting(s, delimiter) {
  return (
    s.includes(delimiter) ||
    s.includes('"') ||
    s.includes('\n') ||
    s.includes('\r') ||
    s.startsWith(' ') ||
    s.endsWith(' ')
  );
}

export function formatField(value, delimiter = DEFAULT_DELIMITER) {
  if (value === null || value === undefined) return '';
  const s = typeof value === 'string' ? value : String(value);
  if (!needsQuoting(s, delimiter)) return s;
  return '"' + s.replace('"', '""') + '"';
}

export function formatRow(fields, delimiter = DEFAULT_DELIMITER) {
  if (!Array.isArray(fields)) throw new TypeError('row must be an array');
  return fields.map((f) => formatField(f, delimiter)).join(delimiter);
}

/**
 * toCsv(rows, { delimiter = ',' } = {}) — rows is an array of arrays.
 */
export function toCsv(rows, { delimiter = DEFAULT_DELIMITER } = {}) {
  if (!Array.isArray(rows)) throw new TypeError('rows must be an array');
  if (typeof delimiter !== 'string' || delimiter.length !== 1 || '"\r\n'.includes(delimiter)) {
    throw new RangeError('delimiter must be a single character other than quote or newline');
  }
  return rows.map((row) => formatRow(row, delimiter)).join('\r\n');
}
