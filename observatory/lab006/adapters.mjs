// LAB-006 task adapters (contract: allocator/index.mjs). Two kinds of tasks:
//  repoAdapter  — LAB-003 multi-package repair tasks (parts = packages; visible check = probe tests; hidden = full suite)
//  microAdapter — bundles of LAB-004 micro-tasks (parts = functions; visible check = shown examples; hidden = hidden tests)
import { parseFiles, SYSTEM_SOLVER } from '../lib/prompt.mjs'; import { runTask3 } from '../lab003/testrun3.mjs'; import { evalCode, expectedOut, score, taskForPrompt } from '../lab004/tasks.mjs';
const block = (k, v) => `--- ${k} ---\n${v.replace(/\s+$/, '')}\n--- end ${k} ---`;
// ---------- repo tasks
const kpOf = (p, k) => { const e = Object.entries(p.files).filter(([f]) => f.startsWith(`probe/${k}__`)); const pass = e.reduce((s, [, v]) => s + v.pass, 0), total = e.reduce((s, [, v]) => s + v.total, 0); return { pass, total, ok: total > 0 && pass === total }; };
const failTxt = (p, k, n = 10) => (p.failures || []).filter((f) => f.file.startsWith(`probe/${k}__`)).slice(0, n).map((f) => `- [${f.file.split('/').pop()}] ${f.name}: ${f.message}`).join('\n') || '(all probe tests pass)';
export const probeRepo = async (t, files) => (await runTask3({ taskDir: t.dir, overlay: files, suites: ['probe'], spec: t.spec, expected: t.expected })).probe;
export const hiddenRepo = async (t, files) => (await runTask3({ taskDir: t.dir, overlay: files, suites: ['final'], spec: t.spec, expected: t.expected })).final;
export function repoAdapter(t) {
  const ids = t.pkgs.map((p) => p.name); const view = (k) => Object.entries(t.probeView).concat(Object.entries(t.probe).filter(([f]) => f.includes('__v-'))).filter(([f]) => !k || ks(k).some((x) => f.startsWith(`probe/${x}__`))).map(([f, v]) => block(f, v)).join('\n\n'); const ks = (k) => (Array.isArray(k) ? k : [k]);
  const own = (pkg) => t.pkgs.find((p) => p.name === pkg).srcFiles; const loc = t.pkgs.reduce((s, p) => s + p.loc, 0);
  const flat = (cands) => Object.assign({}, ...Object.values(cands).map((c) => c || {}));
  return { id: t.id, kind: 'repo', k: ids.length, parts: ids.map((id) => ({ id, label: `${id} — ${t.pkgs.find((p) => p.name === id).title} — ${t.pkgs.find((p) => p.name === id).loc} lines` })), budget: { maxCalls: 2 * ids.length + 4, maxUsd: +(0.02 + 0.00006 * loc).toFixed(3) }, raw: t,
    group(pids, o = {}) { const cur = { ...t.src, ...flat(o.previous || {}) }; const fb = o.feedback || {}; const fbText = Object.keys(fb).length ? `\n\n## Probe results for the current code\n${Object.entries(fb).map(([k, v]) => `### ${k}\n${v}`).join('\n')}\n\nReturn every file you change.` : '';
      const all = pids.length === ids.length; const src = Object.entries(cur).filter(([n]) => pids.some((k) => n.startsWith(`src/${k}/`)));
      const spec = all ? t.statement : pids.map((k) => `### Package \`src/${k}/\` — ${t.pkgs.find((p) => p.name === k).title}\n${t.pkgs.find((p) => p.name === k).statement}`).join('\n\n---\n\n');
      const head = all ? `# Task: repository of ${t.k} package${t.k > 1 ? 's' : ''}` : `# Task: package${pids.length > 1 ? 's' : ''} ${pids.join(', ')} of a ${t.k}-package repository\n\nOther packages belong to other agents; change ONLY files under ${pids.map((k) => `src/${k}/`).join(', ')}.`;
      return { system: SYSTEM_SOLVER, maxTokens: 64000, think: true, prompt: `${head}\n\n## Specification and reported problems\n${spec}\n\n## Source files (current)\n${src.map(([n, v]) => block(n, v)).join('\n\n')}\n\n## Probe tests (a larger hidden suite also checks the full specification)\n${view(all ? null : pids)}${fbText}${o.extra ? '\n\n' + o.extra : ''}\n\nFix the bugs so ${all ? 'every package satisfies its full specification' : 'your package(s) satisfy their full specification'} (not only the probe tests). Return complete changed files in the mandatory block format.` }; },
    parse(text, pids) { const allowed = pids.flatMap(own); const files = parseFiles(text, allowed); const out = {}; for (const [f, v] of Object.entries(files)) { const pkg = f.split('/')[1]; (out[pkg] ||= {})[f] = v; } return out; },
    merge: (prev, next) => ({ ...prev, ...next }),
    async verify(cands) { const p = await probeRepo(t, flat(cands)); return Object.fromEntries(ids.map((k) => { const x = kpOf(p, k); return [k, { pass: x.ok, score: x.total ? x.pass / x.total : 0, feedback: failTxt(p, k) }]; })); },
    async baseline() { return this.verify({}); },
    async hidden(cands) { const f = await hiddenRepo(t, flat(cands)); return { accepted: f.allPass, frac: f.pass / f.total }; } };
}
// ---------- micro-task bundles
const fbMicro = (task, code) => { const vo = evalCode(code, task.fname, task.visible); const ve = (task._ve ||= expectedOut(task, task.visible)); let passed = 0, first = null; for (let i = 0; i < ve.length; i++) { if (vo && vo[i] === ve[i]) passed++; else if (!first) first = `${task.fname}(${task.visible[i].map((x) => JSON.stringify(x)).join(', ')}) returned ${vo ? vo[i] : 'an error'}, expected ${ve[i]}`; } return { passed, total: ve.length, first }; };
export function microAdapter(id, base) { // base: array of LAB-004 tasks; each part gets its own function name f<i>
  const parts = base.map((t, i) => ({ ...t, fname: `f${i}` })); const ids = parts.map((_, i) => `m${i}`); const byId = Object.fromEntries(ids.map((x, i) => [x, parts[i]]));
  const SYS = 'You write short JavaScript functions. Your reply must contain only code blocks (one ```js block per function), no reasoning text and no comments.';
  return { id, kind: 'micro', k: ids.length, parts: ids.map((x, i) => ({ id: x, label: `${x} — function f${i}` })), budget: { maxCalls: 2 * ids.length + 4, maxUsd: +(0.01 + 0.004 * ids.length).toFixed(3) },
    group(pids, o = {}) { const fb = o.feedback || {}; const prev = o.previous || {}; const secs = pids.map((x) => { const t = byId[x]; let s = `## Function ${t.fname}\n${taskForPrompt(t).replace(/^Write a JavaScript function named \S+ \(plain function declaration, no imports, no I\/O\)\.\n\n/, '').replace(/\n\nReturn only the code in one ```js block\.$/, '')}`; if (prev[x] && fb[x]) s += `\n\nYour previous code for ${t.fname}:\n\`\`\`js\n${prev[x]}\n\`\`\`\nIt failed: ${fb[x]}\nWrite a corrected function.`; return s; });
      return { system: SYS, maxTokens: 200 + 260 * pids.length, think: false, prompt: `Write ${pids.length} independent JavaScript function${pids.length > 1 ? 's' : ''} (plain function declarations, no imports, no I/O), each in its own \`\`\`js block, named exactly as given.${o.extra ? '\n\n' + o.extra : ''}\n\n${secs.join('\n\n')}` }; },
    parse(text, pids) { const out = {}; const re = /```(?:js|javascript)?\s*\n([\s\S]*?)(?:```|$)/g; let m; const blocks = []; while ((m = re.exec(text))) blocks.push(m[1].trim()); for (const x of pids) { const t = byId[x]; const b = blocks.find((c) => new RegExp(`function\\s+${t.fname}\\b|const\\s+${t.fname}\\s*=`).test(c)); if (b) out[x] = b; } return out; },
    async verify(cands) { return Object.fromEntries(ids.map((x) => { const t = byId[x]; const code = cands[x]; if (!code) return [x, { pass: false, score: 0, feedback: `no code for ${t.fname}` }]; const f = fbMicro(t, code); return [x, { pass: f.passed === f.total, score: f.passed / f.total, feedback: f.first || `passes ${f.passed} of ${f.total} examples` }]; })); },
    async hidden(cands) { let ok = 0; for (const x of ids) if (cands[x] && score(byId[x], cands[x]).hid) ok++; return { accepted: ok === ids.length, frac: ok / ids.length }; } };
}
