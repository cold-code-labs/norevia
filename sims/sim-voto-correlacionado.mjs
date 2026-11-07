// sim-voto-correlacionado — 1 agente de esforço alto vs voto majoritário de N agentes de esforço baixo
// com erros correlacionados por um fator latente compartilhado (cópula gaussiana).
// Uso: node sims/sim-voto-correlacionado.mjs   (determinístico; grava results/sims/sim-voto-correlacionado.json)
import { Rng, hashSeed, BASE_SEED, normInv, normCdf, latentGrid, condP, prop, wilson, Z95, roundDeep, pct, ciPct, num, mainIfDirect } from './lib.mjs';

export const ID = 'sim-voto-correlacionado';
export const VERSION = '1.2.0';

// Hipótese registrada ANTES da primeira execução (ver results/sims/PREREGISTRO.jsonl).
export const HYPOTHESIS = {
  statement: 'Erros correlacionados impõem um teto à acurácia do voto majoritário; acima de uma correlação crítica, 1 agente de esforço alto vence qualquer N de agentes de esforço baixo em acurácia, e o custo para atingir um alvo de acurácia favorece o agente único quando o retorno ao esforço não é muito decrescente.',
  predictions: [
    { id: 'P1', text: 'Com p_L=0,6 e p_H=0,8 (k=4, beta=0,5), o teto teórico do voto é Phi(z_L/sqrt(rho)); a correlação crítica prevista é rho_c=(z_L/z_H)^2 ~= 0,091. Para todo rho >= 0,1, o agente único tem acurácia maior que o voto para TODO N em 1..64 (IC95% pareado exclui 0).' },
    { id: 'P2', text: 'Com rho=0 existe N <= 25 em que o voto supera p_H=0,8 com IC95% pareado excluindo 0.' },
    { id: 'P3', text: 'A orçamento igual (N=k agentes baixos vs 1 agente com esforço k), a região em que o voto vence encolhe quando rho cresce e quando beta (retorno ao esforço) cresce; com beta=1 o agente único vence para todo k>=3 e todo rho.' },
    { id: 'P4', text: 'Custo mínimo para atingir alvos de acurácia 0,7/0,8/0,9: com beta>=0,5 o agente único é mais barato para todo rho; com beta=0,25 o voto só é mais barato para alvos altos (>=0,9) e rho baixo (<=0,1).' },
  ],
};

export const PARAMS = {
  seed: BASE_SEED,
  err1: 0.4,                 // erro com esforço 1 (p_L = 0,6)
  effort_model: 'p(e) = 1 - err1 * e^(-beta)',
  betas: [0.25, 0.5, 1.0],
  rhos: [0, 0.025, 0.05, 0.075, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8], // v1.1: 0,025–0,075 adicionados após a 1ª execução (exploratório, refinar a fronteira)
  Nmax: 64,
  replicas_per_rho: 20000,   // tarefas simuladas por valor de rho (números aleatórios comuns entre N, k, beta)
  ref: { k: 4, beta: 0.5 },  // agente de esforço alto de referência: custo 4, p_H = 0,8
  targets: [0.7, 0.8, 0.9],
  answer_space: 'binário (pior caso para voto: todos os erros coincidem); empates decididos por moeda',
  cost_model: 'custo = soma dos esforços (agente baixo = 1; agente alto = k); sem custo de agregação',
};

// ---- v1.2.0: ANÁLISE DE SENSIBILIDADE (pedido da coordenação; não altera P1–P4) ----
// Varre a acurácia individual p e o espaço de respostas. Para K=4, quando erra, o agente escolhe a resposta-atratora
// da tarefa com prob. a (senão uniforme entre as 3 erradas). a=0,63 dá concordância ~0,6 entre dois agentes que erram,
// calibração vinda de lit-correlated-errors (relato dos autores, ~0,6 vs 1/3 ao acaso). Compara-se com o limiar de ~45%
// relatado por Kim et al. (arXiv:2512.08296v3, lit-scaling-agent-systems) — outro cenário (benchmarks agênticos, arquiteturas MAS).
export const SENSITIVITY = {
  expectation: 'Expectativa declarada antes de rodar (não é previsão formal): no voto binário o ganho do voto sobre 1 agente de mesma p some em p=0,5 por construção; com K=4 e erros atraídos o limiar cai abaixo de 0,5; a orçamento igual (vs 1 agente com esforço N) o ganho some para p bem menores ou nunca existe com rho alto.',
  ps: [0.2, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.7, 0.8, 0.9],
  rhos: [0, 0.2, 0.4, 0.55, 0.7],
  answer_spaces: [{ K: 2, attractor: 1 }, { K: 4, attractor: 0.63 }],
  Ns: [3, 5, 9], replicas: 20000, beta_equal_budget: 0.5,
  reference_threshold_kim_2025: 0.45,
};
function runSensitivity() {
  const S = SENSITIVITY; const out = [];
  for (const as of S.answer_spaces) for (const rho of S.rhos) {
    const rows = { K: as.K, attractor: as.attractor, rho, Ns: S.Ns, ps: S.ps, gain_same_p: S.Ns.map(() => []), gain_same_p_lo: S.Ns.map(() => []), gain_same_p_hi: S.Ns.map(() => []), gain_equal_budget: S.Ns.map(() => []), gain_equal_budget_lo: S.Ns.map(() => []), gain_equal_budget_hi: S.Ns.map(() => []) };
    for (const p of S.ps) {
      const rng = new Rng(hashSeed(BASE_SEED, ID, 'sens', as.K, rho, p));
      const zp = normInv(p), sr = Math.sqrt(rho), se = Math.sqrt(1 - rho);
      const zH = S.Ns.map((N) => normInv(1 - (1 - p) * Math.pow(N, -S.beta_equal_budget)));
      const acc = S.Ns.map(() => ({ s1: 0, q1: 0, s2: 0, q2: 0 }));
      const NM = Math.max(...S.Ns); const ans = new Int8Array(NM); const votes = new Int32Array(as.K);
      for (let r = 0; r < S.replicas; r++) {
        const Sx = rng.normal();
        for (let i = 0; i < NM; i++) {
          if (sr * Sx + se * rng.normal() < zp) ans[i] = 0;
          else ans[i] = as.K === 2 ? 1 : (rng.uniform() < as.attractor ? 1 : 1 + rng.int(as.K - 1));
        }
        const single = ans[0] === 0 ? 1 : 0;
        const zh = sr * Sx + se * rng.normal();
        S.Ns.forEach((N, j) => {
          votes.fill(0); for (let i = 0; i < N; i++) votes[ans[i]]++;
          let best = -1, nt = 0, win = 0; for (let k = 0; k < as.K; k++) { if (votes[k] > best) { best = votes[k]; win = k; nt = 1; } else if (votes[k] === best) { nt++; if (rng.uniform() < 1 / nt) win = k; } }
          const v = win === 0 ? 1 : 0; const d1 = v - single, d2 = v - (zh < zH[j] ? 1 : 0);
          acc[j].s1 += d1; acc[j].q1 += d1 * d1; acc[j].s2 += d2; acc[j].q2 += d2 * d2;
        });
      }
      S.Ns.forEach((N, j) => {
        const w1 = winner(acc[j].s1, acc[j].q1, S.replicas), w2 = winner(acc[j].s2, acc[j].q2, S.replicas);
        rows.gain_same_p[j].push(w1.diff); rows.gain_same_p_lo[j].push(w1.lo); rows.gain_same_p_hi[j].push(w1.hi);
        rows.gain_equal_budget[j].push(w2.diff); rows.gain_equal_budget_lo[j].push(w2.lo); rows.gain_equal_budget_hi[j].push(w2.hi);
      });
    }
    // limiar: menor p da grade a partir do qual o ganho é significativamente > 0 em todos os p maiores (null = nunca)
    const thr = (lo) => { let th = null; for (let i = S.ps.length - 1; i >= 0; i--) { if (lo[i] > 0) th = S.ps[i]; else break; } return th; };
    rows.min_p_vote_beats_same_p = S.Ns.map((_, j) => thr(rows.gain_same_p_lo[j]));
    rows.p_range_vote_beats_equal_budget = S.Ns.map((_, j) => S.ps.filter((_, i) => rows.gain_equal_budget_lo[j][i] > 0));
    out.push(rows);
  }
  return out;
}

const pOf = (e, beta) => 1 - PARAMS.err1 * Math.pow(e, -beta);

// ---- analítico: acurácia do voto integrando o fator latente ----
const LOGF = (() => { const a = new Float64Array(200); for (let i = 1; i < 200; i++) a[i] = a[i - 1] + Math.log(i); return a; })();
function voteGivenQ(N, q) {
  if (q <= 0) return 0; if (q >= 1) return 1;
  const lq = Math.log(q), l1 = Math.log(1 - q); let acc = 0;
  for (let c = 0; c <= N; c++) {
    const pm = Math.exp(LOGF[N] - LOGF[c] - LOGF[N - c] + c * lq + (N - c) * l1);
    if (2 * c > N) acc += pm; else if (2 * c === N) acc += 0.5 * pm;
  }
  return acc;
}
const GRID = latentGrid(801, 8);
export function analyticVote(N, p, rho) {
  if (rho === 0) return voteGivenQ(N, p);
  let s = 0; for (let i = 0; i < GRID.s.length; i++) s += GRID.w[i] * voteGivenQ(N, condP(p, rho, GRID.s[i]));
  return s;
}

function winner(sum, sumsq, n) { // diferença pareada (voto - único)
  const m = sum / n, v = (sumsq / n - m * m) * n / (n - 1), hw = Z95 * Math.sqrt(v / n);
  return { diff: m, lo: m - hw, hi: m + hw, winner: m - hw > 0 ? 'voto' : (m + hw < 0 ? 'unico' : 'empate') };
}

export function run() {
  const { rhos, Nmax, betas, replicas_per_rho: R, err1 } = PARAMS;
  const pL = 1 - err1, zL = normInv(pL);
  const pRef = pOf(PARAMS.ref.k, PARAMS.ref.beta), zRef = normInv(pRef);
  const ks = Array.from({ length: Nmax }, (_, i) => i + 1);
  const zHigh = betas.map((b) => ks.map((k) => normInv(pOf(k, b))));
  const out = { curves: {}, phase: {}, validation: {} };
  const accVote = [], accVoteLo = [], accVoteHi = [], accAnalytic = [], cpcVote = [], cpcVoteLo = [], cpcVoteHi = [];
  const singleRef = [], phaseAcc = [], phaseAccDiff = [], errCorr = [];
  const phaseEq = betas.map(() => []), phaseEqDiff = betas.map(() => []);
  let covered = 0, cells = 0, maxAbs = 0;

  for (const rho of rhos) {
    const rng = new Rng(hashSeed(BASE_SEED, ID, 'rho', rho));
    const sr = Math.sqrt(rho), se = Math.sqrt(1 - rho);
    const corr = new Float64Array(Nmax + 1);
    const dRefS = new Float64Array(Nmax + 1), dRefQ = new Float64Array(Nmax + 1);
    const dEqS = betas.map(() => new Float64Array(Nmax + 1)), dEqQ = betas.map(() => new Float64Array(Nmax + 1));
    let refCorrect = 0, w1 = 0, w2 = 0, w12 = 0;
    const voteOK = new Uint8Array(Nmax + 1);
    for (let t = 0; t < R; t++) {
      const S = rng.normal();
      let c = 0;
      for (let i = 1; i <= Nmax; i++) {
        const ok = sr * S + se * rng.normal() < zL;
        if (ok) c++;
        if (i === 1) { if (!ok) w1++; } else if (i === 2) { if (!ok) { w2++; if (voteOK[1] === 0) w12++; } }
        let v;
        if (2 * c > i) v = 1; else if (2 * c === i) v = rng.uniform() < 0.5 ? 1 : 0; else v = 0;
        voteOK[i] = v; corr[i] += v;
      }
      const zh = sr * S + se * rng.normal(); // latente do agente de esforço alto (mesma tarefa)
      const refOK = zh < zRef ? 1 : 0; refCorrect += refOK;
      for (let N = 1; N <= Nmax; N++) { const d = voteOK[N] - refOK; dRefS[N] += d; dRefQ[N] += d * d; }
      for (let b = 0; b < betas.length; b++) for (let k = 1; k <= Nmax; k++) {
        const d = voteOK[k] - (zh < zHigh[b][k - 1] ? 1 : 0); dEqS[b][k] += d; dEqQ[b][k] += d * d;
      }
    }
    const a = [], alo = [], ahi = [], an = [], cp = [], cplo = [], cphi = [], ph = [], phd = [];
    for (let N = 1; N <= Nmax; N++) {
      const pr = prop(corr[N], R); const th = analyticVote(N, pL, rho);
      a.push(pr.p); alo.push(pr.lo); ahi.push(pr.hi); an.push(th);
      cp.push(N / pr.p); cplo.push(N / pr.hi); cphi.push(N / pr.lo);
      cells++; if (th >= pr.lo && th <= pr.hi) covered++; maxAbs = Math.max(maxAbs, Math.abs(th - pr.p));
      const w = winner(dRefS[N], dRefQ[N], R); ph.push(w.winner); phd.push(w.diff);
    }
    accVote.push(a); accVoteLo.push(alo); accVoteHi.push(ahi); accAnalytic.push(an);
    cpcVote.push(cp); cpcVoteLo.push(cplo); cpcVoteHi.push(cphi); phaseAcc.push(ph); phaseAccDiff.push(phd);
    const sp = prop(refCorrect, R);
    singleRef.push({ rho, acc: sp.p, lo: sp.lo, hi: sp.hi, cost_per_correct: PARAMS.ref.k / sp.p, cpc_lo: PARAMS.ref.k / sp.hi, cpc_hi: PARAMS.ref.k / sp.lo });
    // correlação phi entre erros de dois agentes baixos (mapeia rho latente -> correlação de erros observável)
    const pw1 = w1 / R, pw2 = w2 / R, pw12 = w12 / R;
    errCorr.push((pw12 - pw1 * pw2) / Math.sqrt(pw1 * (1 - pw1) * pw2 * (1 - pw2)));
    for (let b = 0; b < betas.length; b++) {
      const row = [], rowd = [];
      for (let k = 1; k <= Nmax; k++) { const w = winner(dEqS[b][k], dEqQ[b][k], R); row.push(w.winner); rowd.push(w.diff); }
      phaseEq[b].push(row); phaseEqDiff[b].push(rowd);
    }
  }

  // ---- custo mínimo para atingir alvos (analítico, esforço contínuo para o agente único) ----
  const targetCost = [];
  for (const A of PARAMS.targets) for (const beta of betas) {
    const eStar = Math.pow(err1 / (1 - A), 1 / beta);
    const row = { target: A, beta, single_cost: eStar, vote_min_N: [], cheaper: [] };
    for (const rho of rhos) {
      let nStar = null; for (let N = 1; N <= Nmax; N++) if (analyticVote(N, pL, rho) >= A) { nStar = N; break; }
      row.vote_min_N.push(nStar);
      row.cheaper.push(nStar === null ? 'unico' : (nStar < eStar ? 'voto' : (nStar > eStar ? 'unico' : 'empate')));
    }
    targetCost.push(row);
  }

  const zH = normInv(pRef);
  const rhoC = (zL / zH) ** 2;
  const ceiling = PARAMS.rhos.map((rho) => (rho === 0 ? 1 : normCdf(zL / Math.sqrt(rho))));

  out.curves = { N: ks, rhos: PARAMS.rhos, acc_vote: accVote, acc_vote_lo: accVoteLo, acc_vote_hi: accVoteHi, acc_vote_analytic: accAnalytic,
    cost_per_correct_vote: cpcVote, cost_per_correct_vote_lo: cpcVoteLo, cost_per_correct_vote_hi: cpcVoteHi,
    single_ref: singleRef, vote_ceiling_analytic: ceiling, error_phi_correlation: errCorr };
  out.phase = { accuracy_vs_ref: { rows: 'rho', cols: 'N', winner: phaseAcc, diff_vote_minus_single: phaseAccDiff },
    equal_budget: betas.map((b, i) => ({ beta: b, rows: 'rho', cols: 'k=N', p_single: ks.map((k) => pOf(k, b)), winner: phaseEq[i], diff_vote_minus_single: phaseEqDiff[i] })),
    target_cost: targetCost };
  out.validation = { analytic_inside_mc_ci_fraction: covered / cells, cells, max_abs_diff_mc_vs_analytic: maxAbs, rho_critical_analytic: rhoC };

  // ---- avaliação das previsões ----
  const iR = (rho) => PARAMS.rhos.indexOf(rho);
  const p1ok = PARAMS.rhos.filter((x) => x >= 0.1).every((rho) => phaseAcc[iR(rho)].every((w) => w === 'unico'));
  const p1fail = PARAMS.rhos.filter((x) => x >= 0.1).flatMap((rho) => phaseAcc[iR(rho)].map((w, j) => (w !== 'unico' ? `rho=${rho},N=${j + 1}:${w}` : null)).filter(Boolean));
  const firstWin0 = phaseAcc[0].findIndex((w) => w === 'voto') + 1;
  const p2ok = firstWin0 > 0 && firstWin0 <= 25;
  // P3: contagem de células com vitória do voto por beta e por rho
  const eqVoteCells = betas.map((b, i) => PARAMS.rhos.map((rho, j) => phaseEq[i][j].filter((w) => w === 'voto').length));
  const monoRho = eqVoteCells.every((arr) => arr.every((v, j) => j === 0 || v <= arr[j - 1]));
  const monoBeta = PARAMS.rhos.every((_, j) => eqVoteCells.every((arr, i) => i === 0 || arr[j] <= eqVoteCells[i - 1][j]));
  const b1 = betas.indexOf(1.0);
  const beta1All = phaseEq[b1].every((row) => row.slice(2).every((w) => w === 'unico'));
  const p3ok = monoRho && monoBeta && beta1All;
  // P4
  const p4rows = targetCost.filter((t) => t.beta >= 0.5);
  const p4a = p4rows.every((t) => t.cheaper.every((c) => c === 'unico'));
  const b025 = targetCost.filter((t) => t.beta === 0.25);
  const p4b = b025.every((t) => t.cheaper.every((c, j) => c !== 'voto' || (t.target >= 0.9 && PARAMS.rhos[j] <= 0.1)));
  const p4ok = p4a && p4b;

  const tests = [
    { id: 'P1', verdict: p1ok ? 'suporta' : 'nao-suporta', detail: p1ok ? `rho_c analítico = ${num(rhoC, 3)}; para todo rho>=0,1 e N=1..64 o único vence com IC95% pareado` : `exceções: ${p1fail.slice(0, 12).join('; ')}${p1fail.length > 12 ? ' …' : ''}` },
    { id: 'P2', verdict: p2ok ? 'suporta' : 'nao-suporta', detail: `com rho=0 o voto supera p_H=0,8 (IC pareado) a partir de N=${firstWin0 || 'nunca'}` },
    { id: 'P3', verdict: p3ok ? 'suporta' : 'nao-suporta', detail: `nº de k (1..64) com vitória do voto por beta (linhas) e rho (colunas): ${JSON.stringify(eqVoteCells)}; monótono em rho=${monoRho}, em beta=${monoBeta}; beta=1 único vence k>=3 em todo rho=${beta1All}` },
    { id: 'P4', verdict: p4ok ? 'suporta' : 'nao-suporta', detail: `beta>=0,5 único sempre mais barato=${p4a}; beta=0,25 voto mais barato só em alvo>=0,9 e rho<=0,1=${p4b}` },
  ];

  const j0 = 0, j3 = iR(0.3), j6 = iR(0.6);
  const n64 = (j) => ({ p: accVote[j][63], lo: accVoteLo[j][63], hi: accVoteHi[j][63] });
  const headline = [
    `Teto teórico do voto (N→∞) com p_L=0,6: ${pct(ceiling[j3])} em rho=0,3 e ${pct(ceiling[j6])} em rho=0,6; rho crítico vs p_H=0,8: ${num(rhoC, 3)}`,
    `Voto N=64: ${ciPct(n64(j0))} (rho=0); ${ciPct(n64(j3))} (rho=0,3); ${ciPct(n64(j6))} (rho=0,6)`,
    `Agente único (k=4, p=0,8) em rho=0,3: ${ciPct({ p: singleRef[j3].acc, lo: singleRef[j3].lo, hi: singleRef[j3].hi })}`,
    `Com rho=0 o voto supera o agente único (k=4) a partir de N=${firstWin0}`,
    `Validação MC×analítico: ${pct(covered / cells)} das ${cells} células com valor analítico dentro do IC95%; erro máx. ${num(maxAbs * 100, 2)} p.p.`,
  ];

  out.sensitivity = { design: SENSITIVITY, cells: runSensitivity() };
  const sc = (K, rho) => out.sensitivity.cells.find((c) => c.K === K && c.rho === rho);
  const fmtP = (x) => (x === null ? 'nunca' : num(x, 2));
  headline.push(`Sensibilidade (K=4, concordância de erros ~0,6): voto N=5 supera 1 agente de mesma p a partir de p=${fmtP(sc(4, 0).min_p_vote_beats_same_p[1])} (rho=0), ${fmtP(sc(4, 0.4).min_p_vote_beats_same_p[1])} (rho=0,4), ${fmtP(sc(4, 0.7).min_p_vote_beats_same_p[1])} (rho=0,7)`);
  headline.push(`Sensibilidade a orçamento igual (N=5 vs 1 agente com esforço 5, beta=0,5): faixas de p em que o voto vence — K=2 rho=0: [${sc(2, 0).p_range_vote_beats_equal_budget[1].map((x) => num(x, 2)).join(' ')}]; K=4 rho=0: [${sc(4, 0).p_range_vote_beats_equal_budget[1].map((x) => num(x, 2)).join(' ')}]; K=4 rho=0,4: [${sc(4, 0.4).p_range_vote_beats_equal_budget[1].map((x) => num(x, 2)).join(' ')}]`);
  return roundDeep({ id: ID, version: VERSION, title: 'Voto correlacionado: 1 agente de esforço alto vs N agentes de esforço baixo', seed: BASE_SEED,
    hypothesis: HYPOTHESIS, params: PARAMS, results: out, tests, headline }, 5);
}

mainIfDirect(import.meta.url, run);
