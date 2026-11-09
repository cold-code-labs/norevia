// Execution context for one (task, architecture, repetition): calls, visible
// tests, accounting of cost/tokens/critical-path latency and rework.
import { randomBytes } from 'node:crypto';
import { callModel } from './llm.mjs';
import { runTask } from './testrun.mjs';
import { parseFiles, taskPrompt, SYSTEM_SOLVER } from './prompt.mjs';

export class JobCtx {
  constructor({ task, arch, rep, phase, budgetUsd = 2.0 }, shared = null, lat = 0) {
    this.task = task; this.arch = arch; this.rep = rep; this.phase = phase; this.budgetUsd = budgetUsd;
    this.s = shared || { cost: 0, inTok: 0, outTok: 0, cacheRead: 0, cacheWrite: 0, calls: 0, reworkCalls: 0, testRuns: 0, candidates: 0, failedCalls: 0, transcript: [], events: [] };
    this.lat = lat;
    this.allowed = Object.keys(task.src);
  }
  fork() { return new JobCtx({ task: this.task, arch: this.arch, rep: this.rep, phase: this.phase, budgetUsd: this.budgetUsd }, this.s, 0); }
  get spent() { return this.s.cost; }
  get remaining() { return this.budgetUsd - this.s.cost; }
  log(ev) { this.s.events.push(ev); }

  /** LLM call. rework=true when the input includes a previous candidate to be revised. */
  async call({ role, model, effort, prompt, system = SYSTEM_SOLVER, rework = false }) {
    const call_id = randomBytes(5).toString('hex');
    const r = await callModel({ prompt, system, model, effort, meta: { phase: this.phase, run: `${this.task.id}|${this.arch}|${this.rep}`, task: this.task.id, arch: this.arch, rep: this.rep, role, call_id } });
    this.s.cost += r.cost; this.s.inTok += r.inTok; this.s.outTok += r.outTok; this.s.cacheRead += r.cacheRead; this.s.cacheWrite += r.cacheWrite;
    this.s.calls += 1; if (rework) this.s.reworkCalls += 1; if (!r.ok) this.s.failedCalls += 1;
    this.lat += r.latencyMs;
    this.s.transcript.push({ role, model, effort, ok: r.ok, error: r.error, cost: r.cost, outTok: r.outTok, latencyMs: r.latencyMs, promptChars: prompt.length, response: r.text });
    return r;
  }

  /** Solver call: returns proposed files (may be {}). */
  async solve({ role = 'solver', model, effort, extra = '', editable = null, rework = false }) {
    const r = await this.call({ role, model, effort, prompt: taskPrompt(this.task, { editable, extra }), rework });
    const files = parseFiles(r.text, editable || this.allowed);
    this.s.candidates += 1;
    return { files, raw: r };
  }

  /** Runs only the VISIBLE tests (the only signal architectures may use). */
  async testVisible(files) {
    const t0 = Date.now();
    const r = await runTask({ taskDir: this.task.dir, overlay: files, suites: ['visible'], expected: this.task.expected });
    this.lat += Date.now() - t0; this.s.testRuns += 1;
    return r.visible;
  }

  /** Runs branches in parallel; critical-path latency = max over branches. */
  async par(fns) {
    const lats = [];
    const res = await Promise.all(fns.map(async (f) => { const sub = this.fork(); const out = await f(sub); lats.push(sub.lat); return out; }));
    this.lat += Math.max(0, ...lats);
    return res;
  }
}

/** Select by most visible tests passing; tie → most frequent candidate (vote), then the first. */
export function selectBest(cands) {
  const key = (c) => JSON.stringify(Object.entries(c.files).sort());
  const freq = {};
  for (const c of cands) freq[key(c)] = (freq[key(c)] || 0) + 1;
  return [...cands].map((c, i) => ({ c, i })).sort((x, y) => (y.c.test.pass - x.c.test.pass) || (freq[key(y.c)] - freq[key(x.c)]) || (x.i - y.i))[0].c;
}
