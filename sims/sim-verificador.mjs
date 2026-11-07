// sim-verificador — best-of-N com verificador imperfeito vs voto majoritário vs agente único.
// Mede acurácia (acerto entregue), taxa de falso sucesso (entrega errada declarada como sucesso), abstenção e custo.
// Uso: node sims/sim-verificador.mjs
import { Rng, hashSeed, BASE_SEED, normInv, prop, RatioAcc, roundDeep, pct, ciPct, num, ciNum, mainIfDirect } from './lib.mjs';

export const ID = 'sim-verificador';
export const VERSION = '1.0.0';

export const HYPOTHESIS = {
  statement: 'Um verificador imperfeito, porém com especificidade alta e erros não correlacionados com os geradores, reduz o falso sucesso abaixo do voto e do agente único; mas, como cada tentativa extra é uma nova chance de aceitar um erro, o falso sucesso do best-of-N cresce com N, e um verificador fraco ou correlacionado com a dificuldade da tarefa pode ser pior que o voto.',
  predictions: [
    { id: 'P1', text: 'Com spec >= 0,95 e rho_v=0, bon-seq tem taxa de falso sucesso (FS) menor que voto-N e que único-alto (mesmo orçamento de geração) para todo N>=3 e todo rho (IC95% de Wilson não se sobrepõem).' },
    { id: 'P2', text: 'O FS de bon-seq é não decrescente em N (tolerância: queda máxima < 1 p.p.) em todas as células; com rho=rho_v=0 o FS observado coincide com a fórmula FS(N) = r_w/(r_c+r_w)*(1-(1-r_c-r_w)^N), r_c=p*sens, r_w=(1-p)(1-spec), dentro do IC95% em >= 90% dos pontos.' },
    { id: 'P3', text: 'Verificador correlacionado com a dificuldade (rho_v=0,5) aumenta o FS de bon-seq em relação a rho_v=0 (mesmos sens/spec marginais) para rho>=0,3 e N>=3 em todas as combinações sens/spec com spec<0,99.' },
    { id: 'P4', text: 'Com verificador fraco (spec=0,5) e rho=0, bon-seq tem FS maior que o voto em N=33 (verificador fraco pior que voto quando erros são independentes).' },
    { id: 'P5', text: 'Com rho_v=0, a vantagem de acurácia de bon-seq sobre o voto em N=9 cresce com rho (rho=0 < 0,3 < 0,6) para spec>=0,8.' },
  ],
};

export const PARAMS = {
  seed: BASE_SEED,
  err1: 0.4, beta: 0.5, effort_model: 'p(e) = 1 - err1 * e^(-beta); agente baixo e=1 -> p=0,6',
  rhos: [0, 0.3, 0.6],          // correlação latente entre geradores
  rho_vs: [0, 0.5],             // correlação do verificador com o fator latente da tarefa (aceitar errado em tarefa difícil)
  sens: [0.8, 0.95],            // P(aceitar | candidato correto)
  spec: [0.5, 0.8, 0.95, 0.99], // P(rejeitar | candidato errado)
  Ns: [1, 2, 3, 5, 9, 17, 33],
  replicas: 10000,              // tarefas por célula (números aleatórios comuns entre N e estratégias)
  verify_costs: [0.2, 1.0],     // custo de 1 verificação em unidades de 1 geração de esforço baixo
  strategies: {
    'unico-baixo': '1 agente (e=1), sempre entrega',
    'unico-alto': '1 agente com esforço e=N (mesmo orçamento de geração), sempre entrega',
    'voto': 'N agentes, maioria (binário, empate por moeda), sempre entrega',
    'bon-seq': 'gera e verifica sequencialmente até o 1º aceito (máx. N); se nenhum, ABSTÉM (falha honesta)',
    'bon-fallback': 'como bon-seq, mas se nenhum for aceito entrega o voto dos N (falha mascarada)',
  },
  false_success_definition: 'entrega de resposta errada declarada como sucesso (toda entrega é declarada sucesso); abstenção não é falso sucesso',
};
const STRATS = Object.keys(PARAMS.strategies);
const NMAX = Math.max(...PARAMS.Ns);

function fsFormula(p, sens, spec, N) { const rc = p * sens, rw = (1 - p) * (1 - spec); return rw / (rc + rw) * (1 - Math.pow(1 - rc - rw, N)); }

export function run() {
  const { err1, beta, Ns, replicas: R } = PARAMS;
  const pL = 1 - err1, zL = normInv(pL);
  const zHigh = Ns.map((N) => normInv(1 - err1 * Math.pow(N, -beta)));
  const cells = [];
  for (const rho of PARAMS.rhos) for (const rv of PARAMS.rho_vs) for (const sens of PARAMS.sens) for (const spec of PARAMS.spec) {
    const rng = new Rng(hashSeed(BASE_SEED, ID, rho, rv, sens, spec));
    const sr = Math.sqrt(rho), se = Math.sqrt(1 - rho), svr = Math.sqrt(rv), sve = Math.sqrt(1 - rv), zSpec = normInv(spec);
    // contadores [estratégia][iN]
    const C = STRATS.map(() => Ns.map(() => ({ ok: 0, wrong: 0, abst: 0, gens: 0, vers: 0, ratio: PARAMS.verify_costs.map(() => new RatioAcc()) })));
    const corr = new Uint8Array(NMAX), acc = new Uint8Array(NMAX);
    const voteAt = new Int8Array(NMAX + 1);
    for (let t = 0; t < R; t++) {
      const S = rng.normal();
      let c = 0;
      for (let i = 0; i < NMAX; i++) {
        const ok = sr * S + se * rng.normal() < zL; corr[i] = ok ? 1 : 0; if (ok) c++;
        acc[i] = ok ? (rng.uniform() < sens ? 1 : 0) : (svr * S + sve * rng.normal() > zSpec ? 1 : 0);
        const n = i + 1; voteAt[n] = 2 * c > n ? 1 : (2 * c === n ? (rng.uniform() < 0.5 ? 1 : 0) : 0);
      }
      let fa = -1; for (let i = 0; i < NMAX; i++) if (acc[i]) { fa = i; break; }
      const zh = sr * S + se * rng.normal();
      for (let j = 0; j < Ns.length; j++) {
        const N = Ns[j];
        // resultado: 1 acerto, 0 erro entregue, -1 abstenção ; gens/vers
        const res = [
          [corr[0], 1, 0],
          [zh < zHigh[j] ? 1 : 0, N, 0],
          [voteAt[N], N, 0],
          fa >= 0 && fa < N ? [corr[fa], fa + 1, fa + 1] : [-1, N, N],
          fa >= 0 && fa < N ? [corr[fa], fa + 1, fa + 1] : [voteAt[N], N, N],
        ];
        for (let s = 0; s < STRATS.length; s++) {
          const [o, g, v] = res[s]; const cc = C[s][j];
          if (o === 1) cc.ok++; else if (o === 0) cc.wrong++; else cc.abst++;
          cc.gens += g; cc.vers += v;
          for (let q = 0; q < PARAMS.verify_costs.length; q++) cc.ratio[q].add(g + PARAMS.verify_costs[q] * v, o === 1 ? 1 : 0);
        }
      }
    }
    const strat = {};
    for (let s = 0; s < STRATS.length; s++) {
      strat[STRATS[s]] = {
        acc: Ns.map((_, j) => prop(C[s][j].ok, R)),
        false_success: Ns.map((_, j) => prop(C[s][j].wrong, R)),
        abstain: Ns.map((_, j) => C[s][j].abst / R),
        precision_delivered: Ns.map((_, j) => (C[s][j].ok + C[s][j].wrong ? C[s][j].ok / (C[s][j].ok + C[s][j].wrong) : null)),
        mean_generations: Ns.map((_, j) => C[s][j].gens / R),
        mean_verifications: Ns.map((_, j) => C[s][j].vers / R),
        cost_per_correct: PARAMS.verify_costs.map((cv, q) => ({ verify_cost: cv, values: Ns.map((_, j) => C[s][j].ratio[q].ci()) })),
      };
    }
    cells.push({ rho, rho_v: rv, sens, spec, strategies: strat,
      fs_formula_independent: rho === 0 && rv === 0 ? Ns.map((N) => fsFormula(pL, sens, spec, N)) : null });
  }

  // ---- testes ----
  const iN = (N) => Ns.indexOf(N);
  const get = (rho, rv, sens, spec) => cells.find((c) => c.rho === rho && c.rho_v === rv && c.sens === sens && c.spec === spec);
  // P1
  const p1f = [];
  for (const c of cells) if (c.spec >= 0.95 && c.rho_v === 0) for (const N of Ns) if (N >= 3) {
    const j = iN(N), b = c.strategies['bon-seq'].false_success[j];
    for (const other of ['voto', 'unico-alto']) { const o = c.strategies[other].false_success[j]; if (!(b.hi < o.lo)) p1f.push(`rho=${c.rho},sens=${c.sens},spec=${c.spec},N=${N} vs ${other}`); }
  }
  // P2
  let mono = true, monoFail = [], cov = 0, covN = 0;
  for (const c of cells) {
    const fs = c.strategies['bon-seq'].false_success.map((x) => x.p);
    for (let j = 1; j < fs.length; j++) if (fs[j] < fs[j - 1] - 0.01) { mono = false; monoFail.push(`rho=${c.rho},rv=${c.rho_v},sens=${c.sens},spec=${c.spec},N=${Ns[j]}`); }
    if (c.fs_formula_independent) c.fs_formula_independent.forEach((f, j) => { covN++; const o = c.strategies['bon-seq'].false_success[j]; if (f >= o.lo && f <= o.hi) cov++; });
  }
  const p2ok = mono && cov / covN >= 0.9;
  // P3
  const p3f = []; let p3n = 0;
  for (const rho of [0.3, 0.6]) for (const sens of PARAMS.sens) for (const spec of PARAMS.spec) if (spec < 0.99) for (const N of Ns) if (N >= 3) {
    p3n++; const a = get(rho, 0, sens, spec).strategies['bon-seq'].false_success[iN(N)], b = get(rho, 0.5, sens, spec).strategies['bon-seq'].false_success[iN(N)];
    if (!(b.lo > a.hi)) p3f.push(`rho=${rho},sens=${sens},spec=${spec},N=${N}`);
  }
  // P4
  const p4c = PARAMS.sens.map((sens) => { const c = get(0, 0, sens, 0.5); const j = iN(33); return { sens, bon: c.strategies['bon-seq'].false_success[j], vote: c.strategies['voto'].false_success[j] }; });
  const p4ok = p4c.every((x) => x.bon.lo > x.vote.hi);
  // P5
  const p5rows = []; let p5ok = true;
  for (const sens of PARAMS.sens) for (const spec of PARAMS.spec) if (spec >= 0.8) {
    const adv = PARAMS.rhos.map((rho) => { const c = get(rho, 0, sens, spec); const j = iN(9); return c.strategies['bon-seq'].acc[j].p - c.strategies['voto'].acc[j].p; });
    if (!(adv[0] < adv[1] && adv[1] < adv[2])) p5ok = false;
    p5rows.push({ sens, spec, adv_by_rho: adv });
  }
  const tests = [
    { id: 'P1', verdict: p1f.length === 0 ? 'suporta' : 'nao-suporta', detail: p1f.length === 0 ? 'todas as comparações com IC disjuntos' : `${p1f.length} falhas, ex.: ${p1f.slice(0, 6).join('; ')}` },
    { id: 'P2', verdict: p2ok ? 'suporta' : 'nao-suporta', detail: `monótono=${mono}${monoFail.length ? ' (falhas: ' + monoFail.slice(0, 5).join('; ') + ')' : ''}; fórmula dentro do IC em ${cov}/${covN} pontos` },
    { id: 'P3', verdict: p3f.length === 0 ? 'suporta' : (p3f.length < p3n / 2 ? 'suporta-parcialmente' : 'nao-suporta'), detail: `${p3n - p3f.length}/${p3n} comparações com aumento significativo; exceções: ${p3f.slice(0, 8).join('; ')}` },
    { id: 'P4', verdict: p4ok ? 'suporta' : 'nao-suporta', detail: p4c.map((x) => `sens=${x.sens}: FS bon-seq ${pct(x.bon.p)} vs voto ${pct(x.vote.p)}`).join('; ') },
    { id: 'P5', verdict: p5ok ? 'suporta' : 'nao-suporta', detail: p5rows.map((x) => `sens=${x.sens},spec=${x.spec}: ${x.adv_by_rho.map((a) => num(a * 100, 1)).join(' / ')} p.p.`).join('; ') },
  ];

  const c1 = get(0.3, 0, 0.95, 0.95), c2 = get(0.3, 0.5, 0.95, 0.95), j9 = iN(9), j33 = iN(33);
  const headline = [
    `rho=0,3, sens=spec=0,95, N=9: FS bon-seq ${ciPct(c1.strategies['bon-seq'].false_success[j9])} vs voto ${ciPct(c1.strategies['voto'].false_success[j9])} vs único-alto ${ciPct(c1.strategies['unico-alto'].false_success[j9])}`,
    `Mesma célula: acurácia bon-seq ${ciPct(c1.strategies['bon-seq'].acc[j9])}, abstenção ${pct(c1.strategies['bon-seq'].abstain[j9])}; bon-fallback FS ${ciPct(c1.strategies['bon-fallback'].false_success[j9])}`,
    `Verificador correlacionado (rho_v=0,5) na mesma célula: FS bon-seq sobe para ${ciPct(c2.strategies['bon-seq'].false_success[j9])}`,
    `Verificador fraco (spec=0,5, sens=0,95, rho=0, N=33): FS bon-seq ${ciPct(p4c[1].bon)} vs voto ${ciPct(p4c[1].vote)}`,
    `Custo por acerto (c_v=0,2) rho=0,3 N=9: bon-seq ${ciNum(c1.strategies['bon-seq'].cost_per_correct[0].values[j9])} vs voto ${ciNum(c1.strategies['voto'].cost_per_correct[0].values[j9])}`,
  ];
  return roundDeep({ id: ID, version: VERSION, title: 'Best-of-N com verificador imperfeito vs voto vs agente único', seed: BASE_SEED,
    hypothesis: HYPOTHESIS, params: PARAMS, results: { Ns, cells }, tests, headline }, 5);
}

mainIfDirect(import.meta.url, run);
