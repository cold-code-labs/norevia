// sim-quorum — decisão coletiva por quórum (inspirada na escolha de ninho por abelhas/formigas):
// limiar de quórum vs tempo e acurácia (trade-off velocidade–acurácia), com e sem viés de avaliação compartilhado.
// Uso: node sims/sim-quorum.mjs
import { Rng, hashSeed, BASE_SEED, Acc, prop, normCdf, roundDeep, pct, num, ciPct, ciNum, mainIfDirect } from './lib.mjs';

export const ID = 'sim-quorum';
export const VERSION = '1.2.0';

export const HYPOTHESIS = {
  statement: 'Exigir um quórum maior antes de decidir troca velocidade por acurácia com retornos decrescentes; quando a avaliação dos agentes compartilha um viés (erro correlacionado), aumentar o quórum não corrige o erro e a acurácia satura abaixo do caso independente.',
  predictions: [
    { id: 'P1', text: 'Em todas as células, a acurácia é não decrescente em Q (tolerância 1 p.p.) e o tempo médio até a decisão é estritamente crescente em Q.' },
    { id: 'P2', text: 'Retornos decrescentes: nas células em que o ganho de acurácia de Q=1 para Q=50 é > 5 p.p., pelo menos 50% desse ganho já é obtido com Q <= 10.' },
    { id: 'P3', text: 'Com viés compartilhado (rho=0,5), a acurácia em Q=50 é menor que com rho=0 (mesmos sigma, Delta; IC95% disjuntos) e o ganho de Q=20 para Q=50 é < 2 p.p. (platô).' },
    { id: 'P4', text: 'Discriminação mais difícil (Delta=0,1) tem acurácia menor que Delta=0,25 em todo Q, para cada (sigma, rho).' },
  ],
};

export const PARAMS = {
  seed: BASE_SEED,
  scouts: 100,
  qualities_template: '[1, 1-Delta, 0.5] (sítio 0 é o melhor)',
  discovery_weights: [1, 3, 3], // o melhor sítio é mais difícil de achar ("mais distante")
  accept_threshold: 0.5,     // compromete-se se qualidade percebida > 0,5
  // P(recrutado para j) = recruit_rate * D_j / S, D_j = soma da intensidade de dança dos comprometidos com j
  // P(abandonar) = abandon_base + abandon_slope * max(0, 1 - q_percebida)
  regimes: {
    // v1.0.0 (pré-registrado): recrutamento forte e pouco dependente da qualidade -> travamento no 1º sítio descoberto
    'recrutamento-forte': { discovery_total: 0.01, recruit_rate: 0.5, dance: 'q_hat', abandon_base: 0.01, abandon_slope: 0.1, status: 'v1.0.0 pré-registrado; dinâmica degenerada (ver cartão)' },
    // v1.1.0 (emenda pós-hoc, escolhida por princípio, sem busca de parâmetros): só se "dança" por sítio percebido acima de 0,6,
    // intensidade proporcional ao excesso; recrutamento mais lento; descoberta independente maior; mais rotatividade.
    'recrutamento-por-qualidade': { discovery_total: 0.02, recruit_rate: 0.15, dance: 'max(0, q_hat - 0.6) / 0.4', abandon_base: 0.02, abandon_slope: 0.2, status: 'v1.1.0 emenda pós-hoc; regime principal dos testes' },
  },
  main_regime: 'recrutamento-por-qualidade',
  sigmas: [0.1, 0.3], rhos: [0, 0.5], deltas: [0.1, 0.25],
  Qs: [1, 2, 3, 5, 8, 10, 12, 16, 20, 25, 30, 40, 50],
  T_max: 3000, runs: 2000,
  perception: 'q_hat = q_j + sigma*(sqrt(rho)*B_j + sqrt(1-rho)*e_i), B_j ~ N(0,1) por sítio e por execução (viés compartilhado)',
  quorum_note: 'decisão = primeiro sítio cujo nº de comprometidos atinge Q; a dinâmica não muda com Q (quórum observado), logo todos os Q usam a mesma execução',
};

function simulate(quals, sigma, rho, rng, R) {
  const { scouts: S, discovery_weights: w, accept_threshold, Qs, T_max } = PARAMS;
  const { discovery_total, recruit_rate } = R;
  const danceOf = R.dance === 'q_hat' ? (q) => q : (q) => Math.max(0, q - 0.6) / 0.4;
  const dn = new Float64Array(S);
  const K = quals.length; const wsum = w.reduce((a, b) => a + b, 0);
  const B = quals.map(() => rng.normal());
  const state = new Int8Array(S).fill(-1), qh = new Float64Array(S);
  const count = new Int32Array(K), D = new Float64Array(K);
  const dec = Qs.map(() => null); let remaining = Qs.length;
  const sr = Math.sqrt(rho), se = Math.sqrt(1 - rho);
  for (let t = 1; t <= T_max && remaining > 0; t++) {
    const Dsnap = Float64Array.from(D);
    for (let i = 0; i < S; i++) {
      const s = state[i];
      if (s >= 0) {
        if (rng.uniform() < R.abandon_base + R.abandon_slope * Math.max(0, 1 - qh[i])) { state[i] = -1; count[s]--; D[s] -= dn[i]; }
        continue;
      }
      let site = -1; const u = rng.uniform();
      let acc = 0; for (let j = 0; j < K; j++) { acc += recruit_rate * Math.max(0, Dsnap[j]) / S; if (u < acc) { site = j; break; } }
      if (site < 0) { const u2 = rng.uniform(); if (u2 < discovery_total) { let c = 0; const x = u2 / discovery_total * wsum; for (let j = 0; j < K; j++) { c += w[j]; if (x < c) { site = j; break; } } } }
      if (site < 0) continue;
      const q = quals[site] + sigma * (sr * B[site] + se * rng.normal());
      if (q > accept_threshold) { state[i] = site; qh[i] = q; dn[i] = danceOf(q); count[site]++; D[site] += dn[i]; }
    }
    // v1.2.0: desempate sem viés — entre sítios que atingem Q no mesmo passo, vence o de maior contagem; empate exato por sorteio
    for (let k = 0; k < Qs.length; k++) if (dec[k] === null) {
      let best = -1, bc = -1, nt = 0;
      for (let j = 0; j < K; j++) if (count[j] >= Qs[k]) { if (count[j] > bc) { bc = count[j]; best = j; nt = 1; } else if (count[j] === bc) { nt++; if (rng.uniform() < 1 / nt) best = j; } }
      if (best >= 0) { dec[k] = { site: best, t }; remaining--; }
    }
  }
  return dec;
}

function runRegime(regName) {
  const { Qs, runs } = PARAMS; const R = PARAMS.regimes[regName];
  const cells = [];
  for (const sigma of PARAMS.sigmas) for (const rho of PARAMS.rhos) for (const delta of PARAMS.deltas) {
    const quals = [1, 1 - delta, 0.5];
    const rng = new Rng(regName === 'recrutamento-forte' ? hashSeed(BASE_SEED, ID, sigma, rho, delta) : hashSeed(BASE_SEED, ID, regName, sigma, rho, delta));
    const correct = Qs.map(() => 0), decided = Qs.map(() => 0), time = Qs.map(() => new Acc());
    for (let r = 0; r < runs; r++) {
      const dec = simulate(quals, sigma, rho, rng, R);
      dec.forEach((d, k) => { if (d) { decided[k]++; time[k].add(d.t); if (d.site === 0) correct[k]++; } });
    }
    // teto aproximado (Q -> infinito, só os dois melhores sítios, viés compartilhado decide): Phi(Delta / (sigma*sqrt(2*rho)))
    const ceiling = rho > 0 ? normCdf(delta / (sigma * Math.sqrt(2 * rho))) : 1;
    cells.push({ sigma, rho, delta, qualities: quals,
      accuracy: Qs.map((_, k) => prop(correct[k], runs)), no_decision: Qs.map((_, k) => 1 - decided[k] / runs),
      time_to_decision: Qs.map((_, k) => time[k].ci()), approx_ceiling_shared_bias: ceiling });
  }
  return cells;
}

function evaluate(cells) {
  const { Qs } = PARAMS;
  const iQ = (Q) => Qs.indexOf(Q);
  const get = (sigma, rho, delta) => cells.find((c) => c.sigma === sigma && c.rho === rho && c.delta === delta);
  // P1
  const p1f = [];
  for (const c of cells) for (let k = 1; k < Qs.length; k++) {
    if (c.accuracy[k].p < c.accuracy[k - 1].p - 0.01) p1f.push(`acc σ=${c.sigma},ρ=${c.rho},Δ=${c.delta},Q=${Qs[k]}`);
    if (!(c.time_to_decision[k].mean > c.time_to_decision[k - 1].mean)) p1f.push(`tempo σ=${c.sigma},ρ=${c.rho},Δ=${c.delta},Q=${Qs[k]}`);
  }
  // P2
  const p2rows = cells.map((c) => { const g = c.accuracy[iQ(50)].p - c.accuracy[0].p; const g10 = c.accuracy[iQ(10)].p - c.accuracy[0].p; return { cell: `σ=${c.sigma},ρ=${c.rho},Δ=${c.delta}`, gain: g, frac10: g > 0 ? g10 / g : null }; });
  const p2rel = p2rows.filter((x) => x.gain > 0.05);
  const p2 = p2rel.length > 0 && p2rel.every((x) => x.frac10 >= 0.5);
  // P3
  const p3rows = []; let p3 = true;
  for (const sigma of PARAMS.sigmas) for (const delta of PARAMS.deltas) {
    const a = get(sigma, 0, delta), b = get(sigma, 0.5, delta);
    const lower = b.accuracy[iQ(50)].hi < a.accuracy[iQ(50)].lo; const plateau = b.accuracy[iQ(50)].p - b.accuracy[iQ(20)].p < 0.02;
    if (!(lower && plateau)) p3 = false;
    p3rows.push(`σ=${sigma},Δ=${delta}: Q=50 ρ=0 ${pct(a.accuracy[iQ(50)].p)} vs ρ=0,5 ${pct(b.accuracy[iQ(50)].p)}; ganho Q20→50 (ρ=0,5) ${num(100 * (b.accuracy[iQ(50)].p - b.accuracy[iQ(20)].p), 1)} p.p.`);
  }
  // P4
  let p4 = true; const p4f = [];
  for (const sigma of PARAMS.sigmas) for (const rho of PARAMS.rhos) { const h = get(sigma, rho, 0.1), e = get(sigma, rho, 0.25); Qs.forEach((Q, k) => { if (!(h.accuracy[k].p < e.accuracy[k].p)) { p4 = false; p4f.push(`σ=${sigma},ρ=${rho},Q=${Q}`); } }); }
  const tests = [
    { id: 'P1', verdict: p1f.length === 0 ? 'suporta' : 'nao-suporta', detail: p1f.length ? `${p1f.length} violações: ${p1f.slice(0, 8).join('; ')}` : 'monotonicidade em todas as 8 células' },
    { id: 'P2', verdict: p2 ? 'suporta' : 'nao-suporta', detail: p2rows.map((x) => `${x.cell}: ganho ${num(100 * x.gain, 1)} p.p., fração até Q=10 ${x.frac10 === null ? '—' : pct(x.frac10, 0)}`).join('; ') },
    { id: 'P3', verdict: p3 ? 'suporta' : 'nao-suporta', detail: p3rows.join('; ') },
    { id: 'P4', verdict: p4 ? 'suporta' : 'nao-suporta', detail: p4 ? 'Δ=0,1 abaixo de Δ=0,25 em todo Q e célula' : `exceções: ${p4f.join('; ')}` },
  ];
  return { tests, get, iQ };
}

export function run() {
  const { Qs } = PARAMS;
  const byRegime = {}, testsByRegime = {};
  for (const reg of Object.keys(PARAMS.regimes)) { byRegime[reg] = runRegime(reg); testsByRegime[reg] = evaluate(byRegime[reg]).tests; }
  const { tests, get, iQ } = evaluate(byRegime[PARAMS.main_regime]);
  const getF = evaluate(byRegime['recrutamento-forte']).get;
  const c0 = get(0.3, 0, 0.1), c1 = get(0.3, 0.5, 0.1), cE = get(0.3, 0, 0.25), cF = getF(0.3, 0, 0.25);
  const line = (c, Q) => `σ=${num(c.sigma, 1)}, ρ=${num(c.rho, 1)}, Δ=${num(c.delta, 2)}, Q=${Q}: acurácia ${ciPct(c.accuracy[iQ(Q)])}, tempo ${ciNum(c.time_to_decision[iQ(Q)], 0)} passos`;
  const headline = [line(c0, 1), line(c0, 10), line(c0, 50), line(c1, 10), line(c1, 50), line(cE, 1), line(cE, 50),
    `Teto aproximado com viés compartilhado (σ=0,3, ρ=0,5, Δ=0,1): ${pct(c1.approx_ceiling_shared_bias)}`,
    `Regime recrutamento-forte (v1.0.0), σ=0,3, ρ=0, Δ=0,25: Q=1 ${ciPct(cF.accuracy[0])}; Q=50 ${ciPct(cF.accuracy[iQ(50)])} em ${ciNum(cF.time_to_decision[iQ(50)], 0)} passos`];
  return roundDeep({ id: ID, version: VERSION, title: 'Quórum: velocidade vs acurácia em decisão coletiva', seed: BASE_SEED,
    hypothesis: HYPOTHESIS, params: PARAMS, results: { Qs, main_regime: PARAMS.main_regime, regimes: byRegime, tests_by_regime: testsByRegime }, tests, headline }, 5);
}

mainIfDirect(import.meta.url, run);
