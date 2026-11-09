/**
 * OR-Set (add-wins). Estado: `{ replica, n, entries: Map<elemento, Set<tag>>, tombs: Set<tag> }`.
 * Cada `add` gera a tag `${replica}:${n}`, com `n` = nº de adds já feitos por esta réplica.
 */

export function createSet(replica) {
  if (typeof replica !== 'string' || replica === '' || replica.includes(':')) throw new RangeError('replica inválida');
  return { replica, n: 0, entries: new Map(), tombs: new Set() };
}

function withEntries(s, entries, tombs = s.tombs) {
  return { replica: s.replica, n: s.n, entries, tombs };
}

export function add(s, elem) {
  const next = { ...s, n: s.n + 1 };
  const tag = `${next.replica}:${next.n}`;
  const entries = new Map(s.entries);
  entries.set(elem, new Set([...(s.entries.get(elem) ?? []), tag]));
  return withEntries(next, entries);
}

export function remove(s, elem) {
  const tags = s.entries.get(elem);
  if (!tags) return s;
  const entries = new Map(s.entries);
  entries.delete(elem);
  return withEntries(s, entries, new Set([...s.tombs, ...tags]));
}

export function has(s, elem) {
  return s.entries.has(elem);
}

export function values(s) {
  return [...s.entries.keys()].sort();
}

export function tagsOf(s, elem) {
  return [...(s.entries.get(elem) ?? [])].sort();
}

export function mergeSets(a, b) {
  const tombs = new Set([...a.tombs, ...b.tombs]);
  const entries = new Map();
  const collect = (from, other) => {
    for (const [elem, tags] of from.entries) {
      for (const t of tags) {
        if (other.tombs.has(t)) continue;
        if (!entries.has(elem)) entries.set(elem, new Set());
        entries.get(elem).add(t);
      }
    }
  };
  collect(a, b);
  collect(b, a);
  return { replica: a.replica, n: a.n, entries, tombs };
}
