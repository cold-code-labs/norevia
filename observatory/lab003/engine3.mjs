// LAB-003 shared engine: Run (budget-checked agent calls), probe/final evaluation, prompts, SOLO and TEAM policies.
import { call, CapError, estCost } from './api.mjs';
import { runTask3 } from './testrun3.mjs';
import { parseFiles, parseJson, SYSTEM_SOLVER } from '../lib/prompt.mjs';
export { CapError, parseJson, parseFiles, SYSTEM_SOLVER };
const block = (k, v) => `--- ${k} ---\n${v.replace(/\s+$/, '')}\n--- end ${k} ---`;
export const MANIFEST = '\n\nYou are a worker in a harness: no tools, you cannot run code; the only feedback is the visible probe results shown to you. Return exactly the format asked.';
export class Run {
  constructor(task, tag, { maxCalls, maxUsd }) { Object.assign(this, { task, tag, maxCalls, maxUsd, calls: 0, spent: 0, inflight: 0, inTok: 0, outTok: 0, budgetHit: false, truncated: 0, failedCalls: 0, events: [] }); }
  async agent(role, prompt, { system = SYSTEM_SOLVER, maxTokens = 64000, meta = {} } = {}) {
    const est = estCost(prompt.length + system.length, Math.min(maxTokens, 16000));
    if (this.calls >= this.maxCalls || this.spent + this.inflight + est > this.maxUsd) { this.budgetHit = true; return null; }
    this.inflight += est; this.calls++; let r;
    try { r = await call({ system: system + MANIFEST, prompt, maxTokens, meta: { run: this.tag, task: this.task.id, role, ...meta } }); } finally { this.inflight -= est; }
    this.spent += r?.cost || 0; this.inTok += r?.inTok || 0; this.outTok += r?.outTok || 0; if (r?.stop === 'max_tokens') this.truncated++; if (!r?.text) this.failedCalls++; return r?.text ?? null;
  }
}
export const limitsFor = (t) => ({ maxCalls: 2 * t.k + 4, maxUsd: +(0.02 + 0.00006 * t.pkgs.reduce((s, p) => s + p.loc, 0)).toFixed(3) });
export const probe = async (t, files, only = null) => (await runTask3({ taskDir: t.dir, overlay: files, suites: ['probe'], spec: t.spec, expected: t.expected, only })).probe;
export const evaluate = async (t, files) => runTask3({ taskDir: t.dir, overlay: files, suites: ['probe', 'final'], spec: t.spec, expected: t.expected });
export const kp = (p, k) => { const e = Object.entries(p.files).filter(([f]) => f.startsWith(`probe/${k}__`)); const pass = e.reduce((s, [, v]) => s + v.pass, 0), total = e.reduce((s, [, v]) => s + v.total, 0); return { pass, total, ok: total > 0 && pass === total, failFrac: total ? (total - pass) / total : 1, nFail: total - pass }; };
export const failTxt = (p, k = null, n = 12) => (p.failures || []).filter((f) => !k || f.file.startsWith(`probe/${k}__`)).slice(0, n).map((f) => `- [${f.file.split('/').pop()}] ${f.name}: ${f.message}`).join('\n') || '(all probe tests pass)';
export const view = (t, k = null) => Object.entries(t.probeView).concat(Object.entries(t.probe).filter(([f]) => f.includes('__v-'))).filter(([f]) => !k || f.startsWith(`probe/${k}__`)).map(([f, v]) => block(f, v)).join('\n\n');
export const cur = (t, files) => ({ ...t.src, ...files });
export const repoPrompt = (t, files, extra = '') => `# Task: repository of ${t.k} package${t.k > 1 ? 's' : ''}\n\n## Specification and reported problems\n${t.statement}\n\n## Source files (current)\n${Object.entries(cur(t, files)).map(([k, v]) => block(k, v)).join('\n\n')}\n\n## Probe tests (a larger hidden suite also checks the full specification)\n${view(t)}${extra ? '\n\n' + extra : ''}\n\nFix the bugs so every package satisfies its full specification (not only the probe tests). Return complete changed files in the mandatory block format.`;
export const pkgPrompt = (t, k, files, extra = '', header = '') => { const p = t.pkgs.find((x) => x.name === k); return `# Task: package ${k} of a ${t.k}-package repository\n\nOther packages belong to other agents; change ONLY files under src/${k}/.${header}\n\n## Specification\n${p.statement}\n\n## Source files (current)\n${Object.entries(cur(t, files)).filter(([n]) => n.startsWith(`src/${k}/`)).map(([n, v]) => block(n, v)).join('\n\n')}\n\n## Probe tests (a larger hidden suite also checks the full specification)\n${view(t, k)}\n\n${extra}\n\nReturn complete changed files in the mandatory block format.`; };
export const own = (t, k) => t.pkgs.find((p) => p.name === k).srcFiles;
export const kits = (t) => t.pkgs.map((p) => p.name);
// SOLO: one agent on the whole repo, ≤ 2 repairs from probe failures (a repair is kept only if the probe pass count does not drop)
export async function SOLO(run, { memoryNote = '' } = {}) {
  const t = run.task; let files = {};
  const r = await run.agent('solo', repoPrompt(t, files, memoryNote)); files = r ? parseFiles(r, Object.keys(t.src)) : {}; let p = await probe(t, files); const first = { files: { ...files }, p };
  for (let i = 0; i < 2 && !p.allPass && !run.budgetHit; i++) { const rr = await run.agent('solo-repair', repoPrompt(t, files, `${memoryNote}\n\n## Probe results: ${p.pass}/${p.total}\n${failTxt(p)}\n\nReturn every file you change.`)); const nx = { ...files, ...(rr ? parseFiles(rr, Object.keys(t.src)) : {}) }; const pn = await probe(t, nx); if (pn.pass >= p.pass) { files = nx; p = pn; } }
  return { files, p, first };
}
// one owner call per package listed (parallel); each package accepted independently if its probe count does not drop
export async function ownersRound(run, ks, files, p, role, { fresh = true, prev = {}, memoryNote = '' } = {}) {
  const t = run.task;
  const outs = await Promise.all(ks.map(async (k) => { const own_ = kp(p, k); const extra = `${memoryNote}${prev[k] ? `\n\n## Your previous answer for this package\n${prev[k]}\n` : ''}\n${own_.ok ? 'The probe tests for this package pass; hidden tests may still reveal defects — re-read the specification carefully.' : `## Probe failures\n${failTxt(p, k)}`}`; const r = await run.agent(`${role}-${k}`, pkgPrompt(t, k, files, extra)); return { k, text: r, files: r ? parseFiles(r, own(t, k)) : {} }; }));
  return outs;
}
export async function acceptBest(run, outs, files, p) {      // outs may contain several candidates per package; pick best by probe, keep if not worse
  const t = run.task, byK = {}; for (const o of outs) (byK[o.k] ||= []).push(o); const res = {}; const depth = Math.max(0, ...Object.values(byK).map((a) => a.length));
  for (let j = 0; j < depth; j++) { const ov = { ...files }; for (const a of Object.values(byK)) if (a[j]) Object.assign(ov, a[j].files); const pj = await probe(t, ov); for (const [k, a] of Object.entries(byK)) if (a[j]) (res[k] ||= []).push({ ...a[j], ...kp(pj, k) }); }
  const next = { ...files }; for (const [k, cs] of Object.entries(res)) { const best = cs.reduce((a, c) => (c.pass > a.pass ? c : a), cs[0]); if (best.pass >= kp(p, k).pass) Object.assign(next, best.files); }
  return { files: next, p: await probe(t, next) };
}
// TEAM: single owner per package (package-only context), repair only while that package's probe fails (≤ 2 rounds)
export async function TEAM(run) {
  const t = run.task, ks = kits(t); let files = {}; let p = await probe(t, files);
  let outs = await ownersRound(run, ks, files, p, 'owner'); const first = {}; ({ files, p } = await acceptBest(run, outs, files, p)); first.files = { ...files }; first.p = p; const prev = Object.fromEntries(outs.map((o) => [o.k, o.text]));
  for (let rr = 1; rr <= 2 && !run.budgetHit; rr++) { const bad = ks.filter((k) => !kp(p, k).ok); if (!bad.length) break; outs = await ownersRound(run, bad, files, p, `repair${rr}`); ({ files, p } = await acceptBest(run, outs, files, p)); }
  return { files, p, first, stage1Text: prev };
}
// run a policy on a task and score it
export async function runPolicy(task, tag, policy, opts = {}) {
  const run = new Run(task, tag, opts.limits || limitsFor(task)); const t0 = Date.now(); let res, error = null;
  try { res = await policy(run); } catch (e) { error = String(e.message || e).slice(0, 200); res = { files: {}, p: null }; if (e instanceof CapError) throw e; }
  const ev = await evaluate(task, res.files); const pkgAcc = task.pkgs.filter((p) => { const e = Object.entries(ev.final.files).filter(([f]) => f.split('/')[1].startsWith(p.name + '__')); return e.length && e.every(([, v]) => v.pass === v.total); }).length;
  return { run, res, ev, rec: { task: task.id, k: task.k, tag, accepted: ev.final.allPass, probePass: ev.probe.allPass, falseSuccess: ev.probe.allPass && !ev.final.allPass, pkgAccepted: pkgAcc, finalFrac: +(ev.final.pass / ev.final.total).toFixed(3), probe: `${ev.probe.pass}/${ev.probe.total}`, final: `${ev.final.pass}/${ev.final.total}`, cost: +run.spent.toFixed(5), calls: run.calls, inTok: run.inTok, outTok: run.outTok, truncated: run.truncated, failedCalls: run.failedCalls, budgetHit: run.budgetHit, wallS: +((Date.now() - t0) / 1000).toFixed(1), error } };
}
