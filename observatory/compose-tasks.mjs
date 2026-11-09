#!/usr/bin/env node
// Generates COMPOSITE tasks (suite hardening after the pilot ceiling effect):
// joins already-validated packages into one repository (src/<package>/...), with each
// package statement; VISIBLE tests come only from the 1st package (bugs in the other
// packages have no visible signal), HIDDEN tests include everything. Class is kept:
// b+b → b (independent); c+c → c (coupled within each package).
// Composites inherit the split of their bases (never mixing dev and test).
import fs from 'node:fs';
import path from 'node:path';
import { OBS_DIR, listFiles } from './lib/testrun.mjs';

const TASKS = path.join(OBS_DIR, 'tasks');
export const COMPOSITES = {
  'bx01-repo-texto-estoque-geo': ['b01-texto-kit', 'b02-estoque-kit', 'b03-geometria-kit'],
  'bx02-repo-agenda-config-stats': ['b04-agenda-kit', 'b05-config-kit', 'b06-estatistica-kit'],
  'bx03-repo-billing-calendar': ['b10-billing-kit', 'b11-calendar-kit'],
  'bx04-repo-inventory-path': ['b12-inventory-kit', 'b13-path-kit'],
  'bx05-repo-quatro-kits': ['b05-config-kit', 'b01-texto-kit', 'b10-billing-kit', 'b12-inventory-kit'],
  'bx06-repo-url-grade-datas': ['b08-grade-kit', 'b07-url-kit', 'b09-datas-kit'],
  'bx07-repo-cli-search': ['b15-search-kit', 'b14-cli-kit'],
  'cx01-repo-telemetria-pedido': ['c01-telemetria-varint', 'c02-pedido-centavos'],
  'cx02-repo-cursor-cache': ['c04-cache-chaves', 'c03-cursor-paginacao'],
  'cx03-repo-expr-diff': ['c06-diff-patch', 'c05-expr-ast'],
  'cx04-repo-tres-sistemas': ['c02-pedido-centavos', 'c05-expr-ast', 'c03-cursor-paginacao'],
  'cx05-repo-agendador-diario': ['c08-diario-checksum', 'c07-agendador-heap'],
  'cx06-repo-diario-eventos': ['c09-eventos-projecao', 'c08-diario-checksum'],
  // hardening round 2: larger repositories
  'bx08-repo-cinco-kits': ['b06-estatistica-kit', 'b03-geometria-kit', 'b04-agenda-kit', 'b11-calendar-kit', 'b13-path-kit'],
  'bx09-repo-cinco-kits-teste': ['b09-datas-kit', 'b07-url-kit', 'b08-grade-kit', 'b14-cli-kit', 'b15-search-kit'],
  'cx07-repo-quatro-sistemas': ['c03-cursor-paginacao', 'c01-telemetria-varint', 'c04-cache-chaves', 'c06-diff-patch'],
  'cx08-repo-tres-sistemas-teste': ['c07-agendador-heap', 'c08-diario-checksum', 'c09-eventos-projecao'],
};

const pkgName = (id) => id.replace(/^[a-z]+\d+-/, '');
const rewriteImports = (code, pkg) => code.replace(/(['"])\.\.\/src\//g, `$1../src/${pkg}/`);

function build(id, bases) {
  const metas = bases.map((b) => JSON.parse(fs.readFileSync(path.join(TASKS, b, 'task.json'), 'utf8')));
  const cls = metas[0].class, split = metas[0].split;
  if (metas.some((m) => m.class !== cls || m.split !== split)) throw new Error(`${id}: bases with different class/split`);
  const dir = path.join(TASKS, id);
  fs.rmSync(dir, { recursive: true, force: true });
  for (const sub of ['src', 'solution', 'visible', 'test']) fs.mkdirSync(path.join(dir, sub), { recursive: true });
  const statementParts = [];
  const bugs = [];
  bases.forEach((b, i) => {
    const pkg = pkgName(b);
    for (const sub of ['src', 'solution']) for (const f of listFiles(path.join(TASKS, b, sub))) {
      const dst = path.join(dir, sub, pkg, f); fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(path.join(TASKS, b, sub, f), dst);
    }
    for (const sub of ['visible', 'test']) for (const f of listFiles(path.join(TASKS, b, sub))) {
      const target = sub === 'visible' && i === 0 ? 'visible' : 'test';
      const name = `${pkg}__${sub === 'visible' ? 'v-' : ''}${f}`;
      fs.writeFileSync(path.join(dir, target, name), rewriteImports(fs.readFileSync(path.join(TASKS, b, sub, f), 'utf8'), pkg));
    }
    statementParts.push(`## Package \`src/${pkg}/\` — ${metas[i].title}\n\n${metas[i].statement.replace(/\bsrc\//g, `src/${pkg}/`)}`);
    for (const bug of metas[i].bugs) bugs.push({ ...bug, file: bug.file.replace(/^src\//, `src/${pkg}/`), base: b });
  });
  const intro = cls === 'b'
    ? `This repository bundles ${bases.length} independent packages (none imports another). Defects have been reported in several of them; the visible tests cover only part of the repository. Fix the whole repository so that every package meets its specification.`
    : `This repository bundles ${bases.length} systems that are independent of each other (none imports another), but each system has modules that depend on shared conventions. Defects have been reported; the visible tests cover only part of the repository. Fix the whole repository so that every system meets its specification.`;
  const meta = { id, class: cls, split, title: `Composite repository: ${bases.map(pkgName).join(' + ')}`, statement: `${intro}\n\n${statementParts.join('\n\n---\n\n')}`, bugs, decomposable: cls === 'b' ? true : 'parcial', composite: bases };
  fs.writeFileSync(path.join(dir, 'task.json'), JSON.stringify(meta, null, 2));
}

for (const [id, bases] of Object.entries(COMPOSITES)) { build(id, bases); console.log('generated', id, bases.join(' + ')); }
