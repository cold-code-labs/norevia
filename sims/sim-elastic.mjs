// sim-elastic — elastic swarm with a marginal-gain stopping rule (expand while ΔP·V >= cost)
// vs fixed N (1,3,5,9) over a mixture of difficulties (easy / medium / coupled), with an imperfect acceptance test.
// Usage: node sims/sim-elastic.mjs
import { Rng, hashSeed, seedKey, BASE_SEED, normInv, normCdf, normPdf, prop, Acc, RatioAcc, roundDeep, pct, num, ciNum, ciPct, mainIfDirect } from './lib.mjs';

export const ID = 'sim-elastic';
export const VERSION = '1.0.0';
const SEED_ID = seedKey(ID); // frozen seed key (see FROZEN_SEED_KEYS in lib.mjs)

export const HYPOTHESIS = {
  statement: 'An elastic rule that adds agents while the expected marginal gain (ΔP·V) exceeds the marginal cost, with ΔP estimated by a Bayesian model of difficulty, delivers lower cost per accepted task than any fixed N while maintaining the acceptance rate; the optimal size moves from 1 → micro → macro with task difficulty and value, and the rule only works well if the ΔP model accounts for error correlation.',
  predictions: [
    { id: 'P1', text: 'For V in {10, 20}, elastic-seq has lower cost per accepted task than every fixed-N (N=1,3,5,9; disjoint 95% CIs) and an acceptance rate >= that of fixed-3 minus 1 p.p.' },
    { id: 'P2', text: 'For every V in {2,5,10,20,50,100}, the mean net utility of elastic-seq is not significantly lower than that of the best fixed-N (the 95% CI of the paired difference does not lie entirely below 0).' },
    { id: 'P3', text: 'Transitions of the optimal fixed N by class: easy -> 1 for every V>=5; medium -> micro (2..5) for V in [10,50]; coupled -> 0 (do not attempt) for V<=5 and macro (>=6) for V>=50.' },
    { id: 'P4', text: 'A misspecified controller (assumes rho=0) has higher cost per accepted task than the calibrated one for V>=20 (disjoint 95% CIs).' },
    { id: 'P5', text: 'A cheap difficulty probe (cost 0.05, identifies the class correctly 80% of the time) increases net utility relative to elastic-seq for V>=10 (paired 95% CI > 0).' },
    { id: 'P6', text: 'elastic-doubling (batches 1,2,4,8,16) uses fewer mean rounds than elastic-seq, with cost per accepted task at most 20% higher, for V>=10.' },
  ],
};

export const PARAMS = {
  seed: BASE_SEED,
  classes: [
    { name: 'easy', share: 0.5, p: 0.9, rho: 0.2 },
    { name: 'medium', share: 0.35, p: 0.5, rho: 0.3 },
    { name: 'coupled', share: 0.15, p: 0.15, rho: 0.5 },
  ],
  coupling_note: '"coupled" = low per-attempt success chance and high correlation between attempts (interdependent bugs); decomposition/specialisation NOT modelled',
  test: { sens: 1.0, spec: 0.98, cost: 0.1 },  // acceptance test (e.g. automated tests): passes every correct answer; lets 2% of wrong ones through
  attempt_cost: 1, Nmax: 32,
  Vs: [2, 5, 10, 20, 50, 100],
  fixed: [1, 3, 5, 9],
  probe: { cost: 0.05, accuracy: 0.8 },
  batches: [1, 2, 4, 8, 16],
  tasks: 40000,                    // tasks per V (common random numbers across policies)
  utility: 'U = V*[accepted and correct] - cost - V*[accepted and wrong]  (a false accept costs as much as the value)',
  policies: {
    'fixed-N': 'N attempts in parallel, all tested; delivers the 1st that passes; 1 round',
    'elastic-seq': 'one attempt at a time; before each attempt computes P(next correct | k failures) from the Bayesian posterior (class, latent factor) and continues if P*V >= cost of attempt+test',
    'elastic-doubling': 'like elastic-seq, but in batches 1,2,4,8,16: expands if P(>=1 correct in the batch)*V >= cost of the batch',
    'elastic-mis': 'elastic-seq with a misspecified model (assumes rho=0 in every class)',
    'elastic-probe': 'pays for a class probe (cost 0.05, 80% correct) and uses the posterior conditioned on the probe',
    'class-oracle': 'elastic-seq knowing the true class (reference)',
  },
};

// ---------- Bayesian model over (class, S) ----------
const GN = 241, GL = 6;
const GS = Array.from({ length: GN }, (_, i) => -GL + (2 * GL * i) / (GN - 1));
function qOf(p, rho, s) { return rho <= 0 ? p : normCdf((normInv(p) - Math.sqrt(rho) * s) / Math.sqrt(1 - rho)); }
// table: for k observed failures, P(next attempt correct) and P(>=1 correct in b attempts)
function buildTable(classWeights, assumeRho0 = false) {
  const { spec } = PARAMS.test;
  const comps = [];
  PARAMS.classes.forEach((c, ci) => { if (classWeights[ci] <= 0) return; for (const s of GS) comps.push({ w: classWeights[ci] * normPdf(s), q: qOf(c.p, assumeRho0 ? 0 : c.rho, s) }); });
  const next = [], batch = [];
  for (let k = 0; k <= PARAMS.Nmax; k++) {
    let Z = 0, A = 0; const B = PARAMS.batches.map(() => 0);
    for (const x of comps) { const L = x.w * Math.pow((1 - x.q) * spec, k); Z += L; A += L * x.q; PARAMS.batches.forEach((b, j) => { B[j] += L * (1 - Math.pow(1 - x.q, b)); }); }
    next.push(Z > 0 ? A / Z : 0); batch.push(B.map((v) => (Z > 0 ? v / Z : 0)));
  }
  return { next, batch };
}

// ---------- exact (integration) for the optimal fixed N per class ----------
function fixedExact(c, N) {
  const { spec } = PARAMS.test; let pc = 0, pf = 0, Z = 0;
  for (const s of GS) { const w = normPdf(s); Z += w; const q = qOf(c.p, c.rho, s), r = (1 - q) * spec; const g = Math.abs(1 - r) < 1e-15 ? N : (1 - Math.pow(r, N)) / (1 - r); pc += w * q * g; pf += w * (1 - q) * (1 - spec) * g; }
  return { pCorrect: pc / Z, pFalse: pf / Z };
}
function bestFixedN(c, V) {
  let best = { N: 0, U: 0 };
  for (let N = 1; N <= PARAMS.Nmax; N++) { const e = fixedExact(c, N); const U = V * e.pCorrect - N * (PARAMS.attempt_cost + PARAMS.test.cost) - V * e.pFalse; if (U > best.U + 1e-12) best = { N, U }; }
  return best;
}
const sizeClass = (N) => (N === 0 ? 'do-not-attempt' : N === 1 ? 'single' : N <= 5 ? 'micro' : 'macro');

export function run() {
  const { classes, Vs, fixed, tasks, Nmax, test, attempt_cost: ca } = PARAMS;
  const unit = ca + test.cost;
  const shares = classes.map((c) => c.share);
  const tabCal = buildTable(shares), tabMis = buildTable(shares, true);
  const tabOracle = classes.map((_, ci) => buildTable(classes.map((__, j) => (j === ci ? 1 : 0))));
  const pa = PARAMS.probe.accuracy, pw = (1 - pa) / (classes.length - 1);
  const tabProbe = classes.map((_, o) => buildTable(shares.map((s, ci) => s * (ci === o ? pa : pw))));
  const stopK = (tab, V) => { let k = 0; while (k < Nmax && tab.next[k] * V >= unit) k++; return k; }; // max. number of sequential attempts

  const policyNames = [...fixed.map((N) => `fixed-${N}`), 'elastic-seq', 'elastic-doubling', 'elastic-mis', 'elastic-probe', 'class-oracle'];
  const perV = [];
  for (const V of Vs) {
    const rng = new Rng(hashSeed(BASE_SEED, SEED_ID, 'tasks', V));
    const kCal = stopK(tabCal, V), kMis = stopK(tabMis, V), kOr = tabOracle.map((t) => stopK(t, V)), kProbe = tabProbe.map((t) => stopK(t, V));
    const M = {}; for (const pn of policyNames) M[pn] = { acc: 0, corr: 0, fals: 0, cost: new Acc(), rounds: new Acc(), agents: new Acc(), util: new Acc(), cpa: new RatioAcc(), cpc: new RatioAcc(), byClass: classes.map(() => ({ n: 0, acc: 0, cost: 0 })) };
    const diffs = { 'U:elastic-seq - best-fixed': new Acc(), 'U:elastic-probe - elastic-seq': new Acc() };
    const corr = new Uint8Array(Nmax), pass = new Uint8Array(Nmax);
    // the best fixed N by utility is decided afterwards; per-task utilities of the fixed policies are kept for paired differences
    const uFixed = fixed.map(() => new Float64Array(tasks)), uSeq = new Float64Array(tasks), uProbe = new Float64Array(tasks);
    for (let t = 0; t < tasks; t++) {
      const u0 = rng.uniform(); let ci = 0, cum = 0; for (; ci < classes.length - 1; ci++) { cum += classes[ci].share; if (u0 < cum) break; }
      const c = classes[ci]; const S = rng.normal(); const zp = normInv(c.p), sr = Math.sqrt(c.rho), se = Math.sqrt(1 - c.rho);
      for (let i = 0; i < Nmax; i++) { const ok = sr * S + se * rng.normal() < zp; corr[i] = ok ? 1 : 0; pass[i] = ok ? 1 : (rng.uniform() < 1 - test.spec ? 1 : 0); }
      const probeOut = rng.uniform() < pa ? ci : (() => { const others = classes.map((_, j) => j).filter((j) => j !== ci); return others[rng.int(others.length)]; })();
      const record = (pn, res) => {
        const m = M[pn]; const accepted = res.idx >= 0; const isC = accepted && corr[res.idx] === 1;
        if (accepted) m.acc++; if (isC) m.corr++; if (accepted && !isC) m.fals++;
        const U = (isC ? V : 0) - res.cost - (accepted && !isC ? V : 0);
        m.cost.add(res.cost); m.rounds.add(res.rounds); m.agents.add(res.agents); m.util.add(U); m.cpa.add(res.cost, accepted ? 1 : 0); m.cpc.add(res.cost, isC ? 1 : 0);
        const bc = m.byClass[ci]; bc.n++; bc.acc += accepted ? 1 : 0; bc.cost += res.cost;
        return U;
      };
      const firstPass = (n) => { for (let i = 0; i < n; i++) if (pass[i]) return i; return -1; };
      fixed.forEach((N, j) => { uFixed[j][t] = record(`fixed-${N}`, { idx: firstPass(N), cost: N * unit, rounds: 1, agents: N }); });
      const seq = (K, extra = 0) => { const fp = firstPass(K); const used = fp >= 0 ? fp + 1 : K; return { idx: fp, cost: used * unit + extra, rounds: used, agents: used }; };
      uSeq[t] = record('elastic-seq', seq(kCal));
      record('elastic-mis', seq(kMis));
      record('class-oracle', seq(kOr[ci]));
      uProbe[t] = record('elastic-probe', seq(kProbe[probeOut], PARAMS.probe.cost));
      // doubling: batches 1,2,4,8,16 (total <= 31)
      { let used = 0, rounds = 0, idx = -1;
        for (let j = 0; j < PARAMS.batches.length; j++) {
          const b = PARAMS.batches[j]; if (used + b > Nmax) break;
          if (tabCal.batch[used][j] * V < b * unit) break;
          rounds++; for (let i = used; i < used + b; i++) if (pass[i]) { idx = i; break; }
          used += b; if (idx >= 0) break;
        }
        record('elastic-doubling', { idx, cost: used * unit, rounds, agents: used }); }
    }
    const summary = {};
    for (const pn of policyNames) { const m = M[pn]; summary[pn] = { accept_rate: prop(m.acc, tasks), correct_accept_rate: prop(m.corr, tasks), false_accept_rate: prop(m.fals, tasks),
      cost_per_task: m.cost.ci(), cost_per_accepted: m.cpa.ci(), cost_per_correct_accepted: m.cpc.ci(), mean_rounds: m.rounds.ci(), mean_agents: m.agents.ci(), net_utility: m.util.ci(),
      by_class: m.byClass.map((b, i) => ({ class: classes[i].name, accept_rate: b.acc / b.n, cost_per_task: b.cost / b.n })) }; }
    const bestFixIdx = fixed.reduce((bi, N, j) => (summary[`fixed-${N}`].net_utility.mean > summary[`fixed-${fixed[bi]}`].net_utility.mean ? j : bi), 0);
    for (let t = 0; t < tasks; t++) { diffs['U:elastic-seq - best-fixed'].add(uSeq[t] - uFixed[bestFixIdx][t]); diffs['U:elastic-probe - elastic-seq'].add(uProbe[t] - uSeq[t]); }
    perV.push({ V, stop_k: { 'elastic-seq': kCal, 'elastic-mis': kMis, 'class-oracle': Object.fromEntries(classes.map((c, i) => [c.name, kOr[i]])), 'elastic-probe': Object.fromEntries(classes.map((c, i) => [`probe=${c.name}`, kProbe[i]])) },
      best_fixed: `fixed-${fixed[bestFixIdx]}`, summary, paired: Object.fromEntries(Object.entries(diffs).map(([k, a]) => [k, a.ci()])) });
  }

  // ---------- transitions: optimal fixed N (exact) by class and V ----------
  const Vgrid = [1, 1.5, 2, 3, 4, 5, 7, 10, 15, 20, 30, 50, 70, 100, 150, 200];
  const transitions = classes.map((c) => ({ class: c.name, p: c.p, rho: c.rho, V: Vgrid, best_N: Vgrid.map((V) => bestFixedN(c, V).N), size: Vgrid.map((V) => sizeClass(bestFixedN(c, V).N)),
    seq_stop_k: Vgrid.map((V) => { const tb = tabOracle[classes.indexOf(c)]; let k = 0; while (k < Nmax && tb.next[k] * V >= unit) k++; return k; }) }));

  // ---------- sensitivity (requested by coordination): single-agent p x rho -> optimal N; reference 0.45 (Kim et al.) ----------
  const sensPs = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95];
  const sensRhos = [0.2, 0.4, 0.55, 0.7], sensVs = [10, 20, 50];
  const sensitivity = { reference_threshold_kim_2025: 0.45, note: 'optimal fixed N (exact) for a single isolated class with individual success probability p; "marginal value of the 2nd agent" = U(N=2)-U(N=1)', ps: sensPs, cells: [] };
  for (const rho of sensRhos) for (const V of sensVs) {
    const rows = sensPs.map((p) => { const c = { p, rho }; const b = bestFixedN(c, V); const e1 = fixedExact(c, 1), e2 = fixedExact(c, 2);
      const U1 = V * e1.pCorrect - unit - V * e1.pFalse, U2 = V * e2.pCorrect - 2 * unit - V * e2.pFalse; return { best_N: b.N, marginal_2nd: U2 - U1 }; });
    sensitivity.cells.push({ rho, V, best_N: rows.map((x) => x.best_N), marginal_value_2nd_agent: rows.map((x) => x.marginal_2nd),
      max_p_with_multi_agent_optimal: (() => { let m = null; sensPs.forEach((p, i) => { if (rows[i].best_N >= 2) m = p; }); return m; })() });
  }

  // ---------- tests ----------
  const atV = (V) => perV.find((x) => x.V === V);
  const p1rows = [10, 20].map((V) => { const S = atV(V).summary; const e = S['elastic-seq'];
    const cheaper = fixed.every((N) => e.cost_per_accepted.hi < S[`fixed-${N}`].cost_per_accepted.lo); const accOk = e.accept_rate.p >= S['fixed-3'].accept_rate.p - 0.01;
    return { V, cheaper, accOk, e: e.cost_per_accepted.ratio, f: fixed.map((N) => S[`fixed-${N}`].cost_per_accepted.ratio), accE: e.accept_rate.p, acc3: S['fixed-3'].accept_rate.p }; });
  const p1 = p1rows.every((x) => x.cheaper && x.accOk);
  const p2rows = Vs.map((V) => ({ V, d: atV(V).paired['U:elastic-seq - best-fixed'], best: atV(V).best_fixed }));
  const p2 = p2rows.every((x) => x.d.hi >= 0);
  const tr = (name) => transitions.find((x) => x.class === name);
  const sizeAt = (name, V) => sizeClass(bestFixedN(classes.find((c) => c.name === name), V).N);
  const p3a = Vgrid.filter((V) => V >= 5).every((V) => tr('easy').size[Vgrid.indexOf(V)] === 'single');
  const p3b = [10, 15, 20, 30, 50].every((V) => sizeAt('medium', V) === 'micro');
  const p3c = [1, 1.5, 2, 3, 4, 5].every((V) => sizeAt('coupled', V) === 'do-not-attempt') && [50, 70, 100, 150, 200].every((V) => sizeAt('coupled', V) === 'macro');
  const p3 = p3a && p3b && p3c;
  const p4rows = Vs.filter((V) => V >= 20).map((V) => { const S = atV(V).summary; return { V, mis: S['elastic-mis'].cost_per_accepted, cal: S['elastic-seq'].cost_per_accepted }; });
  const p4 = p4rows.every((x) => x.mis.lo > x.cal.hi);
  const p5rows = Vs.filter((V) => V >= 10).map((V) => ({ V, d: atV(V).paired['U:elastic-probe - elastic-seq'] }));
  const p5 = p5rows.every((x) => x.d.lo > 0);
  const p6rows = Vs.filter((V) => V >= 10).map((V) => { const S = atV(V).summary; return { V, rd: S['elastic-doubling'].mean_rounds.mean, rs: S['elastic-seq'].mean_rounds.mean, cd: S['elastic-doubling'].cost_per_accepted.ratio, cs: S['elastic-seq'].cost_per_accepted.ratio }; });
  const p6 = p6rows.every((x) => x.rd < x.rs && x.cd <= 1.2 * x.cs);
  const tests = [
    { id: 'P1', verdict: p1 ? 'supported' : 'not supported', detail: p1rows.map((x) => `V=${x.V}: cost/accepted elastic ${num(x.e)} vs fixed ${x.f.map((v) => num(v)).join('/')} (cheaper than all=${x.cheaper}); acceptance ${pct(x.accE)} vs fixed-3 ${pct(x.acc3)}`).join('; ') },
    { id: 'P2', verdict: p2 ? 'supported' : 'not supported', detail: p2rows.map((x) => `V=${x.V}: ΔU vs ${x.best} ${ciNum(x.d)}`).join('; ') },
    { id: 'P3', verdict: p3 ? 'supported' : (p3a || p3b || p3c ? 'partially supported' : 'not supported'), detail: `easy→1 (V>=5)=${p3a}; medium→micro (V 10–50)=${p3b}; coupled→0 (V<=5) and macro (V>=50)=${p3c}. Optimal N by V ${JSON.stringify(Vgrid)}: ` + transitions.map((x) => `${x.class} ${JSON.stringify(x.best_N)}`).join('; ') },
    { id: 'P4', verdict: p4 ? 'supported' : 'not supported', detail: p4rows.map((x) => `V=${x.V}: misspecified ${ciNum(x.mis)} vs calibrated ${ciNum(x.cal)}`).join('; ') },
    { id: 'P5', verdict: p5 ? 'supported' : 'not supported', detail: p5rows.map((x) => `V=${x.V}: ΔU probe−seq ${ciNum(x.d, 3)}`).join('; ') },
    { id: 'P6', verdict: p6 ? 'supported' : 'not supported', detail: p6rows.map((x) => `V=${x.V}: rounds ${num(x.rd)} vs ${num(x.rs)}; cost/accepted ${num(x.cd)} vs ${num(x.cs)}`).join('; ') },
  ];
  const S20 = atV(20).summary;
  const line = (pn) => `V=20 ${pn}: acceptance ${ciPct(S20[pn].accept_rate)}, cost/accepted ${ciNum(S20[pn].cost_per_accepted)}, utility ${ciNum(S20[pn].net_utility)}, agents ${num(S20[pn].mean_agents.mean)}`;
  const headline = [line('fixed-1'), line('fixed-3'), line('fixed-9'), line('elastic-seq'), line('elastic-probe'), line('class-oracle'),
    `Transitions (optimal fixed N): easy ${tr('easy').best_N.join(',')}; medium ${tr('medium').best_N.join(',')}; coupled ${tr('coupled').best_N.join(',')} for V=${Vgrid.join(',')}`];
  return roundDeep({ id: ID, version: VERSION, title: 'Elastic swarm by marginal gain vs fixed N', seed: BASE_SEED,
    hypothesis: HYPOTHESIS, params: PARAMS, results: { per_V: perV, transitions, sensitivity }, tests, headline }, 4);
}

mainIfDirect(import.meta.url, run);
