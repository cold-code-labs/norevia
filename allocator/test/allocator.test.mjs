import test from 'node:test'; import assert from 'node:assert/strict'; import { createAllocator } from '../index.mjs';
// Mock task: part i is solved on attempt `needs[i]` (1 = first try); candidate text is the attempt number; verify passes when attempts >= needs.
function mockTask(k, needs, extra = {}) {
  const ids = Array.from({ length: k }, (_, i) => `p${i}`); const attempts = Object.fromEntries(ids.map((i) => [i, 0]));
  return { id: 't', parts: ids.map((id) => ({ id })), budget: extra.budget,
    group: (pids, o) => ({ prompt: JSON.stringify({ pids, fb: o.feedback || null }) }),
    parse: (text, pids) => { const { pids: p } = JSON.parse(text); return Object.fromEntries(pids.map((i) => { attempts[i]++; return [i, attempts[i]]; })); },
    verify: async (c) => Object.fromEntries(ids.map((i) => [i, { pass: (c[i] ?? 0) >= needs[ids.indexOf(i)], score: Math.min(1, (c[i] ?? 0) / needs[ids.indexOf(i)]), feedback: `part ${i} not yet` }])), attempts };
}
const model = (log = []) => async (req) => { log.push(req); return { text: req.prompt, cost: 0.001, inTok: 10, outTok: 5 }; };
test('splits at >= 3 parts and stays solo below, with reasons', async () => {
  const a = createAllocator({ model: model() }); const t3 = await a.run(mockTask(3, [1, 1, 1])); const t2 = await a.run(mockTask(2, [1, 1]));
  assert.equal(t3.mode, 'team'); assert.equal(t2.mode, 'solo'); assert.match(t3.events[0].reason, /LAB-003/); assert.equal(t3.calls, 3); assert.equal(t2.calls, 1);
});
test('repairs only failing parts and stops when resolved', async () => {
  const log = []; const a = createAllocator({ model: model(log) }); const t = mockTask(4, [1, 2, 1, 1]); const r = await a.run(t);
  assert.equal(r.accepted, true); assert.equal(r.calls, 5); assert.equal(log.filter((q) => q.meta.role.startsWith('repair1')).length, 1); assert.ok(r.events.some((e) => e.event === 'stop-resolved'));
});
test('verification gate: unverified parts are reported, not accepted', async () => {
  const a = createAllocator({ model: model(), policy: { maxRepairs: 1 } }); const r = await a.run(mockTask(3, [1, 5, 1]));
  assert.equal(r.accepted, false); assert.deepEqual(r.unverified, ['p1']); assert.equal(r.calls, 3 + 1);
});
test('budget ceiling stops the run and is logged', async () => {
  const a = createAllocator({ model: model() }); const r = await a.run(mockTask(3, [5, 5, 5], { budget: { maxCalls: 4 } }));
  assert.equal(r.budgetHit, true); assert.ok(r.calls <= 4); assert.ok(r.events.some((e) => e.event === 'budget-stop'));
});
test('force overrides the decision (baselines) and a repair is kept only if not worse', async () => {
  const a = createAllocator({ model: model(), policy: { force: 'team' } }); const r = await a.run(mockTask(1, [2])); assert.equal(r.mode, 'team'); assert.equal(r.accepted, true); assert.equal(r.calls, 2);
});
test('baseline feedback reaches the first-pass agents', async () => {
  const log = []; const a = createAllocator({ model: model(log) }); const t = mockTask(3, [1, 1, 1]); t.baseline = async () => ({ p0: { pass: false, score: 0, feedback: 'start fails' }, p1: { pass: true, score: 1, feedback: '' }, p2: { pass: false, score: 0, feedback: 'also fails' } });
  const r = await a.run(t); assert.ok(r.events.some((e) => e.event === 'baseline-check')); assert.match(log.find((q) => q.meta.role === 'owner:p0').prompt, /start fails/); assert.doesNotMatch(log.find((q) => q.meta.role === 'owner:p1').prompt, /fails/);
});
test('merge keeps earlier fixes when a repair returns only some files', async () => {
  const a = createAllocator({ model: model() }); let calls = 0;
  const task = { id: 'm', parts: [{ id: 'a' }], group: () => ({ prompt: 'x' }), parse: () => (++calls === 1 ? { a: { f1: 'ok', f2: 'bad' } } : { a: { f2: 'ok' } }),
    merge: (prev, next) => ({ ...prev, ...next }), verify: async (c) => ({ a: { pass: c.a?.f1 === 'ok' && c.a?.f2 === 'ok', score: (c.a?.f1 === 'ok') + (c.a?.f2 === 'ok'), feedback: 'f2' } }) };
  const r = await a.run(task); assert.equal(r.accepted, true); assert.deepEqual(r.candidates.a, { f1: 'ok', f2: 'ok' });
});
