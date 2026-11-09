/** Relógios vetoriais: objetos `{ réplica: contador }`; entradas ausentes valem 0. */

function check(vc) {
  if (vc === null || typeof vc !== 'object' || Array.isArray(vc)) throw new TypeError('relógio deve ser objeto');
  for (const [k, v] of Object.entries(vc)) if (!Number.isInteger(v) || v < 0) throw new RangeError(`contador inválido em ${k}`);
  return vc;
}

export function increment(vc, replica) {
  check(vc);
  if (typeof replica !== 'string' || replica === '') throw new RangeError('replica inválida');
  return { ...vc, [replica]: (vc[replica] ?? 0) + 1 };
}

export function mergeClocks(a, b) {
  check(a);
  check(b);
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = Math.max(out[k] ?? 0, v);
  return out;
}

export function descends(a, b) {
  check(a);
  check(b);
  for (const k of Object.keys(b)) if ((a[k] ?? 0) < b[k]) return false;
  return true;
}

export function compareClocks(a, b) {
  const ab = descends(a, b);
  const ba = descends(b, a);
  if (ab && ba) return 'equal';
  if (ba) return 'before';
  if (ab) return 'after';
  return 'concurrent';
}

export function isConcurrent(a, b) {
  return compareClocks(a, b) === 'concurrent';
}

/**
 * Ordena eventos `{ id, clock }` de forma compatível com a causalidade: se `a` aconteceu antes
 * de `b`, `a` vem primeiro; entre eventos sem ordem causal pendente, o de menor `id` primeiro.
 */
export function causalSort(events) {
  if (!Array.isArray(events)) throw new TypeError('events deve ser array');
  const rest = events.slice();
  const out = [];
  while (rest.length) {
    let best = -1;
    for (let i = 0; i < rest.length; i++) {
      const blocked = rest.some((o, j) => j !== i && compareClocks(o.clock, rest[i].clock) === 'before');
      if (blocked) continue;
      if (best < 0 || rest[i].id < rest[best].id) best = i;
    }
    out.push(rest.splice(best, 1)[0]);
  }
  return out;
}
