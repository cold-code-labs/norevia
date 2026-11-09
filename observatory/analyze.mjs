#!/usr/bin/env node
// Aggregates results: acceptance with 95% CI (Wilson), false success, cost per accepted,
// cost×acceptance Pareto per class, leave-one-out difficulty bins, expansion
// ladders (marginal gain) and paired comparison (bootstrap). Writes summary.json.
// Usage: node analyze.mjs [--phases full] [--out summary.json]
import fs from 'node:fs';
import path from 'node:path';
import { RESULTS_DIR, LEDGER } from './lib/llm.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const phases = opt('phases', 'full').split(',');
const outFile = path.join(RESULTS_DIR, opt('out', 'summary.json'));
const rows = phases.flatMap((p) => { const f = path.join(RESULTS_DIR, `runs-${p}.jsonl`); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []; }).filter((r) => !r.error);
// dedup (task, arch, rep, phase) — keep the last
const dedup = new Map(); for (const r of rows) dedup.set(`${r.phase}|${r.task}|${r.arch}|${r.rep}`, r);
const R = [...dedup.values()];

export function wilson(k, n, z = 1.96) {
  if (!n) return [0, 0];
  const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [(c - m) / d, (c + m) / d];
}
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const r4 = (x) => (x == null ? null : Math.round(x * 1e4) / 1e4);
const r6 = (x) => (x == null ? null : Math.round(x * 1e6) / 1e6);

function agg(rs) {
  const n = rs.length, k = rs.filter((r) => r.accepted).length, vis = rs.filter((r) => r.visibleAllPass).length;
  const fs_ = rs.filter((r) => r.falseSuccess).length;
  const cost = rs.reduce((s, r) => s + r.cost, 0);
  const [lo, hi] = wilson(k, n);
  return {
    n, accepted: k, acceptRate: r4(n ? k / n : null), ci95: [r4(lo), r4(hi)],
    falseSuccess: fs_, falseSuccessRate: r4(n ? fs_ / n : null), falseSuccessGivenVisiblePass: r4(vis ? fs_ / vis : null),
    meanCost: r6(n ? cost / n : null), totalCost: r6(cost), costPerAccepted: r6(k ? cost / k : null),
    meanInTok: Math.round(mean(rs.map((r) => r.inTok)) || 0), meanOutTok: Math.round(mean(rs.map((r) => r.outTok)) || 0),
    meanLatencyS: r4(mean(rs.map((r) => r.latencyMs / 1000))), medianLatencyS: r4(median(rs.map((r) => r.latencyMs / 1000))),
    meanCalls: r4(mean(rs.map((r) => r.calls))), meanReworkCalls: r4(mean(rs.map((r) => r.reworkCalls))), meanDiscarded: r4(mean(rs.map((r) => r.discarded))),
    meanHiddenPassFrac: r4(mean(rs.filter((r) => r.hidden).map((r) => r.hidden.pass / r.hidden.total))),
  };
}
const by = (rs, f) => { const m = {}; for (const r of rs) (m[f(r)] ||= []).push(r); return m; };
const archs = [...new Set(R.map((r) => r.arch))].sort();
const classesL = ['a', 'b', 'c'];

function pareto(points) { // minimize cost, maximize acceptance
  return points.filter((p) => !points.some((q) => q !== p && q.meanCost <= p.meanCost && q.acceptRate >= p.acceptRate && (q.meanCost < p.meanCost || q.acceptRate > p.acceptRate))).sort((a, b) => a.meanCost - b.meanCost).map((p) => p.arch);
}

const summary = { generated: new Date().toISOString(), phases, nRuns: R.length, archs, overall: {}, bySplit: {}, byClass: {}, pareto: {}, perTask: {}, difficultyBins: {}, ladders: {}, paired: {}, ledger: {} };
for (const [a, rs] of Object.entries(by(R, (r) => r.arch))) summary.overall[a] = agg(rs);
for (const [sp, rsS] of Object.entries(by(R, (r) => r.split))) { summary.bySplit[sp] = {}; for (const [a, rs] of Object.entries(by(rsS, (r) => r.arch))) summary.bySplit[sp][a] = agg(rs); }
for (const c of classesL) {
  const rsC = R.filter((r) => r.class === c); if (!rsC.length) continue;
  summary.byClass[c] = {}; for (const [a, rs] of Object.entries(by(rsC, (r) => r.arch))) summary.byClass[c][a] = agg(rs);
  const pts = Object.entries(summary.byClass[c]).map(([arch, s]) => ({ arch, meanCost: s.meanCost, acceptRate: s.acceptRate }));
  summary.pareto[c] = { points: pts, frontier: pareto(pts) };
  // same, per split
  for (const sp of ['dev', 'test']) {
    const rsCS = rsC.filter((r) => r.split === sp); if (!rsCS.length) continue;
    const ptsS = Object.entries(by(rsCS, (r) => r.arch)).map(([arch, rs]) => { const s = agg(rs); return { arch, meanCost: s.meanCost, acceptRate: s.acceptRate, n: s.n }; });
    summary.pareto[`${c}-${sp}`] = { points: ptsS, frontier: pareto(ptsS) };
  }
}
{ const pts = Object.entries(summary.overall).map(([arch, s]) => ({ arch, meanCost: s.meanCost, acceptRate: s.acceptRate })); summary.pareto.all = { points: pts, frontier: pareto(pts) }; }

// task × architecture matrix (acceptance rate)
for (const [t, rsT] of Object.entries(by(R, (r) => r.task))) {
  summary.perTask[t] = { class: rsT[0].class, split: rsT[0].split, archs: {} };
  for (const [a, rs] of Object.entries(by(rsT, (r) => r.arch))) summary.perTask[t].archs[a] = { n: rs.length, acc: r4(rs.filter((r) => r.accepted).length / rs.length), cost: r6(mean(rs.map((r) => r.cost))), fs: rs.filter((r) => r.falseSuccess).length };
}
// leave-one-out difficulty bins: difficulty of a task for arch X = 1 − mean acceptance of the OTHER architectures
const bins = [['easy', 0.8, 1.01], ['medium', 0.4, 0.8], ['hard', -0.01, 0.4]];
for (const a of archs) {
  summary.difficultyBins[a] = {};
  const groups = { easy: [], medium: [], hard: [] };
  for (const [t, pt] of Object.entries(summary.perTask)) {
    const others = Object.entries(pt.archs).filter(([x]) => x !== a).map(([, v]) => v.acc);
    if (!others.length || !pt.archs[a]) continue;
    const ease = mean(others);
    const b = bins.find(([, lo, hi]) => ease >= lo && ease < hi)[0];
    groups[b].push(...R.filter((r) => r.task === t && r.arch === a));
  }
  for (const [b, rs] of Object.entries(groups)) summary.difficultyBins[a][b] = rs.length ? { n: rs.length, nTasks: new Set(rs.map((r) => r.task)).size, acceptRate: r4(rs.filter((r) => r.accepted).length / rs.length), meanCost: r6(mean(rs.map((r) => r.cost))) } : null;
}
// expansion ladders: marginal gain Δacceptance/ΔUS$ between consecutive steps
const ladders = { samples: ['A-low', 'B-vote3', 'B-vote5'], reasoning: ['A-low', 'A-mid', 'A-high'], verification: ['A-low', 'A-low-loop', 'C-elastic'], effortHaiku: ['A-low', 'A-haiku-high'], effortOpus: ['A-opus-low', 'A-high'] };
for (const [name, steps] of Object.entries(ladders)) {
  summary.ladders[name] = {};
  for (const c of ['all', ...classesL]) {
    const src = c === 'all' ? summary.overall : summary.byClass[c]; if (!src) continue;
    const arr = [];
    for (let i = 0; i < steps.length; i++) {
      const s = src[steps[i]]; if (!s) continue;
      const prev = arr[arr.length - 1];
      arr.push({ arch: steps[i], acceptRate: s.acceptRate, meanCost: s.meanCost, dAccept: prev ? r4(s.acceptRate - prev.acceptRate) : null, dCost: prev ? r6(s.meanCost - prev.meanCost) : null, marginalAcceptPerUsd: prev && s.meanCost !== prev.meanCost ? r4((s.acceptRate - prev.acceptRate) / (s.meanCost - prev.meanCost)) : null });
    }
    summary.ladders[name][c] = arr;
  }
}
// paired per-task comparison (mean over reps) vs references, bootstrap over tasks (fixed seed)
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
for (const ref of ['A-high', 'A-low']) {
  summary.paired[ref] = {};
  for (const a of archs) {
    if (a === ref) continue;
    for (const c of ['all', ...classesL]) {
      const diffs = Object.values(summary.perTask).filter((pt) => (c === 'all' || pt.class === c) && pt.archs[a] && pt.archs[ref]).map((pt) => pt.archs[a].acc - pt.archs[ref].acc);
      if (!diffs.length) continue;
      const rand = rng(42), B = 4000, boots = [];
      for (let b = 0; b < B; b++) { let s = 0; for (let i = 0; i < diffs.length; i++) s += diffs[Math.floor(rand() * diffs.length)]; boots.push(s / diffs.length); }
      boots.sort((x, y) => x - y);
      (summary.paired[ref][a] ||= {})[c] = { nTasks: diffs.length, meanDiff: r4(mean(diffs)), ci95: [r4(boots[Math.floor(0.025 * B)]), r4(boots[Math.floor(0.975 * B)])], wins: diffs.filter((d) => d > 0).length, losses: diffs.filter((d) => d < 0).length };
    }
  }
}
// ledger
if (fs.existsSync(LEDGER)) {
  const L = fs.readFileSync(LEDGER, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const sum = (xs) => r6(xs.reduce((s, x) => s + x.cost_usd, 0));
  summary.ledger = { calls: L.length, totalUsd: sum(L), byPhase: Object.fromEntries(Object.entries(by(L, (x) => x.phase)).map(([k, v]) => [k, { calls: v.length, usd: sum(v) }])), byModelEffort: Object.fromEntries(Object.entries(by(L, (x) => `${x.model}/${x.effort}`)).map(([k, v]) => [k, { calls: v.length, usd: sum(v), meanUsd: r6(sum(v) / v.length), meanOutTok: Math.round(mean(v.map((x) => x.output_tokens))), meanLatencyS: r4(mean(v.map((x) => x.wall_ms / 1000))), failed: v.filter((x) => !x.ok).length }])) };
}
// chart-ready arrays
summary.charts = {
  paretoByClass: Object.fromEntries(Object.entries(summary.pareto).map(([c, v]) => [c, v.points.map((p) => ({ ...p, onFrontier: v.frontier.includes(p.arch) }))])),
  acceptByArchClass: archs.map((a) => ({ arch: a, ...Object.fromEntries(classesL.map((c) => [c, summary.byClass[c]?.[a]?.acceptRate ?? null])), all: summary.overall[a]?.acceptRate ?? null })),
  costPerAcceptedByArchClass: archs.map((a) => ({ arch: a, ...Object.fromEntries(classesL.map((c) => [c, summary.byClass[c]?.[a]?.costPerAccepted ?? null])), all: summary.overall[a]?.costPerAccepted ?? null })),
  falseSuccessByArch: archs.map((a) => ({ arch: a, rate: summary.overall[a].falseSuccessRate, n: summary.overall[a].falseSuccess })),
  latencyByArch: archs.map((a) => ({ arch: a, meanS: summary.overall[a].meanLatencyS, medianS: summary.overall[a].medianLatencyS })),
  difficulty: archs.map((a) => ({ arch: a, ...Object.fromEntries(Object.entries(summary.difficultyBins[a]).map(([b, v]) => [b, v?.acceptRate ?? null])) })),
};
fs.writeFileSync(outFile, JSON.stringify(summary, null, 2));

// console table
const pct = (x) => (x == null ? '  -  ' : (100 * x).toFixed(0).padStart(3) + '%');
console.log(`runs=${R.length} phases=${phases}`);
console.log('arch'.padEnd(12), 'n'.padStart(4), 'accept  CI95        ', 'a     b     c    ', 'FS  ', 'US$/run  ', 'US$/accept', 'lat(s)', 'calls');
for (const a of archs) {
  const s = summary.overall[a];
  console.log(a.padEnd(12), String(s.n).padStart(4), pct(s.acceptRate), `[${pct(s.ci95[0])},${pct(s.ci95[1])}]`, classesL.map((c) => pct(summary.byClass[c]?.[a]?.acceptRate)).join('  '), String(s.falseSuccess).padStart(3), ' ', (s.meanCost ?? 0).toFixed(5), ' ', s.costPerAccepted == null ? '   -   ' : s.costPerAccepted.toFixed(5), ' ', (s.meanLatencyS ?? 0).toFixed(1).padStart(5), ' ', s.meanCalls);
}
for (const c of Object.keys(summary.pareto)) console.log(`Pareto ${c}: ${summary.pareto[c].frontier.join(' → ')}`);
if (summary.ledger.totalUsd != null) console.log(`ledger: ${summary.ledger.calls} calls, US$ ${summary.ledger.totalUsd}`);
