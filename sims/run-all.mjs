// Reruns every simulation, writes the JSON files and checks:
//  (1) determinism: the new JSON is byte-for-byte identical to the previous one (if it existed);
//  (2) consistency with the cards: every headline and every verdict in the JSON appears literally in the .md card;
//  (3) required card frontmatter (id, title, area=simulation, evidence=local-validation, non-empty summary);
//  (4) REPORT.md: per-simulation verdict lines and the total count.
// Usage: node sims/run-all.mjs [id ...]      Exit code 1 if any check fails.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { RESULTS_DIR, writeResult } from './lib.mjs';

export const SIMS = ['sim-correlated-vote', 'sim-verifier', 'sim-response-threshold', 'sim-stigmergy', 'sim-quorum', 'sim-elastic', 'sim-clonal'];
export const VERDICTS = ['supported', 'partially supported', 'not supported', 'inconclusive'];
export const verdictLine = (tests) => tests.map((t) => `${t.id}: ${t.verdict}`).join('; ');

const only = process.argv.slice(2);
let failures = 0;
const report = [];
for (const id of SIMS.filter((s) => only.length === 0 || only.includes(s))) {
  const mod = await import(`./${id}.mjs`);
  const t0 = Date.now();
  const out = mod.run();
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  const w = writeResult(id, out);
  const problems = [];
  if (w.changed) problems.push('JSON differs from the previous one (non-deterministic or code changed)');
  for (const t of out.tests) if (!VERDICTS.includes(t.verdict)) problems.push(`unknown verdict ${t.id}=${t.verdict}`);
  const mdPath = join(RESULTS_DIR, `${id}.md`);
  if (!existsSync(mdPath)) problems.push('.md card missing');
  else {
    const md = readFileSync(mdPath, 'utf8');
    const fm = md.match(/^---\n([\s\S]*?)\n---/);
    const need = { id: new RegExp(`^id: ${id}$`, 'm'), title: /^title: .+$/m, area: /^area: simulation$/m, evidence: /^evidence: local-validation$/m, summary: /^summary: .+$/m };
    if (!fm) problems.push('frontmatter missing');
    else for (const [k, re] of Object.entries(need)) if (!re.test(fm[1])) problems.push(`frontmatter: field ${k} missing/invalid`);
    if (/PENDING/.test(md)) problems.push('card still contains PENDING');
    if (!md.includes(`v${out.version}`)) problems.push(`card does not cite version v${out.version}`);
    for (const h of out.headline) if (!md.includes(h)) problems.push(`headline missing from card: "${h.slice(0, 90)}…"`);
    for (const t of out.tests) if (!md.includes(`| ${t.id} | **${t.verdict}** |`)) problems.push(`verdict ${t.id}=${t.verdict} not found in card`);
  }
  failures += problems.length;
  report.push({ id, version: out.version, secs, sha256: w.sha256, isNew: w.isNew, verdicts: verdictLine(out.tests), all: out.tests.map((t) => t.verdict), problems });
}
// (4) final report: verdict line per simulation and total count
const relPath = join(RESULTS_DIR, 'REPORT.md');
if (only.length === 0) {
  if (!existsSync(relPath)) { failures++; console.log('FAIL REPORT.md missing'); }
  else {
    const rel = readFileSync(relPath, 'utf8'); const relProblems = [];
    for (const r of report) if (!rel.includes(`- ${r.id} — ${r.verdicts}`)) relProblems.push(`verdict line for ${r.id} does not match`);
    const all = report.flatMap((r) => r.all);
    const cnt = (v) => all.filter((x) => x === v).length;
    const countLine = `${all.length} → ${cnt('supported')} \`supported\`, ${cnt('partially supported')} \`partially supported\`, ${cnt('not supported')} \`not supported\``;
    if (!rel.includes(countLine)) relProblems.push(`expected count missing: "${countLine}"`);
    if (!/^id: sim-report$/m.test(rel)) relProblems.push('frontmatter id sim-report missing');
    failures += relProblems.length;
    console.log(`${relProblems.length ? 'FAIL ' : 'OK   '} REPORT.md (${countLine})`); for (const p of relProblems) console.log('      - ' + p);
  }
}
for (const r of report) {
  console.log(`${r.problems.length ? 'FAIL ' : 'OK   '} ${r.id} v${r.version} (${r.secs}s) sha256=${r.sha256.slice(0, 16)}${r.isNew ? ' [new]' : ' [identical to previous]'}`);
  console.log(`      ${r.verdicts}`);
  for (const p of r.problems) console.log(`      - ${p}`);
}
console.log(failures ? `\n${failures} problem(s).` : '\nAll simulations reproduced; numbers and verdicts match the cards.');
process.exit(failures ? 1 : 0);
