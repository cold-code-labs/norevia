// LAB-004 model layer (cap US$ 15, own ledger; single process only): Anthropic Messages API (streaming), key read from ANTHROPIC_API_KEY or the file named by ANTHROPIC_API_KEY_FILE (never printed),
// own ledger, HARD CAP in code. Cost = tokens × price table (litellm table: US$0.10/M in, US$0.50/M out; NOT checked against an invoice);
// the cap counts cost × SAFETY (1.5) and every call reserves its worst case before it starts.
import fs from 'node:fs'; import path from 'node:path';
export const OUT = '/data/OpenBot/Shared/Norevia/norevia/results/lab004';
export const LEDGER = path.join(OUT, 'ledger.jsonl'); export const HARD_CAP = 15;
export const CAP = Math.min(HARD_CAP, Number(process.env.L4_CAP || HARD_CAP));
export const MODEL = process.env.L4_MODEL || 'claude-haiku-5-5';
const KEY = (process.env.ANTHROPIC_API_KEY || fs.readFileSync(process.env.ANTHROPIC_API_KEY_FILE, 'utf8')).trim();
export const PRICE = { in: 1e-7, out: 5e-7 }, SAFETY = 1.5, CHARS_PER_TOKEN = 2.0;
export const estCost = (chars, outTok) => (chars / CHARS_PER_TOKEN) * PRICE.in + outTok * PRICE.out;
fs.mkdirSync(OUT, { recursive: true });
let counted = fs.existsSync(LEDGER) ? fs.readFileSync(LEDGER, 'utf8').split('\n').filter(Boolean).reduce((s, l) => s + (JSON.parse(l).counted || 0), 0) : 0;
let reserve = 0, active = 0; const waiters = []; const MAXC = Number(process.env.L4_CONCURRENCY || 150);
export const spentCounted = () => counted;
export class CapError extends Error {}
const acq = async () => { if (active < MAXC) { active++; return; } await new Promise((r) => waiters.push(r)); active++; };
const rel = () => { active--; waiters.shift()?.(); };
export async function call({ system, prompt, meta = {}, maxTokens = 32000, prefill = '' }) {
  await acq();
  try {
    const worst = estCost(system.length + prompt.length, maxTokens) * SAFETY;
    if (counted + reserve + worst > CAP) throw new CapError(`CAP: counted ${counted.toFixed(3)} + in-flight ${reserve.toFixed(3)} + worst ${worst.toFixed(3)} > ${CAP}`);
    reserve += worst;
    try {
      let last = null;
      for (let a = 1; a <= 3; a++) {
        const t0 = Date.now(); let text = '', inTok = 0, outTok = 0, stop = null, status = 0, err = null;
        try {
          const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, ...(process.env.L4_THINKING !== 'on' ? { thinking: { type: 'disabled' } } : {}), system, messages: [{ role: 'user', content: prompt }, ...(prefill ? [{ role: 'assistant', content: prefill }] : [])], ...(prefill ? { stop_sequences: ['\n```'] } : {}), stream: true }) });
          status = r.status;
          if (!r.ok) err = (await r.text()).slice(0, 300);
          else { const rd = r.body.getReader(), dec = new TextDecoder(); let buf = ''; for (;;) { const { done, value } = await rd.read(); if (done) break; buf += dec.decode(value, { stream: true }); let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!line.startsWith('data:')) continue; let j; try { j = JSON.parse(line.slice(5)); } catch { continue; } if (j.type === 'message_start') inTok = (j.message.usage.input_tokens || 0) + (j.message.usage.cache_read_input_tokens || 0) + (j.message.usage.cache_creation_input_tokens || 0); else if (j.type === 'content_block_delta' && j.delta?.type === 'text_delta') text += j.delta.text; else if (j.type === 'message_delta') { outTok = j.usage?.output_tokens ?? outTok; stop = j.delta?.stop_reason ?? stop; } else if (j.type === 'error') err = JSON.stringify(j.error).slice(0, 300); } } }
        } catch (e) { err = String(e.message || e).slice(0, 300); }
        const cost = inTok * PRICE.in + outTok * PRICE.out; const ok = !err && status === 200 && text.length > 0; counted += cost * SAFETY;
        fs.appendFileSync(LEDGER, JSON.stringify({ ts: new Date().toISOString(), ...meta, model: MODEL, attempt: a, ok, status, in: inTok, out: outTok, cost_est: +cost.toFixed(6), counted: +(cost * SAFETY).toFixed(6), stop, ms: Date.now() - t0, error: ok ? null : err }) + '\n');
        last = { text: ok ? (prefill + text) : null, inTok, outTok, cost, ms: Date.now() - t0, stop, status, err };
        if (ok) return last;
        if (![429, 500, 529, 0].includes(status) || a === 3) break;
        await new Promise((s) => setTimeout(s, 4000 * a));
      }
      return last;
    } finally { reserve -= worst; }
  } finally { rel(); }
}
