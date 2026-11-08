// Registers a simulation's hypothesis BEFORE running it.
// Usage: node sims/preregister.mjs <id> [note]
// Appends a line to results/sims/PREREGISTRATION.jsonl with date/time, sha256 of the code and the hypothesis text.
// Existing entries are historical and must never be edited (entries before the English translation use the original
// Portuguese ids; their code hashes refer to commit 4dc87c2).
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { RESULTS_DIR, ROOT, sha256File } from './lib.mjs';

const id = process.argv[2];
if (!id) { console.error('usage: node sims/preregister.mjs <id> [note]'); process.exit(1); }
const file = join(ROOT, 'sims', `${id}.mjs`);
const mod = await import(file);
mkdirSync(RESULTS_DIR, { recursive: true });
const entry = {
  registered_at: new Date().toISOString(),
  id, version: mod.VERSION, code_sha256: sha256File(file),
  note: process.argv[3] || 'registered before the first run',
  hypothesis: mod.HYPOTHESIS,
};
appendFileSync(join(RESULTS_DIR, 'PREREGISTRATION.jsonl'), JSON.stringify(entry) + '\n');
console.log(`preregistered ${id} v${mod.VERSION} sha256=${entry.code_sha256.slice(0, 16)} at ${entry.registered_at}`);
