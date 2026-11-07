// Reexecuta todas as simulações, grava os JSON e confere:
//  (1) determinismo: o JSON novo é byte a byte igual ao anterior (se existia);
//  (2) consistência com os cartões: cada manchete e cada veredicto do JSON aparecem literalmente no .md;
//  (3) frontmatter obrigatório do cartão (id, title, area=simulation, evidence=validacao-local, summary preenchido).
// Uso: node sims/run-all.mjs [id ...]      Código de saída 1 se alguma checagem falhar.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { RESULTS_DIR, writeResult } from './lib.mjs';

export const SIMS = ['sim-voto-correlacionado', 'sim-verificador', 'sim-limiar-resposta', 'sim-estigmergia', 'sim-quorum', 'sim-elastico', 'sim-clonal'];

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
  if (w.changed) problems.push('JSON diferente do anterior (não determinístico ou código alterado)');
  const mdPath = join(RESULTS_DIR, `${id}.md`);
  if (!existsSync(mdPath)) problems.push('cartão .md ausente');
  else {
    const md = readFileSync(mdPath, 'utf8');
    const fm = md.match(/^---\n([\s\S]*?)\n---/);
    const need = { id: new RegExp(`^id: ${id}$`, 'm'), title: /^title: .+$/m, area: /^area: simulation$/m, evidence: /^evidence: validacao-local$/m, summary: /^summary: .+$/m };
    if (!fm) problems.push('frontmatter ausente');
    else for (const [k, re] of Object.entries(need)) if (!re.test(fm[1])) problems.push(`frontmatter: campo ${k} ausente/inválido`);
    if (/PENDENTE/.test(md)) problems.push('cartão ainda contém PENDENTE');
    if (!md.includes(`v${out.version}`)) problems.push(`cartão não cita a versão v${out.version}`);
    for (const h of out.headline) if (!md.includes(h)) problems.push(`manchete ausente no cartão: "${h.slice(0, 90)}…"`);
    for (const t of out.tests) if (!md.includes(`| ${t.id} | **${t.verdict}** |`)) problems.push(`veredicto ${t.id}=${t.verdict} não encontrado no cartão`);
  }
  failures += problems.length;
  report.push({ id, version: out.version, secs, sha256: w.sha256, isNew: w.isNew, verdicts: out.tests.map((t) => `${t.id}:${t.verdict}`).join(' '), problems });
}
// (4) relatório final: linha de veredictos por simulação e contagem total
const relPath = join(RESULTS_DIR, 'RELATORIO.md');
if (only.length === 0) {
  if (!existsSync(relPath)) { failures++; console.log('FALHA RELATORIO.md ausente'); }
  else {
    const rel = readFileSync(relPath, 'utf8'); const relProblems = [];
    for (const r of report) if (!rel.includes(`- ${r.id}: ${r.verdicts}`)) relProblems.push(`linha de veredictos de ${r.id} não bate`);
    const all = report.flatMap((r) => r.verdicts.split(' ').map((v) => v.split(':')[1]));
    const cnt = (v) => all.filter((x) => x === v).length;
    const countLine = `${all.length} → ${cnt('suporta')} \`suporta\`, ${cnt('suporta-parcialmente')} \`suporta-parcialmente\`, ${cnt('nao-suporta')} \`nao-suporta\``;
    if (!rel.includes(countLine)) relProblems.push(`contagem esperada ausente: "${countLine}"`);
    if (!/^id: sim-relatorio$/m.test(rel)) relProblems.push('frontmatter id sim-relatorio ausente');
    failures += relProblems.length;
    console.log(`${relProblems.length ? 'FALHA' : 'OK   '} RELATORIO.md (${countLine})`); for (const p of relProblems) console.log('      - ' + p);
  }
}
for (const r of report) {
  console.log(`${r.problems.length ? 'FALHA' : 'OK   '} ${r.id} v${r.version} (${r.secs}s) sha256=${r.sha256.slice(0, 16)}${r.isNew ? ' [novo]' : ' [idêntico ao anterior]'}`);
  console.log(`      ${r.verdicts}`);
  for (const p of r.problems) console.log(`      - ${p}`);
}
console.log(failures ? `\n${failures} problema(s).` : '\nTodas as simulações reproduzidas; números e veredictos batem com os cartões.');
process.exit(failures ? 1 : 0);
