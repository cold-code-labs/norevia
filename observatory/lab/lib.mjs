// LAB-001 common harness: model layer (own ledger, hard cap), Run API (per-run call/USD ceiling checked before every call,
// critical-path latency, token/message accounting). Model-agnostic: model/effort are parameters (env LAB_MODEL, LAB_EFFORT).
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { spawn } from 'node:child_process'; import { randomBytes } from 'node:crypto';
import { runTask, listFiles } from '../lib/testrun.mjs';
import { SYSTEM_SOLVER } from '../lib/prompt.mjs';
export const HERE = '/data/OpenBot/Shared/Norevia/norevia/observatory/lab';
export const RESULTS = '/data/OpenBot/Shared/Norevia/norevia/results/lab001';
export const LEDGER = path.join(RESULTS, 'ledger.jsonl');
export const HARD_CAP = 25;                                   // US$ — approved budget; never exceeded
export const CAP = Math.min(HARD_CAP, Number(process.env.LAB_CAP_USD || HARD_CAP));
export const MODEL = process.env.LAB_MODEL || 'haiku', EFFORT = process.env.LAB_EFFORT || 'low';
const CLI = process.env.CLAUDE_CODE_EXECPATH;
// Per-call spending guard (--max-budget-usd) and reservation; the reservation is held while the call is in flight.
const CALL_MAX = { haiku: Number(process.env.LAB_CALL_MAX || 0.30), sonnet: 1.2, opus: 3 }[MODEL] ?? 0.5;
// Cost estimate for the per-run ceiling (fitted from the ledger; see PREREG): usd ≈ EST_FIXED + EST_PER_CHAR × promptChars + EST_OUT × expectedOutChars
export const EST = { fixed: Number(process.env.EST_FIXED || 0.003), perChar: Number(process.env.EST_PER_CHAR || 2.1e-7), out: Number(process.env.EST_OUT || 1.1e-7) };
fs.mkdirSync(RESULTS, { recursive: true });
let total = fs.existsSync(LEDGER) ? fs.readFileSync(LEDGER, 'utf8').split('\n').filter(Boolean).reduce((s, l) => s + (JSON.parse(l).cost_usd || 0), 0) : 0;
let reserve = 0, active = 0; const waiters = []; export const MAXC = Number(process.env.LAB_CONCURRENCY || 6);
export const spent = () => total;
const acq = async () => { if (active < MAXC) { active++; return; } await new Promise((r) => waiters.push(r)); active++; };
const rel = () => { active--; waiters.shift()?.(); };
function exec(args, input, cwd, ms) { return new Promise((res) => { const c = spawn(CLI, args, { cwd, env: { ...process.env, CLAUDE_CODE_MAX_OUTPUT_TOKENS: '64000' }, stdio: ['pipe', 'pipe', 'pipe'] }); let o = '', e = ''; c.stdout.on('data', (d) => (o += d)); c.stderr.on('data', (d) => { if (e.length < 5000) e += d; }); const t = setTimeout(() => c.kill('SIGKILL'), ms); c.on('close', () => { clearTimeout(t); res({ o, e }); }); c.stdin.end(input); }); }
export class CapError extends Error {}
export async function callModel({ prompt, system, meta = {}, model = MODEL, effort = EFFORT }) {
  await acq();
  try {
    if (total + reserve + CALL_MAX > CAP) throw new CapError(`CAP: spent ${total.toFixed(3)} of ${CAP}`);
    reserve += CALL_MAX;
    const cwd = path.join(os.tmpdir(), 'lab001-' + randomBytes(5).toString('hex')); fs.mkdirSync(cwd);
    const args = ['-p', '--model', model, '--effort', effort, '--output-format', 'json', '--tools', '', '--system-prompt', system, '--setting-sources', '', '--strict-mcp-config', '--no-session-persistence', '--disable-slash-commands', '--safe-mode', '--max-budget-usd', String(CALL_MAX)];
    const acc = { cost: 0, inTok: 0, outTok: 0, ms: 0, attempts: 0 };
    try {
      for (let a = 1; a <= 2; a++) {
        const t0 = Date.now(); const r = await exec(args, prompt, cwd, 900000);
        let j = null; try { j = JSON.parse(r.o); } catch {}
        const ok = !!(j && !j.is_error && j.subtype === 'success'); const u = j?.usage || {}; const c = j?.total_cost_usd || 0;
        const rec = { ts: new Date().toISOString(), ...meta, model, effort, attempt: a, ok, cost_usd: c, in: (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0), out: u.output_tokens || 0, promptChars: prompt.length, ms: Date.now() - t0, error: ok ? null : (j ? String(j.result || j.subtype).slice(0, 200) : r.e.slice(0, 200)) };
        fs.appendFileSync(LEDGER, JSON.stringify(rec) + '\n'); total += c;
        acc.cost += c; acc.inTok += rec.in; acc.outTok += rec.out; acc.ms += rec.ms; acc.attempts = a;
        if (ok) return { text: j.result, ...acc };
        if (total + reserve > CAP - CALL_MAX) break;      // no room for a retry under the cap
        await new Promise((s) => setTimeout(s, 3000 * a));
      }
      return { text: null, ...acc };
    } finally { reserve -= CALL_MAX; fs.rmSync(cwd, { recursive: true, force: true }); }
  } finally { rel(); }
}

// ---------- tasks
export const TASKS = path.join(HERE, 'tasks');
export const INDEX = () => JSON.parse(fs.readFileSync(path.join(TASKS, 'index.json'), 'utf8'));
export function loadTask(id) {
  const dir = path.join(TASKS, id); const meta = JSON.parse(fs.readFileSync(path.join(dir, 'task.json'), 'utf8'));
  const read = (sub) => Object.fromEntries(listFiles(path.join(dir, sub)).map((f) => [`${sub}/${f}`, fs.readFileSync(path.join(dir, sub, f), 'utf8')]));
  return { id, dir, ...meta, src: read('src'), probe: read('probe'), expected: INDEX()[id].expected };
}

// ---------- Run API
export class Clock { lat = 0; }
export class Run {
  constructor(task, arm, rep, limits, phase) {
    Object.assign(this, { task, arm, rep, phase, maxCalls: limits.maxCalls, maxUsd: limits.maxUsd, cost: 0, inTok: 0, outTok: 0, calls: 0, inflight: 0, inflightUsd: 0, budgetHit: false, callFailures: 0, msgs: 0, msgChars: 0, events: [], transcript: [], files: {}, root: new Clock() });
  }
  set(files) { this.files = files; }
  estimate(prompt, outChars = 0) { return EST.fixed + EST.perChar * prompt.length + EST.out * outChars; }
  // Budget check BEFORE every call: call count and USD (spent + in-flight estimates). Returns {text:null,budget:true} instead of calling when the ceiling would be exceeded.
  async call(role, prompt, { system = SYSTEM_SOLVER, clock = this.root, outChars } = {}) {
    const est = this.estimate(prompt, outChars);
    if (this.calls + this.inflight >= this.maxCalls || this.cost + this.inflightUsd + est > this.maxUsd) { this.budgetHit = true; return { text: null, budget: true, cost: 0, ms: 0, inTok: 0, outTok: 0 }; }
    this.inflight++; this.inflightUsd += est;
    let r; try { r = await callModel({ prompt, system, meta: { phase: this.phase, task: this.task.id, arm: this.arm, rep: this.rep, role } }); } finally { this.inflight--; this.inflightUsd -= est; }
    this.calls++; this.cost += r.cost; this.inTok += r.inTok; this.outTok += r.outTok; clock.lat += r.ms; if (r.text == null) this.callFailures++;
    this.transcript.push({ role, promptChars: prompt.length, cost: r.cost, ok: r.text != null, ms: r.ms, response: r.text });
    return r;
  }
  async probe(files, clock = this.root) { const t0 = Date.now(); const p = (await runTask({ taskDir: this.task.dir, overlay: files, suites: ['probe'], expected: this.task.expected })).probe; clock.lat += Date.now() - t0; return p; }
  // parallel branches: each branch gets its own clock; the critical path adds the slowest branch
  async par(fns, clock = this.root) { const bs = fns.map(() => new Clock()); const out = await Promise.all(fns.map((f, i) => f(bs[i]))); clock.lat += Math.max(0, ...bs.map((b) => b.lat)); return out; }
}
// Matched per-run ceiling (same for every arm): calls ≤ 2k+4; USD ≤ 0.02 + 0.0001 × LOC (≈ 5× the expected cost of one whole-repo SOLO call chain, fitted on the cost probe).
export const limitsFor = (task) => ({ maxCalls: 2 * task.k + 4, maxUsd: +(0.02 + 0.0001 * task.pkgs.reduce((s, p) => s + p.loc, 0)).toFixed(3) });
