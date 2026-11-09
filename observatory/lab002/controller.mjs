// LAB-002 — controller + threads demonstration.
// Controller: single point of contact; submit(request) returns an ack immediately and runs the request in a thread (a background promise).
// A thread is a worker agent with an environment manifest. It may unfold into child threads (depth ≤ 1) under a shared per-request budget.
// Policies (arms): CTRL = individual first, unfold on threshold (work exceeds one context, or probe fails on independent packages), + memory (playbook);
// CTRL-NOMEM = same without the playbook; ALWAYS = every request unfolds up front; SOLO-SEQ = no controller: requests handled one after another by one agent (conversation blocked).
import fs from 'node:fs'; import path from 'node:path';
import { call, CapError, estCost, SAFETY, OUT } from './api.mjs';
import { loadTask } from '../lab/lib.mjs';
import { runTask } from '../lib/testrun.mjs';
import { parseFiles, parseJson, SYSTEM_SOLVER } from '../lib/prompt.mjs';
import { REQUESTS } from './requests.mjs';

const UNFOLD_CHARS = 150000;          // "exceeds one comfortable context"
const block = (k, v) => `--- ${k} ---\n${v.replace(/\s+$/, '')}\n--- end ${k} ---`;
const MANIFEST = (th) => `\n\nENVIRONMENT MANIFEST (you are a worker thread in a controller harness): you have no tools and cannot run code; the only feedback you get is the visible checks the controller shows you. You work for one request and have a budget of ${th.budget.maxCalls} calls / US$ ${th.budget.maxUsd.toFixed(3)} shared with your request. You do not spawn threads yourself: the controller unfolds work into child threads when it exceeds one context or independent parts fail. Be concise and return exactly the format asked.`;
class Budget { constructor(maxUsd, maxCalls) { Object.assign(this, { maxUsd, maxCalls, spent: 0, calls: 0, inflight: 0, tokensIn: 0, tokensOut: 0 }); } }
const kp = (p, k) => { const e = Object.entries(p.files).filter(([f]) => f.startsWith(`probe/${k}__`)); const pass = e.reduce((s, [, v]) => s + v.pass, 0), total = e.reduce((s, [, v]) => s + v.total, 0); return { pass, total, ok: total > 0 && pass === total }; };

export class Controller {
  constructor({ mode, memory, tag }) { Object.assign(this, { mode, memory, tag, playbook: {}, threads: [], timeline: [], t0: Date.now() }); }
  log(th, ev) { this.timeline.push({ t: +((Date.now() - this.t0) / 1000).toFixed(1), thread: th.id, ev }); }
  status() { const t0 = Date.now(); const s = this.threads.filter((t) => !t.parent).map((t) => ({ id: t.id, state: t.state, children: t.children, cost: +t.budget.spent.toFixed(4) })); return { ms: Date.now() - t0, s }; }
  // single point of contact: ack immediately, work in a thread
  submit(req) { const t = Date.now(); const th = { id: req.id, req, parent: null, state: 'running', children: 0, unfolded: false, events: [], budgetHit: false, error: null, tSub: t, budget: null }; this.threads.push(th); const ack = Date.now() - t; th.ackMs = ack; this.log(th, `ack in ${ack} ms`); th.promise = this.run(th); return th; }
  async agent(th, role, prompt, system = SYSTEM_SOLVER, maxTokens = 32000) {
    const b = th.budget; const est = estCost(prompt.length + system.length, Math.min(maxTokens, 16000));
    if (b.calls >= b.maxCalls || b.spent + b.inflight + est > b.maxUsd) { th.budgetHit = true; return null; }
    b.inflight += est; b.calls++;
    let r; try { r = await call({ system: system + MANIFEST(th), prompt, maxTokens, meta: { arm: this.tag, request: th.req.id, role } }); } finally { b.inflight -= est; }
    b.spent += r?.cost || 0; b.tokensIn += r?.inTok || 0; b.tokensOut += r?.outTok || 0; return r?.text ?? null;
  }
  async run(th) {
    const req = th.req; const t0 = Date.now();
    try { th.budget = this.budgetFor(req); const out = await ({ repo: this.repo, qa: this.text, lp: this.text })[req.type].call(this, th, req); th.result = out; th.state = 'done'; }
    catch (e) { th.error = String(e.message || e).slice(0, 200); th.state = 'error'; }
    th.wallS = +((Date.now() - t0) / 1000).toFixed(1); this.log(th, `${th.state} (${th.wallS}s, $${th.budget?.spent.toFixed(4)}, ${th.budget?.calls} calls, unfolded=${th.unfolded})`);
    return th;
  }
  budgetFor(req) { if (req.type === 'repo') { const t = this.task(req); return new Budget(+(0.03 + 0.00006 * t.pkgs.reduce((s, p) => s + p.loc, 0)).toFixed(3), 2 * t.k + 4); } return new Budget(0.06, 8); }
  task(req) { return (this._tasks ||= {})[req.taskId] ||= (() => { const t = loadTask(req.taskId); t.promptChars = t.statement.length + Object.values(t.src).reduce((s, x) => s + x.length, 0) + Object.values(t.probe).reduce((s, x) => s + x.length, 0); return t; })(); }

  // ---------- qa / lp requests (text, programmatic checks)
  async text(th, req) {
    const vis = req.checks.filter((c) => c.visible); const failing = (txt, set) => set.filter((c) => !c.fn(txt));
    const book = (this.playbook[req.type] ||= []);                         // memory is keyed by request type (Amendment 2: the first version mixed types)
    const pb = this.memory && book.length ? `\n\nPlaybook from earlier threads (house standards learned from checks that failed before — follow them):\n${book.map((a) => `- ${a}`).join('\n')}` : '';
    if (pb) th.usedPlaybook = true;
    let txt = null; const SYS = req.type === 'lp' ? 'You are a front-end engineer. Return exactly one complete HTML document and nothing else.' : 'You are a concise technical writer.';
    if (this.mode === 'always') {                                           // unfold up front: planner → parts in child threads → merger
      th.unfolded = true; this.log(th, 'unfold up front: planner');
      const plan = await this.agent(th, 'planner', `${req.prompt}\n\nSplit the work into exactly 3 independent parts for parallel workers. Output ONLY JSON: {"parts":[{"name":"...","brief":"..."}]}`, 'You are a lead who splits work. Output only JSON.', 2000);
      const parts = (parseJson(plan || '')?.parts || []).slice(0, 3); if (!parts.length) parts.push({ name: 'all', brief: req.prompt });
      th.children = parts.length;
      const outs = await Promise.all(parts.map((p) => this.agent(th, `worker-${p.name}`, `Overall request:\n${req.prompt}\n\nYour part only: ${p.name} — ${p.brief}\nProduce just your part (${req.type === 'lp' ? 'an HTML fragment of <section> elements, no <html>/<head>' : 'your sentences'}).`, SYS, 8000)));
      txt = await this.agent(th, 'merger', `Overall request:\n${req.prompt}\n\nParts from workers:\n${outs.map((o, i) => `### ${parts[i].name}\n${o || '(missing)'}`).join('\n\n')}\n\nMerge them into the final deliverable${req.type === 'lp' ? ' (one complete HTML document)' : ' (at most 4 sentences)'}. Return only the deliverable.`, SYS, 16000);
    } else {
      txt = await this.agent(th, 'solo', `${req.prompt}${pb}`, SYS, 16000);       // individual first (CTRL, CTRL-NOMEM, SOLO-SEQ)
    }
    let out = txt == null ? '' : req.extract(txt);
    const f1 = failing(out, vis); th.firstPassVisibleFails = f1.map((c) => c.id);
    if (f1.length && !th.budgetHit) {                                      // one repair from the visible checks; parts of an LP/answer are not independent → no unfold
      const r = await this.agent(th, 'repair', `${req.prompt}${pb}\n\nYour previous answer:\n${out}\n\nVisible checks that failed:\n${f1.map((c) => `- ${c.advice}`).join('\n')}\n\nReturn the corrected deliverable only.`, SYS, 16000);
      if (r != null) out = req.extract(r);
    }
    const fv = failing(out, vis), ff = failing(out, req.checks);
    th.visiblePass = fv.length === 0; th.accepted = ff.length === 0; th.failed = ff.map((c) => c.id);
    if (this.memory) for (const c of f1) if (!book.includes(c.advice)) book.push(c.advice);   // distil: visible-check failures become playbook rules
    th.output = out; return out;
  }

  // ---------- repo request (multi-package repair; probe visible, final hidden)
  async repo(th, req) {
    const t = this.task(req), kits = t.pkgs.map((p) => p.name); const own = (k) => t.pkgs.find((p) => p.name === k).srcFiles; let files = {};
    const probe = async (f) => (await runTask({ taskDir: t.dir, overlay: f, suites: ['probe'], expected: t.expected })).probe;
    const repoPrompt = (f, extra = '') => `# Task: repository of ${t.k} packages\n\n## Specification and reported problems\n${t.statement}\n\n## Source files (current)\n${Object.entries({ ...t.src, ...f }).map(([k, v]) => block(k, v)).join('\n\n')}\n\n## Probe tests (a larger hidden suite also checks the full specification)\n${Object.entries(t.probe).map(([k, v]) => block(k, v)).join('\n\n')}${extra ? '\n\n' + extra : ''}\n\nFix the bugs so every package satisfies its full specification. Return complete changed files in the mandatory block format.`;
    const pkgPrompt = (k, f, extra) => { const p = t.pkgs.find((x) => x.name === k); return `# Task: package ${k} of a ${t.k}-package repository\n\nOther packages belong to other threads; change ONLY files under src/${k}/.\n\n## Specification\n${p.statement}\n\n## Source files (current)\n${Object.entries({ ...t.src, ...f }).filter(([n]) => n.startsWith(`src/${k}/`)).map(([n, v]) => block(n, v)).join('\n\n')}\n\n## Probe tests\n${Object.entries(t.probe).filter(([n]) => n.startsWith(`probe/${k}__`)).map(([n, v]) => block(n, v)).join('\n\n')}\n\n${extra}\n\nReturn complete changed files in the mandatory block format.`; };
    const failTxt = (p, k) => (p.failures || []).filter((f) => f.file.startsWith(`probe/${k}__`)).slice(0, 10).map((f) => `- ${f.name}: ${f.message}`).join('\n') || '(all probe tests pass)';
    const unfold = async (ks, role, p) => {                                // children: one package-owner thread each (package-only context), accept per package if probe not worse
      th.unfolded = true; th.children += ks.length; this.log(th, `unfold ${role}: ${ks.length} child threads`);
      const outs = await Promise.all(ks.map(async (k) => { const r = await this.agent(th, `${role}-${k}`, pkgPrompt(k, files, kp(p, k).ok ? 'The probe tests for this package pass; hidden tests may still reveal defects — re-read the specification carefully.' : `## Probe failures\n${failTxt(p, k)}`)); return { k, files: r ? parseFiles(r, own(k)) : {} }; }));
      const cand = { ...files }; for (const o of outs) Object.assign(cand, o.files); const pn = await probe(cand); const next = { ...files };
      for (const o of outs) if (kp(pn, o.k).pass >= kp(p, o.k).pass) Object.assign(next, o.files);
      files = next; return probe(files);
    };
    let p = await probe(files);
    const upFront = this.mode === 'always' || (this.mode === 'threshold' && t.promptChars > UNFOLD_CHARS);
    if (this.mode === 'solo' || !upFront) {                                // individual first
      const r = await this.agent(th, 'solo', repoPrompt(files)); files = r ? parseFiles(r, Object.keys(t.src)) : {}; p = await probe(files);
      if (this.mode === 'solo') for (let i = 0; i < 2 && !p.allPass && !th.budgetHit; i++) { const rr = await this.agent(th, 'solo-repair', repoPrompt(files, `## Probe results: ${p.pass}/${p.total}\n${(p.failures || []).slice(0, 12).map((f) => `- [${f.file}] ${f.name}: ${f.message}`).join('\n')}\n\nReturn every file you change.`)); const nx = { ...files, ...(rr ? parseFiles(rr, Object.keys(t.src)) : {}) }; const pn = await probe(nx); if (pn.pass >= p.pass) { files = nx; p = pn; } }
    } else p = await unfold(kits, 'owner', p);
    if (this.mode !== 'solo') {
      for (let rr = 1; rr <= 2 && !th.budgetHit; rr++) { const bad = kits.filter((k) => !kp(p, k).ok); if (!bad.length) break; p = await unfold(bad, `repair${rr}`, p); }
      if (th.unfolded && !th.budgetHit) p = await unfold(kits, 'patrol', p);   // team formed → probe-silent re-review of every package (LAB-001 finding)
    }
    th.files = files; const ev = await runTask({ taskDir: t.dir, overlay: files, suites: ['probe', 'final'], expected: t.expected });
    th.visiblePass = ev.probe.allPass; th.accepted = ev.final.allPass; th.finalFrac = +(ev.final.pass / ev.final.total).toFixed(3); th.probe = `${ev.probe.pass}/${ev.probe.total}`; th.final = `${ev.final.pass}/${ev.final.total}`; return files;
  }
}

export async function runArm(arm, rep) {
  const cfg = { 'CTRL': { mode: 'threshold', memory: true }, 'CTRL-NOMEM': { mode: 'threshold', memory: false }, 'ALWAYS': { mode: 'always', memory: false }, 'SOLO-SEQ': { mode: 'solo', memory: false } }[arm];
  const REQS = process.env.D_REQS ? REQUESTS.filter((r) => process.env.D_REQS.split(',').includes(r.id)) : REQUESTS; const c = new Controller({ ...cfg, tag: `${arm}.r${rep}` }); const t0 = Date.now(); const done = [];
  const finish = (th) => { th.endT = (Date.now() - t0) / 1000; done.push(th); };
  if (arm === 'SOLO-SEQ') {                                                 // no controller: one agent, one request at a time; the conversation is blocked until each one finishes
    for (const req of REQS) { const waited = (Date.now() - t0) / 1000; const th = c.submit(req); th.ackMs = Math.round(waited * 1000); await th.promise; finish(th); }
  } else {
    const roots = {}; const polls = []; const iv = setInterval(() => polls.push(c.status().ms), 15000);
    for (const req of REQS.filter((r) => !r.after)) { const th = c.submit(req); roots[req.id] = th; th.promise.then(() => finish(th)); }
    for (const req of REQS.filter((r) => r.after && REQS.some((q) => q.id === r.after))) { await roots[req.after].promise; const th = c.submit(req); roots[req.id] = th; th.promise.then(() => finish(th)); }   // follow-up request after its predecessor
    await Promise.all(Object.values(roots).map((r) => r.promise)); clearInterval(iv); c.statusPollMs = polls;
  }
  const wallS = +((Date.now() - t0) / 1000).toFixed(1);
  return { arm, rep, wallS, mainBlockedS: arm === 'SOLO-SEQ' ? wallS : 0, maxAckMs: Math.max(...c.threads.map((t) => t.ackMs)), statusPollMaxMs: Math.max(0, ...(c.statusPollMs || [0])), playbook: c.playbook, timeline: c.timeline, threads: c.threads };
}
