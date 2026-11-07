// sim-elastico — swarm elástico com regra de parada por ganho marginal (expandir enquanto ΔP·V >= custo)
// vs N fixo (1,3,5,9) sobre uma mistura de dificuldades (fácil / média / acoplada), com teste de aceite imperfeito.
// Uso: node sims/sim-elastico.mjs
import { Rng, hashSeed, BASE_SEED, normInv, normCdf, normPdf, prop, Acc, RatioAcc, roundDeep, pct, num, ciNum, ciPct, mainIfDirect } from './lib.mjs';

export const ID = 'sim-elastico';
export const VERSION = '1.0.0';

export const HYPOTHESIS = {
  statement: 'Uma regra elástica que adiciona agentes enquanto o ganho marginal esperado (ΔP·V) supera o custo marginal, com ΔP estimado por um modelo bayesiano da dificuldade, entrega custo por tarefa aceita menor que qualquer N fixo, mantendo a taxa de aceite; o tamanho ótimo transita de 1 → micro → macro conforme a dificuldade e o valor da tarefa, e a regra só funciona bem se o modelo de ΔP considerar a correlação de erros.',
  predictions: [
    { id: 'P1', text: 'Para V em {10, 20}, elastico-seq tem custo por tarefa aceita menor que todo fixo-N (N=1,3,5,9; IC95% disjuntos) e taxa de aceite >= a do fixo-3 menos 1 p.p.' },
    { id: 'P2', text: 'Para todo V em {2,5,10,20,50,100}, a utilidade líquida média de elastico-seq não é significativamente menor que a do melhor fixo-N (IC95% da diferença pareada não fica inteiro abaixo de 0).' },
    { id: 'P3', text: 'Transições do N fixo ótimo por classe: fácil -> 1 para todo V>=5; média -> micro (2..5) para V em [10,50]; acoplada -> 0 (não tentar) para V<=5 e macro (>=6) para V>=50.' },
    { id: 'P4', text: 'Controlador mal especificado (supõe rho=0) tem custo por tarefa aceita maior que o calibrado para V>=20 (IC95% disjuntos).' },
    { id: 'P5', text: 'Uma sonda barata de dificuldade (custo 0,05, acerta a classe 80%) aumenta a utilidade líquida em relação a elastico-seq para V>=10 (IC95% pareado > 0).' },
    { id: 'P6', text: 'elastico-dobra (lotes 1,2,4,8,16) usa menos rodadas médias que elastico-seq, com custo por tarefa aceita no máximo 20% maior, para V>=10.' },
  ],
};

export const PARAMS = {
  seed: BASE_SEED,
  classes: [
    { name: 'facil', share: 0.5, p: 0.9, rho: 0.2 },
    { name: 'media', share: 0.35, p: 0.5, rho: 0.3 },
    { name: 'acoplada', share: 0.15, p: 0.15, rho: 0.5 },
  ],
  coupling_note: '"acoplada" = baixa chance por tentativa e alta correlação entre tentativas (bugs interdependentes); decomposição/especialização NÃO modelada',
  test: { sens: 1.0, spec: 0.98, cost: 0.1 },  // teste de aceite (ex.: testes automatizados): passa todo correto; deixa passar 2% dos errados
  attempt_cost: 1, Nmax: 32,
  Vs: [2, 5, 10, 20, 50, 100],
  fixed: [1, 3, 5, 9],
  probe: { cost: 0.05, accuracy: 0.8 },
  batches: [1, 2, 4, 8, 16],
  tasks: 40000,                    // tarefas por V (números aleatórios comuns entre políticas)
  utility: 'U = V*[aceita e correta] - custo - V*[aceita e errada]  (falso aceite custa tanto quanto o valor)',
  policies: {
    'fixo-N': 'N tentativas em paralelo, todas testadas; entrega a 1ª que passa; 1 rodada',
    'elastico-seq': 'tenta 1 por vez; antes de cada tentativa calcula P(próxima correta | k falhas) pelo posterior bayesiano (classe, fator latente) e continua se P*V >= custo da tentativa+teste',
    'elastico-dobra': 'como elastico-seq, mas em lotes 1,2,4,8,16: expande se P(>=1 correta no lote)*V >= custo do lote',
    'elastico-mis': 'elastico-seq com modelo mal especificado (supõe rho=0 em todas as classes)',
    'elastico-sonda': 'paga sonda de classe (custo 0,05, acerto 80%) e usa o posterior condicionado à sonda',
    'oraculo-classe': 'elastico-seq conhecendo a classe verdadeira (referência)',
  },
};

// ---------- modelo bayesiano sobre (classe, S) ----------
const GN = 241, GL = 6;
const GS = Array.from({ length: GN }, (_, i) => -GL + (2 * GL * i) / (GN - 1));
function qOf(p, rho, s) { return rho <= 0 ? p : normCdf((normInv(p) - Math.sqrt(rho) * s) / Math.sqrt(1 - rho)); }
// tabela: para k falhas observadas, P(próxima tentativa correta) e P(>=1 correta em b tentativas)
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

// ---------- exato (integração) para o N fixo ótimo por classe ----------
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
const sizeClass = (N) => (N === 0 ? 'nao-tentar' : N === 1 ? 'unico' : N <= 5 ? 'micro' : 'macro');

export function run() {
  const { classes, Vs, fixed, tasks, Nmax, test, attempt_cost: ca } = PARAMS;
  const unit = ca + test.cost;
  const shares = classes.map((c) => c.share);
  const tabCal = buildTable(shares), tabMis = buildTable(shares, true);
  const tabOracle = classes.map((_, ci) => buildTable(classes.map((__, j) => (j === ci ? 1 : 0))));
  const pa = PARAMS.probe.accuracy, pw = (1 - pa) / (classes.length - 1);
  const tabProbe = classes.map((_, o) => buildTable(shares.map((s, ci) => s * (ci === o ? pa : pw))));
  const stopK = (tab, V) => { let k = 0; while (k < Nmax && tab.next[k] * V >= unit) k++; return k; }; // nº máx. de tentativas sequenciais

  const policyNames = [...fixed.map((N) => `fixo-${N}`), 'elastico-seq', 'elastico-dobra', 'elastico-mis', 'elastico-sonda', 'oraculo-classe'];
  const perV = [];
  for (const V of Vs) {
    const rng = new Rng(hashSeed(BASE_SEED, ID, 'tasks', V));
    const kCal = stopK(tabCal, V), kMis = stopK(tabMis, V), kOr = tabOracle.map((t) => stopK(t, V)), kProbe = tabProbe.map((t) => stopK(t, V));
    const M = {}; for (const pn of policyNames) M[pn] = { acc: 0, corr: 0, fals: 0, cost: new Acc(), rounds: new Acc(), agents: new Acc(), util: new Acc(), cpa: new RatioAcc(), cpc: new RatioAcc(), byClass: classes.map(() => ({ n: 0, acc: 0, cost: 0 })) };
    const diffs = { 'U:elastico-seq - melhor-fixo': new Acc(), 'U:elastico-sonda - elastico-seq': new Acc() };
    const corr = new Uint8Array(Nmax), pass = new Uint8Array(Nmax);
    // melhor fixo por utilidade será decidido depois; guardamos utilidades por tarefa dos fixos para diferenças pareadas
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
      fixed.forEach((N, j) => { uFixed[j][t] = record(`fixo-${N}`, { idx: firstPass(N), cost: N * unit, rounds: 1, agents: N }); });
      const seq = (K, extra = 0) => { const fp = firstPass(K); const used = fp >= 0 ? fp + 1 : K; return { idx: fp, cost: used * unit + extra, rounds: used, agents: used }; };
      uSeq[t] = record('elastico-seq', seq(kCal));
      record('elastico-mis', seq(kMis));
      record('oraculo-classe', seq(kOr[ci]));
      uProbe[t] = record('elastico-sonda', seq(kProbe[probeOut], PARAMS.probe.cost));
      // dobra: lotes 1,2,4,8,16 (total <= 31)
      { let used = 0, rounds = 0, idx = -1;
        for (let j = 0; j < PARAMS.batches.length; j++) {
          const b = PARAMS.batches[j]; if (used + b > Nmax) break;
          if (tabCal.batch[used][j] * V < b * unit) break;
          rounds++; for (let i = used; i < used + b; i++) if (pass[i]) { idx = i; break; }
          used += b; if (idx >= 0) break;
        }
        record('elastico-dobra', { idx, cost: used * unit, rounds, agents: used }); }
    }
    const summary = {};
    for (const pn of policyNames) { const m = M[pn]; summary[pn] = { accept_rate: prop(m.acc, tasks), correct_accept_rate: prop(m.corr, tasks), false_accept_rate: prop(m.fals, tasks),
      cost_per_task: m.cost.ci(), cost_per_accepted: m.cpa.ci(), cost_per_correct_accepted: m.cpc.ci(), mean_rounds: m.rounds.ci(), mean_agents: m.agents.ci(), net_utility: m.util.ci(),
      by_class: m.byClass.map((b, i) => ({ class: classes[i].name, accept_rate: b.acc / b.n, cost_per_task: b.cost / b.n })) }; }
    const bestFixIdx = fixed.reduce((bi, N, j) => (summary[`fixo-${N}`].net_utility.mean > summary[`fixo-${fixed[bi]}`].net_utility.mean ? j : bi), 0);
    for (let t = 0; t < tasks; t++) { diffs['U:elastico-seq - melhor-fixo'].add(uSeq[t] - uFixed[bestFixIdx][t]); diffs['U:elastico-sonda - elastico-seq'].add(uProbe[t] - uSeq[t]); }
    perV.push({ V, stop_k: { 'elastico-seq': kCal, 'elastico-mis': kMis, 'oraculo-classe': Object.fromEntries(classes.map((c, i) => [c.name, kOr[i]])), 'elastico-sonda': Object.fromEntries(classes.map((c, i) => [`sonda=${c.name}`, kProbe[i]])) },
      best_fixed: `fixo-${fixed[bestFixIdx]}`, summary, paired: Object.fromEntries(Object.entries(diffs).map(([k, a]) => [k, a.ci()])) });
  }

  // ---------- transições: N fixo ótimo (exato) por classe e V ----------
  const Vgrid = [1, 1.5, 2, 3, 4, 5, 7, 10, 15, 20, 30, 50, 70, 100, 150, 200];
  const transitions = classes.map((c) => ({ class: c.name, p: c.p, rho: c.rho, V: Vgrid, best_N: Vgrid.map((V) => bestFixedN(c, V).N), size: Vgrid.map((V) => sizeClass(bestFixedN(c, V).N)),
    seq_stop_k: Vgrid.map((V) => { const tb = tabOracle[classes.indexOf(c)]; let k = 0; while (k < Nmax && tb.next[k] * V >= unit) k++; return k; }) }));

  // ---------- sensibilidade (pedido da coordenação): p do agente único x rho -> N ótimo; referência 0,45 (Kim et al.) ----------
  const sensPs = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95];
  const sensRhos = [0.2, 0.4, 0.55, 0.7], sensVs = [10, 20, 50];
  const sensitivity = { reference_threshold_kim_2025: 0.45, note: 'N fixo ótimo (exato) para uma classe isolada com acerto individual p; "valor marginal do 2º agente" = U(N=2)-U(N=1)', ps: sensPs, cells: [] };
  for (const rho of sensRhos) for (const V of sensVs) {
    const rows = sensPs.map((p) => { const c = { p, rho }; const b = bestFixedN(c, V); const e1 = fixedExact(c, 1), e2 = fixedExact(c, 2);
      const U1 = V * e1.pCorrect - unit - V * e1.pFalse, U2 = V * e2.pCorrect - 2 * unit - V * e2.pFalse; return { best_N: b.N, marginal_2nd: U2 - U1 }; });
    sensitivity.cells.push({ rho, V, best_N: rows.map((x) => x.best_N), marginal_value_2nd_agent: rows.map((x) => x.marginal_2nd),
      max_p_with_multi_agent_optimal: (() => { let m = null; sensPs.forEach((p, i) => { if (rows[i].best_N >= 2) m = p; }); return m; })() });
  }

  // ---------- testes ----------
  const atV = (V) => perV.find((x) => x.V === V);
  const p1rows = [10, 20].map((V) => { const S = atV(V).summary; const e = S['elastico-seq'];
    const cheaper = fixed.every((N) => e.cost_per_accepted.hi < S[`fixo-${N}`].cost_per_accepted.lo); const accOk = e.accept_rate.p >= S['fixo-3'].accept_rate.p - 0.01;
    return { V, cheaper, accOk, e: e.cost_per_accepted.ratio, f: fixed.map((N) => S[`fixo-${N}`].cost_per_accepted.ratio), accE: e.accept_rate.p, acc3: S['fixo-3'].accept_rate.p }; });
  const p1 = p1rows.every((x) => x.cheaper && x.accOk);
  const p2rows = Vs.map((V) => ({ V, d: atV(V).paired['U:elastico-seq - melhor-fixo'], best: atV(V).best_fixed }));
  const p2 = p2rows.every((x) => x.d.hi >= 0);
  const tr = (name) => transitions.find((x) => x.class === name);
  const sizeAt = (name, V) => sizeClass(bestFixedN(classes.find((c) => c.name === name), V).N);
  const p3a = Vgrid.filter((V) => V >= 5).every((V) => tr('facil').size[Vgrid.indexOf(V)] === 'unico');
  const p3b = [10, 15, 20, 30, 50].every((V) => sizeAt('media', V) === 'micro');
  const p3c = [1, 1.5, 2, 3, 4, 5].every((V) => sizeAt('acoplada', V) === 'nao-tentar') && [50, 70, 100, 150, 200].every((V) => sizeAt('acoplada', V) === 'macro');
  const p3 = p3a && p3b && p3c;
  const p4rows = Vs.filter((V) => V >= 20).map((V) => { const S = atV(V).summary; return { V, mis: S['elastico-mis'].cost_per_accepted, cal: S['elastico-seq'].cost_per_accepted }; });
  const p4 = p4rows.every((x) => x.mis.lo > x.cal.hi);
  const p5rows = Vs.filter((V) => V >= 10).map((V) => ({ V, d: atV(V).paired['U:elastico-sonda - elastico-seq'] }));
  const p5 = p5rows.every((x) => x.d.lo > 0);
  const p6rows = Vs.filter((V) => V >= 10).map((V) => { const S = atV(V).summary; return { V, rd: S['elastico-dobra'].mean_rounds.mean, rs: S['elastico-seq'].mean_rounds.mean, cd: S['elastico-dobra'].cost_per_accepted.ratio, cs: S['elastico-seq'].cost_per_accepted.ratio }; });
  const p6 = p6rows.every((x) => x.rd < x.rs && x.cd <= 1.2 * x.cs);
  const tests = [
    { id: 'P1', verdict: p1 ? 'suporta' : 'nao-suporta', detail: p1rows.map((x) => `V=${x.V}: custo/aceita elástico ${num(x.e)} vs fixos ${x.f.map((v) => num(v)).join('/')} (mais barato que todos=${x.cheaper}); aceite ${pct(x.accE)} vs fixo-3 ${pct(x.acc3)}`).join('; ') },
    { id: 'P2', verdict: p2 ? 'suporta' : 'nao-suporta', detail: p2rows.map((x) => `V=${x.V}: ΔU vs ${x.best} ${ciNum(x.d)}`).join('; ') },
    { id: 'P3', verdict: p3 ? 'suporta' : (p3a || p3b || p3c ? 'suporta-parcialmente' : 'nao-suporta'), detail: `fácil→1 (V>=5)=${p3a}; média→micro (V 10–50)=${p3b}; acoplada→0 (V<=5) e macro (V>=50)=${p3c}. N ótimo por V ${JSON.stringify(Vgrid)}: ` + transitions.map((x) => `${x.class} ${JSON.stringify(x.best_N)}`).join('; ') },
    { id: 'P4', verdict: p4 ? 'suporta' : 'nao-suporta', detail: p4rows.map((x) => `V=${x.V}: mal especificado ${ciNum(x.mis)} vs calibrado ${ciNum(x.cal)}`).join('; ') },
    { id: 'P5', verdict: p5 ? 'suporta' : 'nao-suporta', detail: p5rows.map((x) => `V=${x.V}: ΔU sonda−seq ${ciNum(x.d, 3)}`).join('; ') },
    { id: 'P6', verdict: p6 ? 'suporta' : 'nao-suporta', detail: p6rows.map((x) => `V=${x.V}: rodadas ${num(x.rd)} vs ${num(x.rs)}; custo/aceita ${num(x.cd)} vs ${num(x.cs)}`).join('; ') },
  ];
  const S20 = atV(20).summary;
  const line = (pn) => `V=20 ${pn}: aceite ${ciPct(S20[pn].accept_rate)}, custo/aceita ${ciNum(S20[pn].cost_per_accepted)}, utilidade ${ciNum(S20[pn].net_utility)}, agentes ${num(S20[pn].mean_agents.mean)}`;
  const headline = [line('fixo-1'), line('fixo-3'), line('fixo-9'), line('elastico-seq'), line('elastico-sonda'), line('oraculo-classe'),
    `Transições (N fixo ótimo): fácil ${tr('facil').best_N.join(',')}; média ${tr('media').best_N.join(',')}; acoplada ${tr('acoplada').best_N.join(',')} para V=${Vgrid.join(',')}`];
  return roundDeep({ id: ID, version: VERSION, title: 'Swarm elástico por ganho marginal vs N fixo', seed: BASE_SEED,
    hypothesis: HYPOTHESIS, params: PARAMS, results: { per_V: perV, transitions, sensitivity }, tests, headline }, 4);
}

mainIfDirect(import.meta.url, run);
