// LAB-001 arms as plugins over the Run API. Each arm: async (run) => files ({ 'src/<pkg>/<file>': content }).
// Artificial structures: SOLO, ORCH, PIPE, VOTE3, DEBATE, TODAY.
// Bio-inspired mechanisms (engineering analogies, not claims that the biology transfers): THRESH (response threshold, ±habituation),
// STIG (stigmergy, ±evaporation), QUORUM (scouts + recruitment + cross-inhibition, q=1|2), CTRL (division of labour / single owner),
// ELASTIC (clonal expansion/contraction), GATE (adaptive activation: individual first, team on demand).
// Every arm sees only the probe/ tests (agent-visible signal); final/ is used by the runner for scoring.
import { parseFiles, parseJson, SYSTEM_SOLVER, SYSTEM_CRITIC } from '../lib/prompt.mjs';

const block = (k, v) => `--- ${k} ---\n${v.replace(/\s+$/, '')}\n--- end ${k} ---`;
const names = (t) => t.pkgs.map((p) => p.name);
const pkgOf = (t, k) => t.pkgs.find((p) => p.name === k);
const ownFiles = (t, k) => pkgOf(t, k).srcFiles;
const allFiles = (t) => Object.keys(t.src);
const sub = (obj, k, pre) => Object.fromEntries(Object.entries(obj).filter(([f]) => (pre === 'src' ? f.startsWith(`src/${k}/`) : f.startsWith(`probe/${k}__`))));
const kp = (p, k) => { const e = Object.entries(p.files).filter(([f]) => f.startsWith(`probe/${k}__`)); const pass = e.reduce((s, [, v]) => s + v.pass, 0), total = e.reduce((s, [, v]) => s + v.total, 0); return { pass, total, ok: total > 0 && pass === total, failFrac: total ? (total - pass) / total : 1, nFail: total - pass }; };
const failText = (p, k = null) => (p.failures || []).filter((f) => !k || f.file.startsWith(`probe/${k}__`)).slice(0, 12).map((f) => `- [${f.file}] ${f.name}: ${f.message}`).join('\n') || '(all probe tests pass)';
const cur = (t, files) => ({ ...t.src, ...files });

const repoPrompt = (t, files, extra = '') => `# Task: repository of ${t.k} packages\n\n## Specification and reported problems\n${t.statement}\n\n## Source files (current)\n${Object.entries(cur(t, files)).map(([k, v]) => block(k, v)).join('\n\n')}\n\n## Probe tests (a larger hidden suite also checks the full specification)\n${Object.entries(t.probe).map(([k, v]) => block(k, v)).join('\n\n')}${extra ? '\n\n' + extra : ''}\n\nFix the bugs so every package satisfies its full specification (not only the probe tests). Return complete changed files in the mandatory block format.`;
const groupPrompt = (t, ks, files, extra = '') => `# Task: packages ${ks.join(', ')} of a ${t.k}-package repository\n\nOther packages belong to other agents; change ONLY files under ${ks.map((k) => `src/${k}/`).join(', ')}.\n\n## Specification and reported problems\n${ks.map((k) => `### Package \`src/${k}/\` — ${pkgOf(t, k).title}\n${pkgOf(t, k).statement}`).join('\n\n---\n\n')}\n\n## Source files (current)\n${ks.map((k) => Object.entries(sub(cur(t, files), k, 'src')).map(([f, v]) => block(f, v)).join('\n\n')).join('\n\n')}\n\n## Probe tests (a larger hidden suite also checks the full specification)\n${ks.map((k) => Object.entries(sub(t.probe, k, 'probe')).map(([f, v]) => block(f, v)).join('\n\n')).join('\n\n')}${extra ? '\n\n' + extra : ''}\n\nFix the bugs so each package satisfies its full specification. Return complete changed files in the mandatory block format.`;
const allowedOf = (t, ks) => ks.flatMap((k) => ownFiles(t, k));

// ---------- shared mechanism step: candidates per package, evaluated by probe, best accepted if not worse
async function candidates(run, plan, files, p, role, extraFor = () => '') {
  // plan: { pkg: copies }; each copy is an independent package-only owner call
  const jobs = []; for (const [k, n] of Object.entries(plan)) for (let i = 0; i < n; i++) jobs.push(k);
  const outs = await run.par(jobs.map((k, i) => async (b) => {
    const note = `${kp(p, k).ok ? 'The probe tests for this package currently pass; hidden tests may still reveal defects — re-read the specification carefully.' : `## Probe failures in your package\n${failText(p, k)}`}\n${extraFor(k)}\n\nReturn every file you change.`;
    const r = await run.call(`${role}-${k}-${i}`, groupPrompt(run.task, [k], files, note), { clock: b });
    return { k, files: r.text ? parseFiles(r.text, ownFiles(run.task, k)) : null };
  }));
  return outs.filter((o) => o.files);
}
async function evalLayers(run, outs, files) {
  // evaluate candidates in layers: layer j holds the j-th candidate of every package (packages are independent), one repo probe per layer
  const byK = {}; for (const o of outs) (byK[o.k] ||= []).push(o);
  const res = {}; const depth = Math.max(0, ...Object.values(byK).map((a) => a.length));
  for (let j = 0; j < depth; j++) {
    const overlay = { ...files }; for (const a of Object.values(byK)) if (a[j]) Object.assign(overlay, a[j].files);
    const p = await run.probe(overlay);
    for (const [k, a] of Object.entries(byK)) if (a[j]) (res[k] ||= []).push({ files: a[j].files, ...kp(p, k) });
  }
  return res;
}
// Scale a recruitment plan to the remaining call budget: reduce the largest crowds first (never below 1), then drop the packages with the weakest need.
function fitPlan(run, plan, p) {
  const left = Math.max(0, run.maxCalls - run.calls - run.inflight); const out = { ...plan }; const sum = () => Object.values(out).reduce((a, b) => a + b, 0);
  while (sum() > left) { const big = Object.entries(out).filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1])[0]; if (big) { out[big[0]]--; continue; } const weakest = Object.keys(out).sort((a, b) => kp(p, a).failFrac - kp(p, b).failFrac)[0]; if (!weakest) break; delete out[weakest]; }
  return out;
}
async function repairStep(run, plan, files, p, role, extraFor) {
  plan = fitPlan(run, plan, p);
  const outs = await candidates(run, plan, files, p, role, extraFor);
  const ev = await evalLayers(run, outs, files); const improved = {}, nPass = {}, bestFrac = {};
  const next = { ...files };
  for (const [k, cs] of Object.entries(ev)) {
    const best = cs.reduce((a, c) => (c.pass > a.pass ? c : a), cs[0]); const base = kp(p, k);
    nPass[k] = cs.filter((c) => c.ok).length; improved[k] = best.pass > base.pass; bestFrac[k] = best.total ? best.pass / best.total : 0;
    if (best.pass >= base.pass) Object.assign(next, best.files);
  }
  run.set(next); const pn = await run.probe(next);
  return { files: next, p: pn, improved, nPass, bestFrac, tried: Object.keys(ev) };
}
const wholeParse = (t, text) => (text ? parseFiles(text, allFiles(t)) : {});

// ================= artificial structures
async function SOLO(run) {
  const t = run.task; let files = {};
  let r = await run.call('solo', repoPrompt(t, files)); files = { ...files, ...wholeParse(t, r.text) }; run.set(files);
  let p = await run.probe(files);
  for (let i = 0; i < 2 && !p.allPass && !run.budgetHit; i++) {
    r = await run.call('solo-repair', repoPrompt(t, files, `## Probe results for the current code: ${p.pass}/${p.total}\n${failText(p)}\n\nReturn every file you change.`));
    const next = { ...files, ...wholeParse(t, r.text) }; const pn = await run.probe(next);
    if (pn.pass >= p.pass) { files = next; p = pn; run.set(files); }
  }
  run.events.push({ probe: `${p.pass}/${p.total}` }); return files;
}

const SYSTEM_PLAN = 'You are a software engineering lead. You cannot run code. Split a set of independent packages into work groups for parallel solvers. Output ONLY JSON.';
async function ORCH(run) {
  const t = run.task, ks = names(t); const G = Math.min(4, Math.max(2, Math.ceil(ks.length / 3)));
  const plan = await run.call('planner', `Packages (name — title — lines):\n${t.pkgs.map((p) => `- ${p.name} — ${p.title} — ${p.loc} lines`).join('\n')}\n\nSplit them into exactly ${G} balanced groups covering every package once, and write a short brief per group.\nOutput JSON: {"groups":[{"packages":["name"],"brief":"..."}]}`, { system: SYSTEM_PLAN, outChars: 1500 });
  let groups = (parseJson(plan.text || '')?.groups || []).map((g) => ({ packages: (g.packages || []).filter((x) => ks.includes(x)), brief: String(g.brief || '') })).filter((g) => g.packages.length);
  const seen = new Set(groups.flatMap((g) => g.packages)); const rest = ks.filter((k) => !seen.has(k));
  if (!groups.length) groups = Array.from({ length: G }, () => ({ packages: [], brief: '' })).map((g, i) => ({ ...g, packages: ks.filter((_, j) => j % G === i) })).filter((g) => g.packages.length);
  else if (rest.length) groups[groups.length - 1].packages.push(...rest);
  groups = groups.filter((g, i) => g.packages.filter((k) => !groups.slice(0, i).some((h) => h.packages.includes(k))).length).map((g, i) => ({ ...g, packages: g.packages.filter((k) => !groups.slice(0, i).some((h) => h.packages.includes(k))) }));
  run.msgs += groups.length; run.msgChars += groups.reduce((s, g) => s + g.brief.length, 0);
  let files = {};
  const outs = await run.par(groups.map((g) => async (b) => { const r = await run.call(`solver-${g.packages[0]}`, groupPrompt(t, g.packages, {}, `## Brief from the lead\n${g.brief}`), { clock: b }); return r.text ? parseFiles(r.text, allowedOf(t, g.packages)) : {}; }));
  for (const o of outs) files = { ...files, ...o }; run.set(files);
  const p = await run.probe(files);
  const bad = names(t).filter((k) => !kp(p, k).ok);
  const integ = await run.call('integrator', `# Integration review of a ${t.k}-package repository\nSolver groups have returned their changes. Probe status: ${p.pass}/${p.total}.\n${failText(p)}\n\n${bad.length ? `## Packages still failing probe tests (current code and spec)\n${bad.map((k) => groupPrompt(t, [k], files)).join('\n\n')}\n\nFix the failing packages; return every file you change.` : 'All probe tests pass. Return NO CHANGES unless you are certain of a defect.'}`, { system: SYSTEM_SOLVER });
  run.msgs += groups.length;
  if (integ.text) { const add = parseFiles(integ.text, allFiles(t)); const next = { ...files, ...add }; const pn = await run.probe(next); if (pn.pass >= p.pass) { files = next; run.set(files); } }
  return files;
}

async function PIPE(run) {
  const t = run.task; let files = {};
  const r1 = await run.call('solver', repoPrompt(t, files)); files = wholeParse(t, r1.text); run.set(files);
  const p = await run.probe(files);
  const crit = await run.call('critic', `# Review\n## Specification\n${t.statement}\n\n## Proposed changed files\n${Object.entries(files).map(([k, v]) => block(k, v)).join('\n\n') || '(none)'}\n\n## Probe results: ${p.pass}/${p.total}\n${failText(p)}\n\nList concrete remaining defects per package (function, input, expected vs actual), or answer exactly APPROVE.`, { system: SYSTEM_CRITIC, outChars: 3000 });
  run.msgs++; run.msgChars += (crit.text || '').length;
  if (crit.text && !/^\s*APPROVE\b/i.test(crit.text)) {
    const r2 = await run.call('revision', repoPrompt(t, files, `## Reviewer feedback\n${crit.text.slice(0, 6000)}\n\n## Probe results: ${p.pass}/${p.total}\n${failText(p)}\n\nRevise and return every file you change.`));
    files = { ...files, ...wholeParse(t, r2.text) }; run.set(files);
  }
  return files;
}

async function VOTE3(run) {
  const t = run.task;
  const cs = await run.par([0, 1, 2].map((i) => async (b) => { const r = await run.call(`cand${i}`, repoPrompt(t, {}), { clock: b }); return wholeParse(t, r.text); }));
  const scored = []; for (const c of cs) { const p = await run.probe(c); scored.push({ files: c, pass: p.pass, key: JSON.stringify(Object.entries(c).sort()) }); }
  const freq = (k) => scored.filter((s) => s.key === k).length;
  scored.sort((a, b) => b.pass - a.pass || freq(b.key) - freq(a.key));
  run.set(scored[0].files); run.events.push({ votes: scored.map((s) => s.pass) }); return scored[0].files;
}

async function DEBATE(run) {
  const t = run.task;
  const r1 = await run.par([0, 1].map((i) => async (b) => wholeParse(t, (await run.call(`propose-${'AB'[i]}`, repoPrompt(t, {}), { clock: b })).text)));
  const [pa, pb] = [await run.probe(r1[0]), await run.probe(r1[1])];
  const view = (files) => Object.entries(files).map(([k, v]) => block(k, v)).join('\n\n') || '(no changes)';
  run.msgs += 2;
  const r2 = await run.par([0, 1].map((i) => async (b) => {
    const mine = r1[i], theirs = r1[1 - i], pm = i ? pb : pa, pt = i ? pa : pb;
    const r = await run.call(`rebut-${'AB'[i]}`, repoPrompt(t, mine, `## Your current proposal passes ${pm.pass}/${pm.total} probe tests\n${failText(pm)}\n\n## Your opponent's proposal (changed files) passes ${pt.pass}/${pt.total}\n${view(theirs)}\n\nCritically compare the two, then return the best complete fix of the repository (every file you change).`), { clock: b });
    return { ...mine, ...wholeParse(t, r.text) };
  }));
  const [fa, fb] = [await run.probe(r2[0]), await run.probe(r2[1])]; run.msgs += 2;
  const j = await run.call('judge', `# Judge\nTwo engineers proposed fixes for the same repository.\n## Specification\n${t.statement.slice(0, 60000)}\n\n## Proposal A (probe ${fa.pass}/${fa.total})\n${view(r2[0])}\n\n## Proposal B (probe ${fb.pass}/${fb.total})\n${view(r2[1])}\n\nChoose the proposal that best satisfies the full specification. Output ONLY JSON: {"winner":"A"|"B"}`, { system: 'You are a strict code judge. You cannot run code. Output ONLY JSON.', outChars: 200 });
  let w = parseJson(j.text || '')?.winner; if (w !== 'A' && w !== 'B') w = fa.pass >= fb.pass ? 'A' : 'B';
  const files = w === 'A' ? r2[0] : r2[1]; run.set(files); run.events.push({ winner: w, probeA: fa.pass, probeB: fb.pass }); return files;
}

const SYSTEM_COORD = 'You coordinate a team of specialist engineers, one per package, in a repository you can read but not run. Write clear, complete delegation messages. Output ONLY JSON.';
async function TODAY(run) {
  const t = run.task, kits = names(t); let files = {};
  const plan = await run.call('coordinator-brief', `${repoPrompt(t, {})}\n\nDo NOT fix code yourself. Write one delegation message per package for its specialist teammate: what the package must do per the specification, the likely defects, and what "done" means. Packages: ${kits.join(', ')}.\nOutput JSON: {"briefs": {"<package>": "<message>"}}`, { system: SYSTEM_COORD, outChars: 4000 });
  const briefs = parseJson(plan.text || '')?.briefs || {}; for (const k of kits) { run.msgs++; run.msgChars += String(briefs[k] || '').length; }
  const round = async (label, msg) => {
    const outs = await run.par(kits.map((k) => async (b) => {
      const r = await run.call(`${label}-${k}`, repoPrompt(t, files, `## Your role\nYou are the specialist for package \`${k}\`. Change ONLY files under src/${k}/. Other packages belong to teammates.\n\n## Message from the coordinator\n${msg(k)}\n\nAfter the file blocks, add a short report to the coordinator (at most 5 lines).`), { clock: b });
      const text = r.text || ''; run.msgs++; run.msgChars += text.replace(/=== FILE:[\s\S]*?=== END FILE ===/g, '').length;
      return { k, files: text ? parseFiles(text, ownFiles(t, k)) : {}, report: text.replace(/=== FILE:[\s\S]*?=== END FILE ===/g, '').trim().slice(0, 1200) };
    }));
    for (const o of outs) files = { ...files, ...o.files }; run.set(files); return outs;
  };
  const r1 = await round('specialist', (k) => briefs[k] || `Fix package ${k}.`);
  const p1 = await run.probe(files);
  const review = await run.call('coordinator-review', `${repoPrompt(t, files)}\n\n## Specialist reports\n${r1.map((o) => `### ${o.k}\n${o.report}`).join('\n\n')}\n\n## Probe results after round 1: ${p1.pass}/${p1.total}\n${failText(p1)}\n\nDo NOT fix code yourself. Write a follow-up message to EVERY specialist (packages: ${kits.join(', ')}): what to recheck or improve, or confirmation.\nOutput JSON: {"followups": {"<package>": "<message>"}}`, { system: SYSTEM_COORD, outChars: 4000 });
  const fu = parseJson(review.text || '')?.followups || {}; for (const k of kits) { run.msgs++; run.msgChars += String(fu[k] || '').length; }
  await round('specialist-r2', (k) => `${fu[k] || 'Please double-check your package.'}\n\nProbe failures in your package:\n${failText(p1, k)}`);
  const p2 = await run.probe(files); run.events.push({ probe1: `${p1.pass}/${p1.total}`, probe2: `${p2.pass}/${p2.total}` }); return files;
}

// ================= bio-inspired mechanisms
// CTRL — division of labour / single owner: every package gets its own owner (package-only context); a package is re-activated only while its probe fails (≤ 2 repairs).
async function CTRL(run) {
  const t = run.task, kits = names(t); let files = {}; let p = await run.probe(files);
  ({ files, p } = await repairStep(run, Object.fromEntries(kits.map((k) => [k, 1])), files, p, 'owner'));
  for (let rr = 1; rr <= 2 && !run.budgetHit; rr++) { const act = kits.filter((k) => !kp(p, k).ok); if (!act.length) break; ({ files, p } = await repairStep(run, Object.fromEntries(act.map((k) => [k, 1])), files, p, `repair${rr}`)); }
  run.events.push({ probe: `${p.pass}/${p.total}` }); return files;
}
// GATE — adaptive activation: one agent on the whole repo first; owners only for packages whose probe still fails (≤ 2 repair rounds).
async function GATE(run) {
  const t = run.task; let files = {};
  const r = await run.call('solo', repoPrompt(t, {})); files = wholeParse(t, r.text); run.set(files); let p = await run.probe(files);
  const first = `${p.pass}/${p.total}`;
  for (let rr = 1; rr <= 2 && !p.allPass && !run.budgetHit; rr++) { const act = names(t).filter((k) => !kp(p, k).ok); ({ files, p } = await repairStep(run, Object.fromEntries(act.map((k) => [k, 1])), files, p, `owner${rr}`)); }
  run.events.push({ first, probe: `${p.pass}/${p.total}` }); return files;
}
// ELASTIC — clonal expansion/contraction: solo seed; failing packages get 1, 2, 4 independent clones in successive rounds (best by probe kept); packages that pass retire (no more calls).
async function ELASTIC(run) {
  const t = run.task; let files = {};
  const r = await run.call('solo', repoPrompt(t, {})); files = wholeParse(t, r.text); run.set(files); let p = await run.probe(files);
  for (let rr = 1; rr <= 3 && !p.allPass && !run.budgetHit; rr++) { const act = names(t).filter((k) => !kp(p, k).ok); ({ files, p } = await repairStep(run, Object.fromEntries(act.map((k) => [k, 2 ** (rr - 1)])), files, p, `clone${rr}`)); }
  run.events.push({ probe: `${p.pass}/${p.total}` }); return files;
}
// THRESH — response-threshold recruitment with habituation. Stimulus per package s = max(0.15, probe-fail fraction). Workers with θ < s respond.
// θ = [0.1, 0.5, 0.9]; a worker that fails to improve a package raises its θ for that package by `hab` (hab=0 → fixed thresholds). ≤ 3 rounds.
async function THRESH(run, { hab = 0.3 } = {}) {
  const t = run.task, kits = names(t); let files = {}; let p = await run.probe(files);
  const theta = Object.fromEntries(kits.map((k) => [k, [0.1, 0.5, 0.9]]));
  for (let rd = 1; rd <= 3 && !run.budgetHit; rd++) {
    const plan = {}, who = {};
    for (const k of kits) { const s = Math.max(0.15, kp(p, k).failFrac); const idx = [0, 1, 2].filter((i) => theta[k][i] < s); if (idx.length) { plan[k] = idx.length; who[k] = idx; } }
    if (!Object.keys(plan).length) break;
    const out = await repairStep(run, plan, files, p, `thr${rd}`); ({ files, p } = out);
    if (hab) for (const k of Object.keys(plan)) if (!out.improved[k]) for (const i of who[k]) theta[k][i] += hab;
    run.events.push({ round: rd, recruits: Object.fromEntries(Object.entries(plan)) });
  }
  return files;
}
// STIG — stigmergy: no messages; coordination only through the environment (the shared repo + marks). Mark per package m = 0.5 + failing probe tests; each round the W = ⌈k/3⌉
// strongest marks (ties: fewer visits, then order) receive a worker; marks then evaporate (m ← (1−ρ)m, ρ=0 → no evaporation) and the environment re-deposits one unit per failing test. ≤ 4 rounds; stop when all probes pass and every package was visited.
async function STIG(run, { rho = 0.5 } = {}) {
  const t = run.task, kits = names(t); const W = Math.ceil(kits.length / 3); let files = {}; let p = await run.probe(files);
  const m = Object.fromEntries(kits.map((k) => [k, 0.5 + kp(p, k).nFail])); const visits = Object.fromEntries(kits.map((k) => [k, 0]));
  for (let rd = 1; rd <= 4 && !run.budgetHit; rd++) {
    const rank = [...kits].sort((a, b) => m[b] - m[a] || visits[a] - visits[b] || kits.indexOf(a) - kits.indexOf(b)).slice(0, W);
    ({ files, p } = await repairStep(run, Object.fromEntries(rank.map((k) => [k, 1])), files, p, `stig${rd}`));
    for (const k of rank) visits[k]++;
    for (const k of kits) m[k] = m[k] * (1 - rho) + kp(p, k).nFail;
    run.events.push({ round: rd, visited: rank, marks: Object.fromEntries(kits.map((k) => [k, +m[k].toFixed(2)])) });
    if (p.allPass && kits.every((k) => visits[k] > 0)) break;
  }
  return files;
}
// QUORUM — scouts, recruitment to the best site and cross-inhibition. q independent scouts per package; a package commits when q independent candidates pass its probe.
// Otherwise recruits (max(1, round(2·quality)) of the best candidate, quality = best probe pass fraction) revise ONLY the best candidate (others are inhibited); ≤ 2 recruitment rounds.
async function QUORUM(run, { q = 2 } = {}) {
  const t = run.task, kits = names(t); let files = {}; let p = await run.probe(files); const votes = Object.fromEntries(kits.map((k) => [k, 0]));
  let out = await repairStep(run, Object.fromEntries(kits.map((k) => [k, q])), files, p, 'scout'); ({ files, p } = out); for (const k of kits) votes[k] += out.nPass[k] || 0;
  let quality = { ...out.bestFrac };
  for (let rr = 1; rr <= 2 && !run.budgetHit; rr++) {
    const open = kits.filter((k) => votes[k] < q); if (!open.length) break;
    const plan = Object.fromEntries(open.map((k) => [k, Math.max(1, Math.round(2 * (quality[k] ?? 0)))]));
    out = await repairStep(run, plan, files, p, `recruit${rr}`); ({ files, p } = out); for (const k of open) { votes[k] += out.nPass[k] || 0; quality[k] = out.bestFrac[k] ?? quality[k]; }
  }
  run.events.push({ votes }); return files;
}

// PATROL2 — EXPLORATORY CONTROL (non-bio, added after the main run): CTRL, then two extra review rounds in which EVERY package gets one more independent owner (accept if probe not worse), regardless of stimulus.
// Purpose: separate the effect of probe-silent re-review from the response-threshold mechanism (THRESH).
async function PATROL2(run) {
  const t = run.task, kits = names(t); let files = await CTRL(run); let p = await run.probe(files);
  for (let i = 1; i <= 2 && !run.budgetHit; i++) ({ files, p } = await repairStep(run, Object.fromEntries(kits.map((k) => [k, 1])), files, p, `patrol${i}`));
  run.events.push({ probe: `${p.pass}/${p.total}` }); return files;
}

export const ARMS = {
  'SOLO': { fn: SOLO, kind: 'artificial' }, 'ORCH': { fn: ORCH, kind: 'artificial' }, 'PIPE': { fn: PIPE, kind: 'artificial' },
  'VOTE3': { fn: VOTE3, kind: 'artificial' }, 'DEBATE': { fn: DEBATE, kind: 'artificial' }, 'TODAY': { fn: TODAY, kind: 'artificial' },
  'CTRL': { fn: CTRL, kind: 'bio', mech: 'division of labour' }, 'GATE': { fn: GATE, kind: 'bio', mech: 'adaptive activation' }, 'ELASTIC': { fn: ELASTIC, kind: 'bio', mech: 'clonal expansion' },
  'THRESH-hab': { fn: (r) => THRESH(r, { hab: 0.3 }), kind: 'bio', mech: 'response threshold' }, 'THRESH-fixed': { fn: (r) => THRESH(r, { hab: 0 }), kind: 'ablation', mech: 'response threshold' },
  'STIG-evap': { fn: (r) => STIG(r, { rho: 0.5 }), kind: 'bio', mech: 'stigmergy' }, 'STIG-noevap': { fn: (r) => STIG(r, { rho: 0 }), kind: 'ablation', mech: 'stigmergy' },
  'QUORUM-q2': { fn: (r) => QUORUM(r, { q: 2 }), kind: 'bio', mech: 'quorum' }, 'QUORUM-q1': { fn: (r) => QUORUM(r, { q: 1 }), kind: 'ablation', mech: 'quorum' },
  'CTRL+PATROL2': { fn: PATROL2, kind: 'control', mech: 'non-bio control (exploratory)' },
};
