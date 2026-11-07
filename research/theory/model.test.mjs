// Conferência numérica das derivações de MODELO.md (th-modelo). Rodar: node --test model.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.mjs';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} |${a} − ${b}| > ${tol}`);

test('lgamma/ibeta: valores conhecidos', () => {
  close(M.lgamma(5), Math.log(24), 1e-12, 'Γ(5)=24');
  close(M.lgamma(0.5), 0.5 * Math.log(Math.PI), 1e-12, 'Γ(1/2)=√π');
  close(M.ibeta(2, 3, 0.4), 0.5248, 1e-4, 'I_0.4(2,3)'); // = 1 − Σ_{j<2} C(4,j)0.4^j0.6^{4−j} = 0.5248
  close(M.ibeta(5, 5, 0.5), 0.5, 1e-12, 'simetria');
});

test('§2 voto independente = enumeração direta e Condorcet (monotônico → 1 se p>1/2)', () => {
  for (const p of [0.55, 0.7, 0.9]) {
    let prev = 0;
    for (const N of [1, 3, 5, 7, 9, 21, 51]) {
      let brute = 0;
      for (let k = Math.floor(N / 2) + 1; k <= N; k++) brute += M.choose(N, k) * p ** k * (1 - p) ** (N - k);
      close(M.majorityAccuracy(N, p, 0), brute, 1e-10, `N=${N} p=${p}`);
      assert.ok(M.majorityAccuracy(N, p, 0) > prev);
      prev = M.majorityAccuracy(N, p, 0);
    }
  }
  assert.ok(M.majorityAccuracy(401, 0.55, 0) > 0.97);
  assert.ok(M.majorityAccuracy(101, 0.45, 0) < 0.2, 'p<1/2: maioria piora');
});

test('§2 beta-binomial: ρ→0 recupera binomial; Monte Carlo confere; correlação de pares = ρ', () => {
  close(M.majorityAccuracy(9, 0.7, 1e-7), M.majorityAccuracy(9, 0.7, 0), 1e-5);
  const R = M.rng(1), p = 0.7, rho = 0.2, N = 7, T = 200000;
  const { a, b } = M.betaParams(p, rho);
  let wins = 0, both = 0;
  for (let t = 0; t < T; t++) {
    const P = R.beta(a, b);
    let k = 0, x1 = 0, x2 = 0;
    for (let i = 0; i < N; i++) { const c = R.u() < P ? 1 : 0; k += c; if (i === 0) x1 = c; if (i === 1) x2 = c; }
    if (2 * k > N) wins++;
    both += x1 * x2;
  }
  close(wins / T, M.majorityAccuracy(N, p, rho), 0.005, 'MC beta-binomial');
  const corr = (both / T - p * p) / (p * (1 - p));
  close(corr, rho, 0.02, 'correlação intra-classe');
});

test('§2 teto: A_N → 1 − I_{1/2}(a,b) (beta) e ρp+(1−ρ) (choque comum)', () => {
  for (const [p, rho] of [[0.7, 0.1], [0.6, 0.3], [0.8, 0.05]]) {
    close(M.majorityAccuracy(2001, p, rho), M.voteCeiling(p, rho), 0.01, `teto beta p=${p} ρ=${rho}`);
    assert.ok(M.voteCeiling(p, rho) < 1);
    close(M.majorityCommonShock(2001, p, rho), M.commonShockCeiling(p, rho), 1e-6, 'teto choque comum');
  }
});

test('§2 ganho marginal fechado = diferença A_{2m+3} − A_{2m+1} (independente e beta)', () => {
  for (const rho of [0, 0.1, 0.3]) for (const p of [0.6, 0.75]) for (let m = 0; m < 12; m++) {
    const diff = M.majorityAccuracy(2 * m + 3, p, rho) - M.majorityAccuracy(2 * m + 1, p, rho);
    close(M.voteMarginalGain(m, p, rho), diff, 1e-10, `m=${m} p=${p} ρ=${rho}`);
  }
});

test('§2 N*: regra marginal míope coincide com o ótimo global (ganhos decrescentes)', () => {
  for (const p of [0.6, 0.7, 0.8, 0.9]) for (const rho of [0, 0.1, 0.3]) for (const V of [20, 100, 500]) {
    const o = M.optimalVoteN(p, rho, { V, c: 1, comm: { kappaMsg: 0.05, topology: 'star' } });
    assert.equal(o.marginalRule, o.utility.N, `p=${p} ρ=${rho} V=${V}`);
  }
  // acurácia/custo com agentes idênticos sempre prefere N=1 (A_N ≤ 1 < N·p quando p > 1/N)
  for (const p of [0.55, 0.7, 0.9]) assert.equal(M.optimalVoteN(p, 0, { V: 1000 }).ratio.N, 1);
  // limiar V/c solo→micro (iid): 2/((2p−1)p(1−p))
  close(M.voteSoloToMicroThreshold(0.7, 0, 0), 2 / (0.4 * 0.21), 1e-9);
});

test('§2.4 mistura de dificuldades pode ter máximo interior em N', () => {
  const mix = [{ w: 0.8, p: 0.8 }, { w: 0.2, p: 0.3 }];
  const a15 = M.majorityMixture(15, mix), a101 = M.majorityMixture(101, mix), a1 = M.majorityMixture(1, mix);
  assert.ok(a15 > a1 && a15 > a101);
});

test('§3 best-of-N: fechado = Monte Carlo (com correlação) e precisão invariante em N (iid)', () => {
  const p = 0.2, s = 0.85, f = 0.06, rho = 0.25, N = 6, T = 200000, R = M.rng(3);
  const { a, b } = M.betaParams(p, rho);
  let tr = 0, fa = 0, ab = 0, calls = 0;
  for (let t = 0; t < T; t++) {
    const P = R.beta(a, b);
    let done = false;
    for (let i = 0; i < N && !done; i++) {
      calls++;
      const correct = R.u() < P, accept = R.u() < (correct ? s : f);
      if (accept) { done = true; correct ? tr++ : fa++; }
    }
    if (!done) ab++;
  }
  const ex = M.bestOfN(N, p, { s, f, rho });
  close(tr / T, ex.pTrue, 0.004, 'P_true'); close(fa / T, ex.pFalse, 0.004, 'P_false');
  close(ab / T, ex.abstain, 0.004, 'abstenção'); close(calls / T, ex.expectedCalls, 0.02, 'chamadas');
  close(ex.pTrue + ex.pFalse + ex.abstain, 1, 1e-10, 'soma 1');
  for (const n of [1, 4, 32]) close(M.bestOfN(n, 0.3, { s: 0.9, f: 0.05 }).precisionAccepted, M.bestOfNCeiling(0.3, 0.9, 0.05), 1e-10, 'π iid');
  close(M.bestOfN(400, 0.1, { s: 0.9, f: 0.05 }).pTrue, M.bestOfNCeiling(0.1, 0.9, 0.05), 1e-6, 'teto');
  // verificador perfeito, iid: 1 − (1 − p s)^N
  close(M.bestOfN(10, 0.1, { s: 1, f: 0 }).pTrue, 1 - 0.9 ** 10, 1e-12);
});

test('§3 sob correlação, precisão dos aceitos < π_iid e P_false cresce com N', () => {
  const r8 = M.bestOfN(8, 0.1, { s: 0.9, f: 0.02, rho: 0.3 }), r64 = M.bestOfN(64, 0.1, { s: 0.9, f: 0.02, rho: 0.3 });
  assert.ok(r64.precisionAccepted < r8.precisionAccepted && r8.precisionAccepted < M.bestOfNCeiling(0.1, 0.9, 0.02));
  assert.ok(r64.pFalse > r8.pFalse);
});

test('§4 orçamento igual: β<1 favorece dividir; β>1 abaixo do joelho favorece concentrar', () => {
  const E = 8;
  assert.ok(M.equalBudgetCompare(E, 4, { pHi: 0.95, h: 4, beta: 0.5 }, { mode: 'bestof-perfect' }).swarmWins);
  assert.ok(!M.equalBudgetCompare(E, 4, { pHi: 0.95, h: 16, beta: 3 }, { mode: 'bestof-perfect' }).swarmWins);
  close(M.effortKnee(4, 2), 4, 1e-12);
  // overhead por chamada: N·(c0 + c1 e) = c0 + c1 E
  const e = M.equalBudgetEffort(8, 4, { c0: 0.2, c1: 1 });
  close(4 * M.callCost(e), M.callCost(8), 1e-12);
});

test('§5 USL: N_max analítico = argmax numérico; σ=κ=0 → linear', () => {
  for (const [sigma, kappa] of [[0.05, 0.01], [0.1, 0.02], [0.02, 0.001]]) {
    let best = 0, arg = 0;
    for (let N = 1; N <= 2000; N += 0.01) { const x = M.usl(N, { sigma, kappa }); if (x > best) { best = x; arg = N; } }
    close(arg, M.uslNmax({ sigma, kappa }), 0.02);
  }
  close(M.usl(17, { sigma: 0, kappa: 0 }), 17, 1e-12);
  assert.equal(M.edges(5, 'full'), 10); assert.equal(M.edges(5, 'star'), 4); assert.equal(M.edges(5, 'board'), 5);
});

test('§6 decomposição: sinal muda em χ*; χ* ≈ 2ι/(kμ)', () => {
  for (const k of [2, 3, 5]) {
    const cs = M.chiStar({ k, iota: 0.08, mu: 0.15 });
    close(cs, 2 * 0.08 / (k * 0.15), 0.03, `aprox k=${k}`);
    // com qSolo = qSplit (sem overhead: c0=0) o sinal troca exatamente em χ*
    const cap = { pLo: 0, pHi: 0.97, h: 0.5, beta: 1 }, cost = { c0: 0, c1: 1 };
    const d = M.decomposition({ k, chi: 0, iota: 0.08, mu: 0.15, cap, cost, E: 6 });
    const below = M.decomposition({ k, chi: d.chiStar - 0.01, iota: 0.08, mu: 0.15, cap, cost, E: 6 });
    const above = M.decomposition({ k, chi: d.chiStar + 0.01, iota: 0.08, mu: 0.15, cap, cost, E: 6 });
    assert.ok(below.splitWins && !above.splitWins, `k=${k}`);
  }
  // k=1: dividir não tem o que dividir (χ* = 0)
  assert.equal(M.chiStar({ k: 1, iota: 0.08, mu: 0.15 }), 0);
});

test('§7.1 SPRT: erro exato (ruína do jogador) confere com MC; sob correlação erro realizado > α nominal', () => {
  const m = M.sprtMargin(0.7, 0.05);
  assert.equal(m, 4); // ln(19)/ln(7/3) = 3.475 → 4
  const iid = M.sprtSimulate(0.7, 0, { cap: 10000, trials: 40000 });
  close(iid.realizedError, M.sprtErrorGivenP(0.7, m), 0.004);
  assert.ok(iid.realizedError <= 0.05);
  const cor = M.sprtSimulate(0.7, 0.2, { cap: 10000, trials: 40000 });
  close(cor.realizedError, M.sprtErrorBeta(0.7, 0.2, m), 0.006);
  assert.ok(cor.realizedError > 0.15, 'ρ=0.2 triplica o erro nominal');
});

test('§7.2 quórum: Q=1 → p; acurácia ↑ e tempo ↑ com Q; MC confere', () => {
  close(M.quorumRace(1, 0.65).accuracy, 0.65, 1e-12);
  let prev = M.quorumRace(1, 0.65);
  for (const Q of [2, 3, 5, 8]) { const q = M.quorumRace(Q, 0.65); assert.ok(q.accuracy > prev.accuracy && q.expectedVotes > prev.expectedVotes); prev = q; }
  const R = M.rng(9), Q = 4, T = 100000, { a, b } = M.betaParams(0.65, 0.2);
  let ok = 0, votes = 0;
  for (let t = 0; t < T; t++) { const P = R.beta(a, b); let x = 0, y = 0; while (x < Q && y < Q) { R.u() < P ? x++ : y++; votes++; } if (x === Q) ok++; }
  const ex = M.quorumRace(Q, 0.65, 0.2);
  close(ok / T, ex.accuracy, 0.005); close(votes / T, ex.expectedVotes, 0.03);
});

test('§7.3 elástico (sequencial) domina fixo (paralelo) em custo por acerto, mesma P_true', () => {
  const mix = [{ w: 0.5, p: 0.9 }, { w: 0.3, p: 0.5 }, { w: 0.2, p: 0.15 }];
  for (const Nmax of [2, 4, 8]) {
    const r = M.elasticVsFixed(mix, { Nmax });
    close(r.elastic.pTrue, r.fixed.pTrue, 1e-12);
    assert.ok(r.elastic.costPerTrueSuccess < r.fixed.costPerTrueSuccess);
  }
});

test('§7.4 reparo limitado: R* pela regra de 1 passo = argmax do valor esperado', () => {
  for (const [q1, delta, g] of [[0.6, 0.7, 0.05], [0.3, 0.9, 0.05], [0.6, 0.4, 0.15]]) {
    const V = 10, c = 1, Lreg = 10, { Rstar } = M.repairCap({ q1, delta, g, V, c, Lreg });
    const value = (R) => { let u = 0, alive = 1; for (let j = 1; j <= R; j++) { const q = q1 * delta ** (j - 1); u += alive * (V * q - c - g * Lreg); alive *= 1 - q; } return u; };
    let best = 0, arg = 0; for (let R = 0; R < 60; R++) if (value(R) > best + 1e-12) { best = value(R); arg = R; }
    assert.equal(Rstar, arg, `q1=${q1} δ=${delta}`);
  }
});

test('§8 estigmergia: peso obsoleto h/(h+λ) confere com simulação discreta; quadro O(N) vs direto O(N²)', () => {
  const R = M.rng(5), h = 0.02, lambda = 0.1, steps = 400000;
  let state = 0, trail = 0, staleMass = 0, total = 0;
  // trilha = EWMA de depósitos rotulados pela "época" do ambiente; mede a fração da trilha depositada antes da última mudança
  let fresh = 0;
  for (let t = 0; t < steps; t++) {
    if (R.u() < h) { state++; fresh = 0; }
    trail = (1 - lambda) * trail + lambda; fresh = (1 - lambda) * fresh + lambda;
    if (t > 1000) { staleMass += trail - fresh; total += trail; }
  }
  close(staleMass / total, M.staleWeight(h, lambda), 0.02); // aproximação de tempo contínuo
  assert.equal(M.messagesDirect(10), 90); assert.equal(M.messagesBoard(10), 20);
  close(M.thresholdResponse(0.5, 0.5, 2), 0.5, 1e-12);
});

test('§9 critério do joelho de esforço concorda com o vencedor real em ≥ 90% da grade', () => {
  const t = M.CURVES.transitions();
  assert.ok(t.kneeAgreement >= 0.9, `concordância ${t.kneeAgreement}`);
});

test('§10 pluralidade: K=1 recupera o binário; MC com N grande converge ao teto 1 − I_{1/(1+K)}(a,b)', () => {
  close(M.pluralityCeiling(0.7, 0.2, 1), M.voteCeiling(0.7, 0.2), 1e-12);
  for (const [p, rho, K] of [[0.35, 0.2, 4], [0.45, 0.3, 2]]) {
    close(M.pluralitySimulate(3201, p, rho, K, { trials: 3000 }), M.pluralityCeiling(p, rho, K), 0.025, `p=${p} ρ=${rho} K=${K}`);
  }
  assert.ok(M.pluralityCeiling(0.3, 0.2, 8) > M.pluralityCeiling(0.3, 0.2, 2), 'erros dispersos favorecem pluralidade');
});

test('§10 ganho do 2º agente verificado: fórmula fechada = diferença P_true(2) − P_true(1); pico p* = (1−f)/(2(s−f))', () => {
  for (const rho of [0, 0.3]) for (const p of [0.2, 0.5, 0.8]) {
    const d = M.bestOfN(2, p, { s: 0.9, f: 0.05, rho }).pTrue - M.bestOfN(1, p, { s: 0.9, f: 0.05, rho }).pTrue;
    close(M.secondAgentGain(p, 0.9, 0.05, rho), d, 1e-12, `p=${p} ρ=${rho}`);
  }
  let best = 0, arg = 0;
  for (let p = 0.001; p < 1; p += 0.001) { const g = M.secondAgentGain(p, 0.9, 0.05, 0); if (g > best) { best = g; arg = p; } }
  close(arg, M.secondAgentPeak(0.9, 0.05), 0.002);
  close(M.secondAgentPeak(1, 0), 0.5, 1e-12);
  let bv = 0, av = 0;
  for (let p = 0.5; p < 1; p += 0.0005) { const g = M.voteMarginalGain(0, p, 0); if (g > bv) { bv = g; av = p; } }
  close(av, M.votePeak(), 0.001);
});

test('§10 fração unânime-e-errada cresce com ρ e é (1−p)^N/(1−A_N) no caso independente', () => {
  close(M.unanimousWrongShare(3, 0.7, 0), 0.3 ** 3 / (1 - M.majorityAccuracy(3, 0.7, 0)), 1e-12);
  assert.ok(M.unanimousWrongShare(3, 0.7, 0.3) > M.unanimousWrongShare(3, 0.7, 0));
  assert.ok(M.unanimousWrongShare(3, 0.7, 0.7) > M.unanimousWrongShare(3, 0.7, 0.3));
});

test('§10 ajuste de cobertura recupera parâmetros sintéticos', () => {
  const p = 0.15, rho = 0.25, pts = [10, 100, 1000].map((N) => [N, 1 - M.mixedMoment(0, N, p, rho)]);
  const fit = M.fitCoverage(pts);
  close(fit.p, p, 0.01); close(fit.rho, rho, 0.02);
});
