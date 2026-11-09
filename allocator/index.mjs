// Norevia Allocator v0 — one reusable policy distilled from LAB-001…004 (see README.md for the evidence and the API).
// Zero dependencies, model-agnostic: the caller supplies `model` (an async function) and a Task adapter (parts, prompts, parser, verifier).
//
// Policy (every decision is logged with its reason):
//   1. decide    solo if the task has fewer than `splitMinParts` independent parts, team otherwise (LAB-003 Q1)
//   2. solve     solo: one agent sees all parts;  team: one owner per part with part-only context, in parallel
//   2b. baseline optional free check of the starting state, its feedback goes to the first-pass agents (LAB-003: owners saw the failing probe of the unfixed code)
//   3. verify    run the task's visible checks per part (the only signal agents may use)
//   4. repair    re-ask only for parts whose check fails, with the check feedback and the previous candidate, up to `maxRepairs` rounds (LAB-003 Q2: retry with feedback)
//   5. stop      as soon as every part passes: no patrol, no extra calls (LAB-004 wound_resolution, cost control)
//   6. gate      `accepted` is true only if every part passed its check; otherwise the result lists the unverified parts
//   7. ceiling   a per-task budget (calls, USD) is checked before every call; hitting it stops the run and is logged
// Not included on purpose: type memory (LAB-003 Q3: no effect), voting without a check (LAB-004: correlated errors → false success), unbounded fan-out.

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {{id: string}[]} parts  independent parts (a part may be solved without seeing the others)
 * @property {(ids: string[], o: {feedback?: Object<string,string>, previous?: Object<string,any>, extra?: string}) => {system?: string, prompt: string, maxTokens?: number, think?: boolean}} group
 *           builds the prompt for a call that covers the parts `ids` (ids = all parts → solo; ids = [one part] → owner)
 * @property {(text: string, ids: string[]) => Object<string, any>} parse  extracts candidates from a model answer: { partId: candidate }
 * @property {(candidates: Object<string, any>) => Promise<Object<string, {pass: boolean, score: number, feedback: string}>>} verify
 *           visible check of the current candidate set; one entry per part (pass, score in 0..1, feedback shown to the agent on repair)
 * @property {(previous: any, next: any) => any} [merge]  how a repaired candidate combines with the previous one (default: replace); repo tasks overlay the files the agent returned on the files it already had
 * @property {() => Promise<Object<string, {pass: boolean, score: number, feedback: string}>>} [baseline]  optional free check of the starting state (e.g. visible tests run on the unfixed code); its feedback is shown to the first-pass agents
 * @property {{maxCalls?: number, maxUsd?: number}} [budget]  per-task ceiling
 * @typedef {(req: {system?: string, prompt: string, maxTokens?: number, meta?: object}) => Promise<{text: string|null, cost?: number, inTok?: number, outTok?: number}>} Model
 */
export const DEFAULT_POLICY = { splitMinParts: 3, maxRepairs: 2, force: null /* 'solo' | 'team' to override the decision (used for baselines) */ };

export function createAllocator({ model, policy = {}, budget = {}, onEvent = null }) {
  const P = { ...DEFAULT_POLICY, ...policy };
  return { policy: P, async run(task) { return runTask({ model, P, budget, onEvent, task }); } };
}

async function runTask({ model, P, budget, onEvent, task }) {
  const t0 = Date.now(); const events = []; const ids = task.parts.map((p) => p.id); const k = ids.length;
  const log = (event, data = {}) => { const e = { t: Date.now() - t0, event, ...data }; events.push(e); if (onEvent) onEvent(e); };
  const B = { stage: {}, maxCalls: task.budget?.maxCalls ?? budget.maxCalls ?? Infinity, maxUsd: task.budget?.maxUsd ?? budget.maxUsd ?? Infinity, calls: 0, usd: 0, inTok: 0, outTok: 0, hit: false, failedCalls: 0 };
  const ask = async (role, partIds, o = {}) => {
    const avg = B.calls ? B.usd / B.calls : 0;
    if (B.calls >= B.maxCalls || B.usd + avg > B.maxUsd) { if (!B.hit) log('budget-stop', { role, calls: B.calls, usd: +B.usd.toFixed(5), reason: `ceiling reached (${B.calls}/${B.maxCalls} calls, $${B.usd.toFixed(4)}/${B.maxUsd})` }); B.hit = true; return null; }
    const req = task.group(partIds, o); B.calls++;
    const tc = Date.now(); const r = await model({ system: req.system, prompt: req.prompt, maxTokens: req.maxTokens, think: req.think, meta: { task: task.id, role, parts: partIds.length } });
    const ms = r.ms ?? Date.now() - tc; const st = role.split(':')[0]; B.stage[st] = Math.max(B.stage[st] || 0, ms);   // parallel calls of one stage overlap, stages add: critical path
    B.usd += r.cost || 0; B.inTok += r.inTok || 0; B.outTok += r.outTok || 0; if (!r.text) B.failedCalls++;
    return r.text;
  };
  const mode = P.force || (k >= P.splitMinParts ? 'team' : 'solo');
  log('decide', { mode, parts: k, reason: P.force ? `forced by policy (${P.force})` : k >= P.splitMinParts ? `${k} independent parts ≥ ${P.splitMinParts}: one owner per part with part-only context is cheaper per accepted task (LAB-003 Q1)` : `${k} part(s) < ${P.splitMinParts}: a single agent is as cheap or cheaper and keeps the context together (LAB-003 Q1)` });
  let cands = {}; let ver = {};
  let base = null; if (task.baseline) { try { base = await task.baseline(); } catch (e) { log('baseline-error', { message: String(e.message).slice(0, 120) }); } if (base) log('baseline-check', { failing: ids.filter((i) => !base[i]?.pass).length, of: k, reason: 'free visible check of the starting state; failing parts get their feedback on the first pass' }); }
  const fb0 = (pids) => (base ? Object.fromEntries(pids.filter((i) => !base[i]?.pass && base[i]?.feedback).map((i) => [i, base[i].feedback])) : undefined);
  const take = (text, partIds) => { if (text == null) return {}; try { return task.parse(text, partIds) || {}; } catch (e) { log('parse-error', { message: String(e.message).slice(0, 120) }); return {}; } };
  const mergeC = (prev, next) => (task.merge && prev !== undefined ? task.merge(prev, next) : next);
  const score = (v, i) => v?.[i]?.score ?? 0; const failing = (v) => ids.filter((i) => !v[i]?.pass);
  // ---- first pass
  if (mode === 'team') { const outs = await Promise.all(ids.map(async (i) => [i, await ask(`owner:${i}`, [i], { feedback: fb0([i]) })])); for (const [i, text] of outs) Object.assign(cands, take(text, [i])); }
  else Object.assign(cands, take(await ask('solo', ids, { feedback: fb0(ids) }), ids));
  ver = await task.verify(cands); log('verify', { round: 0, failing: failing(ver).length, of: k });
  // ---- repair only while checks fail
  for (let rr = 1; rr <= P.maxRepairs; rr++) {
    const bad = failing(ver); if (!bad.length) { log('stop-resolved', { round: rr - 1, reason: 'every part passed its check: no further calls (no patrol)' }); break; } if (B.hit) break;
    log('repair', { round: rr, parts: bad.length, reason: `re-ask only the ${bad.length} failing part(s) with their check feedback and previous candidate` });
    const feedback = Object.fromEntries(bad.map((i) => [i, ver[i]?.feedback ?? ''])); const previous = Object.fromEntries(bad.map((i) => [i, cands[i]]));
    const next = {};
    if (mode === 'team') { const outs = await Promise.all(bad.map(async (i) => [i, await ask(`repair${rr}:${i}`, [i], { feedback: { [i]: feedback[i] }, previous: { [i]: previous[i] } })])); for (const [i, text] of outs) Object.assign(next, take(text, [i])); }
    else Object.assign(next, take(await ask(`repair${rr}`, ids, { feedback, previous: { ...cands } }), ids));
    const merged = { ...cands }; for (const [i, c] of Object.entries(next)) if (bad.includes(i) || mode === 'solo') merged[i] = mergeC(cands[i], c); const v2 = await task.verify(merged);
    for (const i of ids) if (score(v2, i) >= score(ver, i)) { if (merged[i] !== undefined) cands[i] = merged[i]; ver[i] = v2[i]; }   // keep a repair only if it is not worse
    log('verify', { round: rr, failing: failing(ver).length, of: k });
  }
  if (!failing(ver).length && !events.some((e) => e.event === 'stop-resolved')) log('stop-resolved', { round: P.maxRepairs, reason: 'every part passed its check: no further calls (no patrol)' });
  const unverified = failing(ver); const accepted = unverified.length === 0;
  log('gate', { accepted, unverified: unverified.length, reason: accepted ? 'all parts passed their visible checks' : `${unverified.length} part(s) did not pass their checks: result reported as unverified, not accepted` });
  return { id: task.id, mode, accepted, unverified, candidates: cands, verification: ver, calls: B.calls, usd: B.usd, inTok: B.inTok, outTok: B.outTok, failedCalls: B.failedCalls, budgetHit: B.hit, criticalPathMs: Object.values(B.stage).reduce((a, b) => a + b, 0), wallMs: Date.now() - t0, events };
}
