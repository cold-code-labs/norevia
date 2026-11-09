// Per-call cost estimate (model, effort): mean of the last 40 ledger calls
// (bounded memory); conservative prior when there is no history.
import fs from 'node:fs';
import { LEDGER } from './llm.mjs';
const PRIOR = { 'haiku/low': 0.02, 'haiku/medium': 0.03, 'sonnet/medium': 0.10, 'opus/high': 0.40 };
let cache = null, cacheAt = 0;
export function estCost(model, effort) {
  if (!cache || Date.now() - cacheAt > 30000) {
    cache = {}; cacheAt = Date.now();
    if (fs.existsSync(LEDGER)) {
      const lines = fs.readFileSync(LEDGER, 'utf8').trim().split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((x) => x && x.ok && x.role !== 'smoke');
      for (const x of lines) (cache[`${x.model}/${x.effort}`] ||= []).push(x.cost_usd);
    }
  }
  const arr = (cache[`${model}/${effort}`] || []).slice(-40);
  if (arr.length < 5) return PRIOR[`${model}/${effort}`] ?? 0.2;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
