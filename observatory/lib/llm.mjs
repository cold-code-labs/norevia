// Headless Claude CLI call layer + persistent ledger with a global cap.
// Each call: cwd in an empty temp dir, no tools, own system prompt, no
// settings/MCP/CLAUDE.md/persisted session, --max-budget-usd per call.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { OBS_DIR, TMP_DIR } from './testrun.mjs';

export const RESULTS_DIR = path.resolve(OBS_DIR, '..', 'results', 'observatory');
export const LEDGER = path.join(RESULTS_DIR, 'ledger.jsonl');
export const GLOBAL_CAP_USD = Number(process.env.OBS_GLOBAL_CAP_USD || 250);
const CLI = process.env.CLAUDE_CODE_EXECPATH;

export const MODELS = { haiku: 'claude-haiku-5-5', sonnet: 'claude-sonnet-5-5', opus: 'claude-opus-5-5' };
// Per-call reservation (hard limit passed to the CLI via --max-budget-usd).
export const PER_CALL_CAP = { haiku: 0.5, sonnet: 1.5, opus: 4.0 };

export function ledgerTotal() {
  if (!fs.existsSync(LEDGER)) return 0;
  let t = 0;
  for (const l of fs.readFileSync(LEDGER, 'utf8').split('\n')) { if (!l.trim()) continue; try { t += JSON.parse(l).cost_usd || 0; } catch {} }
  return t;
}

let inflightReserve = 0;
let active = 0;
const waiters = [];
export let MAX_CONCURRENCY = Number(process.env.OBS_CONCURRENCY || 5);
export function setConcurrency(n) { MAX_CONCURRENCY = n; }
async function acquire() { if (active < MAX_CONCURRENCY) { active++; return; } await new Promise((r) => waiters.push(r)); active++; }
function release() { active--; const w = waiters.shift(); if (w) w(); }

export class BudgetExceeded extends Error {}

function runCli(args, input, cwd, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(CLI, args, { cwd, env: { ...process.env }, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '', timedOut = false;
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => { if (err.length < 20000) err += d; });
    const t = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, timeoutMs);
    child.on('close', (code) => { clearTimeout(t); resolve({ code, out, err, timedOut }); });
    child.stdin.end(input);
  });
}

/**
 * @returns {Promise<{text:string, cost:number, inTok:number, outTok:number, cacheRead:number, cacheWrite:number, latencyMs:number, ok:boolean, error?:string}>}
 */
export async function callModel({ prompt, system, model, effort, meta = {}, timeoutMs = 600000 }) {
  const cap = PER_CALL_CAP[model];
  await acquire();
  try {
    const spent = ledgerTotal();
    if (spent + inflightReserve + cap > GLOBAL_CAP_USD) throw new BudgetExceeded(`global cap: spent ${spent.toFixed(2)} + reserved ${inflightReserve.toFixed(2)} + ${cap} > ${GLOBAL_CAP_USD}`);
    inflightReserve += cap;
    const cwd = path.join(TMP_DIR, 'call-' + randomBytes(6).toString('hex'));
    fs.mkdirSync(cwd, { recursive: true });
    const args = ['-p', '--model', model, '--effort', effort, '--output-format', 'json', '--tools', '', '--system-prompt', system,
      '--setting-sources', '', '--strict-mcp-config', '--no-session-persistence', '--disable-slash-commands', '--safe-mode', '--max-budget-usd', String(cap)];
    let res, attempt = 0, rec, acc = { cost: 0, inTok: 0, outTok: 0, cacheRead: 0, cacheWrite: 0, wall: 0 };
    try {
      while (true) {
        attempt++;
        const t0 = Date.now();
        const r = await runCli(args, prompt, cwd, timeoutMs);
        const wall = Date.now() - t0;
        let j = null; try { j = JSON.parse(r.out); } catch {}
        const u = j?.usage || {};
        rec = {
          ts: new Date().toISOString(), ...meta, model, model_id: MODELS[model], effort, attempt,
          model_usage: j ? Object.fromEntries(Object.entries(j.modelUsage || {}).map(([k, v]) => [k, { cost: v.costUSD, in: v.inputTokens, out: v.outputTokens, cr: v.cacheReadInputTokens, cw: v.cacheCreationInputTokens }])) : null,
          cost_usd: j?.total_cost_usd || 0, input_tokens: u.input_tokens || 0, output_tokens: u.output_tokens || 0,
          cache_read_tokens: u.cache_read_input_tokens || 0, cache_write_tokens: u.cache_creation_input_tokens || 0,
          thinking_tokens: u.output_tokens_details?.thinking_tokens ?? null,
          latency_ms: j?.duration_ms ?? wall, wall_ms: wall, ok: !!(j && !j.is_error && j.subtype === 'success'),
          error: j ? (j.is_error ? (j.subtype + ': ' + String(j.result || j.api_error_status || '')).slice(0, 300) : null) : ('no JSON: ' + (r.timedOut ? 'timeout ' : '') + r.err.slice(0, 300)),
          prompt_chars: prompt.length, response_chars: j?.result?.length ?? 0,
        };
        fs.appendFileSync(LEDGER, JSON.stringify(rec) + '\n');
        acc.cost += rec.cost_usd; acc.inTok += rec.input_tokens + rec.cache_read_tokens + rec.cache_write_tokens; acc.outTok += rec.output_tokens; acc.cacheRead += rec.cache_read_tokens; acc.cacheWrite += rec.cache_write_tokens; acc.wall += wall;
        res = { text: j?.result ?? '', ...acc, latencyMs: acc.wall, ok: rec.ok, error: rec.error, attempts: attempt };
        // retry only transient failures (no JSON / API error), at most 3 attempts
        if (rec.ok || attempt >= 3 || (j && j.subtype === 'error_max_budget_usd')) break;
        if (ledgerTotal() + cap > GLOBAL_CAP_USD) break;
        await new Promise((r2) => setTimeout(r2, 5000 * attempt));
      }
      return res;
    } finally {
      inflightReserve -= cap;
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  } finally { release(); }
}
