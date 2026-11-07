// Registra a hipótese de uma simulação ANTES de executá-la.
// Uso: node sims/preregister.mjs <id> [nota]
// Acrescenta uma linha a results/sims/PREREGISTRO.jsonl com data/hora, sha256 do código e o texto da hipótese.
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { RESULTS_DIR, ROOT, sha256File } from './lib.mjs';

const id = process.argv[2];
if (!id) { console.error('uso: node sims/preregister.mjs <id> [nota]'); process.exit(1); }
const file = join(ROOT, 'sims', `${id}.mjs`);
const mod = await import(file);
mkdirSync(RESULTS_DIR, { recursive: true });
const entry = {
  registered_at: new Date().toISOString(),
  id, version: mod.VERSION, code_sha256: sha256File(file),
  note: process.argv[3] || 'registro antes da primeira execução',
  hypothesis: mod.HYPOTHESIS,
};
appendFileSync(join(RESULTS_DIR, 'PREREGISTRO.jsonl'), JSON.stringify(entry) + '\n');
console.log(`pré-registrado ${id} v${mod.VERSION} sha256=${entry.code_sha256.slice(0, 16)} em ${entry.registered_at}`);
