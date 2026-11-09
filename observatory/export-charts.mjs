// Exports small, flat, chart-ready tables for the site from the LAB-001…004 result files → results/charts/*.json.
// Conventions of the site's chart generator (site/lib/charts.mjs): numeric x column named n_agents or k (line charts), or a string column named x (bar charts);
// series column named policy or condition; at most 8 series per chart. Raw runs, ledgers and transcripts stay in results/lab00N/.
// node observatory/export-charts.mjs
import fs from 'node:fs'; import path from 'node:path';
const R = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../results'); const OUT = path.join(R, 'charts'); fs.mkdirSync(OUT, { recursive: true });
const J = (f) => JSON.parse(fs.readFileSync(path.join(R, f), 'utf8')); const put = (name, rows) => { fs.writeFileSync(path.join(OUT, name), JSON.stringify(rows, null, 1)); console.log(name.padEnd(46), rows.length, 'rows'); };
const r3 = (x, d = 4) => (x == null || !Number.isFinite(x) ? null : +x.toFixed(d));
// ---- LAB-001
{ const p = J('lab001/summary.json'); put('lab001-primary-by-arm.json', p.arms.map((a) => ({ x: a.arm, accepted_tasks: a.accepted, false_success: a.falseSuccess, mean_cost_usd: a.meanCost, median_latency_s: a.medianLatencyS })));
  const s = J('lab001/summary-secondary.json'); put('lab001-packages-by-arm.json', s.arms.map((a) => ({ x: a.arm, package_accept_rate: a.pkgRate, hidden_pass_rate: a.hiddenPassFrac, cost_per_accepted_package_usd: a.costPerPkg, median_latency_s: a.latencyMedianS }))); }
// ---- LAB-002
{ const s = J('lab002/summary.json'); put('lab002-by-arm.json', Object.entries(s.arms).map(([arm, a]) => ({ x: arm, accepted_of_14: a.accepted, false_success: a.falseSuccess, cost_total_usd: a.costTotal })));
  put('lab002-responsiveness.json', Object.entries(s.responsiveness).map(([arm, a]) => ({ x: arm, conversation_blocked_s: a.mainBlockedS, batch_wall_s: a.batchWallS })));
  put('lab002-by-request-type.json', Object.entries(s.byType).flatMap(([type, arms]) => Object.entries(arms).map(([arm, a]) => ({ x: type, policy: arm, cost_per_request_usd: a.costPerRequest, calls_per_request: a.calls })))); }
// ---- LAB-003
{ const s = J('lab003/summary.json'); const q1 = []; for (const [k, v] of Object.entries(s.Q1.byK)) for (const arm of ['SOLO', 'TEAM']) { const a = v[arm]; q1.push({ k: Number(k), policy: arm, acceptance_rate: a.acceptance, cost_per_accepted_usd: a.costPerAccepted, package_accept_rate: a.pkgAcceptance, hidden_pass_rate: a.finalFrac }); } put('lab003-q1-split-by-packages.json', q1);
  put('lab003-q1-cost-ratio.json', Object.entries(s.Q1.byK).map(([k, v]) => ({ k: Number(k), team_over_solo_cost_ratio: v.rho })));
  const q2 = (f) => Object.entries(J(f).Q2.arms).map(([arm, a]) => ({ x: arm, task_acceptance_rate: a.acceptance, package_accept_rate: a.pkgAcceptance, cost_per_accepted_usd: a.costPerAccepted, extra_calls: a.meanExtraCalls })); put('lab003-q2-retry-vs-recruit.json', q2('lab003/summary.json')); put('lab003-q2b-harder-regime.json', q2('lab003/summary-q2b.json'));
  const q3 = s.Q3.all; put('lab003-q3-memory.json', [['NOMEM', q3.firstPassFailure.NOMEM, q3.costPerAccepted.NOMEM], ['MEM', q3.firstPassFailure.MEM, q3.costPerAccepted.MEM]].map(([arm, f, c]) => ({ x: arm, first_pass_failure_rate: f, cost_per_accepted_usd: c })));
  const c1 = J('lab003/calibration-cal.json'), c2 = J('lab003/calibration-cal2.json'); put('lab003-step0-false-success.json', [
    ['k=1 first pass', 'visible-only probe', c1.firstPass.oldVisible.fsRate], ['k=1 first pass', 'strengthened probe', c1.firstPass.share60.fsRate], ['k=1 after repair', 'strengthened probe', c1.afterRepair.newProbe.fsRate],
    ['k>=3 first pass', 'visible-only probe', c2.pooled.fsFirstOld.rate], ['k>=3 first pass', 'strengthened probe', c2.pooled.fsFirstNew.rate], ['k>=3 after repair', 'strengthened probe', c2.pooled.fsAfterRepairNew.rate]].map(([set, probe, fsr]) => ({ x: set, condition: probe, false_success_rate: fsr }))); }
// ---- LAB-004 (12 arms are split in two groups of ≤ 8 series so that no arm is folded away by the chart generator)
{ const G1 = ['ORCH', 'ORCH-U', 'INDEP', 'VOTE', 'BOARD', 'WOUND'], G2 = ['BOARD', 'QUORUM', 'LOCUST', 'ECOLI', 'LEADERS', 'RENAL', 'HISTORY']; const s = J('lab004/summary.json');
  const real = (arms) => arms.flatMap((arm) => Object.entries(s.arms[arm]).map(([N, v]) => ({ n_agents: Number(N), policy: arm, coverage_rate: v.coverage, false_success_rate: v.fsRate, accepted_per_usd: v.acceptedPerUsd, duplicates_rate: v.dupPerCall })));
  put('lab004-real-curves-baselines.json', real(G1)); put('lab004-real-curves-flags.json', real(G2));
  const e = J('lab004/sim-extrapolation.json'); for (const [scn, tag] of [['fixedPool630', 'fixed-pool'], ['constantDensity', 'constant-density']]) { const sim = (arms) => arms.flatMap((arm) => e.scenarios[scn][arm].map((r) => ({ n_agents: r.N, policy: arm, coverage_rate: r.coverage, false_success_rate: r.fsRate, accepted_per_usd: r.acceptedPerUsd, conflicts_rate: r.conflictsPerCall }))); put(`lab004-sim-${tag}-baselines.json`, sim(G1)); put(`lab004-sim-${tag}-flags.json`, sim(G2)); }
  const v = J('lab004/sim-validation.json'); put('lab004-sim-validation-heldout.json', Object.entries(v.arms).flatMap(([arm, a]) => a.points.map((p) => ({ x: arm, condition: `N=${p.N}`, coverage_error_pct: r3(p.errCov * 100, 1) }))));
  const ref = s.verdictsCovRef['1000'] || {}; put('lab004-flag-verdicts-n1000.json', Object.entries(ref).map(([flag, x]) => ({ x: flag, accepted_per_usd_ratio: x.ratioAcceptedPerUsd, false_success_rate: x.fsRate, delta_coverage_rate: x.deltaCoverage }))); }

// ---- LAB-005
{ const arms = (N) => { const s = J(`lab005/summary-N${N}.json`); return Object.entries(s.arms); };
  put('lab005-n100-static-by-arm.json', arms(100).map(([a, v]) => ({ x: a, coverage_rate: v.coverage, accepted_per_usd: v.acceptedPerUsd, false_success_rate: v.fsRate, duplicates_rate: v.dupPerCall })));
  put('lab005-n300-static-by-arm.json', arms(300).filter(([a]) => a.startsWith('S-')).map(([a, v]) => ({ x: a, coverage_rate: v.coverage, accepted_per_usd: v.acceptedPerUsd, false_success_rate: v.fsRate, duplicates_rate: v.dupPerCall })));
  put('lab005-n300-dynamic-cost-vs-wait.json', arms(300).filter(([a]) => a.startsWith('D-')).map(([a, v]) => ({ x: a, accepted_per_usd: v.acceptedPerUsd, mean_wait_rounds: v.meanWaitRounds, coverage_rate: v.coverage, calls: v.calls }))); }
// ---- LAB-006
{ const s = J('lab006/summary.json'); const rows = []; for (const [g, v] of Object.entries(s.groups)) for (const [arm, a] of Object.entries(v.arms)) rows.push({ x: g, policy: arm, acceptance_rate: a.acceptance, cost_per_accepted_usd: a.costPerAccepted, median_critical_path_s: a.medianCriticalPathS, false_success: a.falseSuccess });
  const by = (names) => rows.filter((r) => names.includes(r.x)); put('lab006-repo-by-size.json', by(['repo k=1', 'repo k=3', 'repo k=8', 'repo k=15'])); put('lab006-micro-by-size.json', by(['micro m=3', 'micro m=8', 'micro m=15'])); put('lab006-pooled.json', by(['ALL repo tasks', 'ALL micro bundles'])); }
