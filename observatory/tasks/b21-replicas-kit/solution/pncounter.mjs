/** Contador PN (incrementos e decrementos por réplica): `{ p: {r: n}, n: {r: n} }`. */

export function createCounter() {
  return { p: {}, n: {} };
}

function checkBy(by) {
  if (!Number.isInteger(by) || by < 0) throw new RangeError(`quantidade inválida: ${by}`);
}

function checkReplica(r) {
  if (typeof r !== 'string' || r === '') throw new RangeError('replica inválida');
}

export function increment(c, replica, by = 1) {
  checkReplica(replica);
  checkBy(by);
  return { p: { ...c.p, [replica]: (c.p[replica] ?? 0) + by }, n: { ...c.n } };
}

export function decrement(c, replica, by = 1) {
  checkReplica(replica);
  checkBy(by);
  return { p: { ...c.p }, n: { ...c.n, [replica]: (c.n[replica] ?? 0) + by } };
}

export function value(c) {
  let v = 0;
  for (const x of Object.values(c.p)) v += x;
  for (const x of Object.values(c.n)) v -= x;
  return v;
}

export function replicaValue(c, replica) {
  return (c.p[replica] ?? 0) - (c.n[replica] ?? 0);
}

export function mergeCounters(a, b) {
  const p = {};
  const n = {};
  const replicas = new Set([...Object.keys(a.p), ...Object.keys(a.n), ...Object.keys(b.p), ...Object.keys(b.n)]);
  for (const r of [...replicas].sort()) {
    p[r] = Math.max(a.p[r] ?? 0, b.p[r] ?? 0);
    n[r] = Math.max(a.n[r] ?? 0, b.n[r] ?? 0);
  }
  return { p, n };
}

export function leq(a, b) {
  for (const side of ['p', 'n']) for (const [r, x] of Object.entries(a[side])) if (x > (b[side][r] ?? 0)) return false;
  return true;
}
