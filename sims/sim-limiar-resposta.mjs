// sim-limiar-resposta — alocação de tarefas sob demanda flutuante:
// limiares de resposta (inspirado em Bonabeau, Theraulaz & Deneubourg 1996) vs papéis fixos vs despachante central
// com custo de comunicação e atraso de observação.
// Uso: node sims/sim-limiar-resposta.mjs
import { Rng, hashSeed, BASE_SEED, Acc, roundDeep, num, ciNum, mainIfDirect } from './lib.mjs';

export const ID = 'sim-limiar-resposta';
export const VERSION = '1.0.0';

export const HYPOTHESIS = {
  statement: 'Limiares de resposta heterogêneos, lendo apenas o estímulo local (backlog), alocam agentes de forma adaptativa sem mensagens: melhor latência que papéis fixos dimensionados pela média, menos agentes ativos que papéis fixos dimensionados pelo pico, e custo total menor que um despachante central quando mensagens têm custo ou quando a informação do despachante chega atrasada.',
  predictions: [
    { id: 'P1', text: 'Limiar (theta~U[5,50], n=2, p_saida=0,1) tem latência média menor que fixo-media (3+3 agentes), diferença pareada com IC95% excluindo 0, usando zero mensagens.' },
    { id: 'P2', text: 'Limiar usa menos agentes ativos em média que fixo-pico (8+8) e tem latência média <= 2x a do fixo-pico.' },
    { id: 'P3', text: 'Despachante com atraso L=0 domina o limiar em (agentes ativos, latência) quando mensagens são gratuitas: menos ativos E latência <= limiar.' },
    { id: 'P4', text: 'Latência média e pico de backlog do despachante crescem com o atraso L (0<2<5<10); para L>=5 o pico de backlog do despachante excede o do limiar.' },
    { id: 'P5', text: 'Com custo de 0,2 por mensagem (relativo a 1 agente-passo), o custo total por passo do limiar é menor que o de qualquer despachante (L=0..10).' },
  ],
};

export const PARAMS = {
  seed: BASE_SEED,
  M: 40, types: 2, T: 1000, runs: 1000,
  base_rate: 1.0,                  // chegadas Poisson por tipo por passo
  spikes: [{ start: 200, type: 0 }, { start: 450, type: 1 }, { start: 700, type: 0 }],
  spike_duration: 50, spike_multiplier: 4,
  mu: 0.5,                         // prob. de um agente ativo concluir 1 tarefa do seu tipo por passo (se houver fila)
  recovery_level: 5,               // backlog total considerado "recuperado" após o pico
  recovery_cap: 250,
  msg_costs: [0, 0.05, 0.2],       // custo por mensagem em agente-passos
  strategies: {
    'limiar-5-50': { kind: 'threshold', thMin: 5, thMax: 50, n: 2, pQuit: 0.1, desc: 'Bonabeau 1996: theta_ij~U[5,50], P(engajar)=s^2/(s^2+theta^2), sair com prob. 0,1/passo; s = backlog do tipo' },
    'limiar-2-20': { kind: 'threshold', thMin: 2, thMax: 20, n: 2, pQuit: 0.1, desc: 'limiares mais baixos (mais sensível)' },
    'limiar-10-100': { kind: 'threshold', thMin: 10, thMax: 100, n: 2, pQuit: 0.1, desc: 'limiares mais altos (menos sensível)' },
    'limiar-homog-20': { kind: 'threshold', thMin: 20, thMax: 20, n: 2, pQuit: 0.1, desc: 'limiar homogêneo theta=20' },
    'limiar-saida-ociosa': { kind: 'threshold', thMin: 5, thMax: 50, n: 2, pQuit: 0.02, pIdleQuit: 0.3, desc: 'variante de engenharia: sai com 0,02/passo, ou 0,3 se a fila do seu tipo está vazia' },
    'fixo-media': { kind: 'fixed', perType: 3, desc: '3+3 agentes sempre ativos (dimensionado ~1,5x a demanda base)' },
    'fixo-pico': { kind: 'fixed', perType: 8, desc: '8+8 agentes sempre ativos (dimensionado para o pico)' },
    'despachante-L0': { kind: 'dispatcher', lag: 0, H: 5, ewma: 0.2, desc: 'central: alvo_j=ceil((lambda_hat_j + fila_j/H)/mu); 1 msg de status por ativo/passo + 1 msg por comando' },
    'despachante-L2': { kind: 'dispatcher', lag: 2, H: 5, ewma: 0.2 },
    'despachante-L5': { kind: 'dispatcher', lag: 5, H: 5, ewma: 0.2 },
    'despachante-L10': { kind: 'dispatcher', lag: 10, H: 5, ewma: 0.2 },
  },
};
const SN = Object.keys(PARAMS.strategies);

function rateAt(t, j) {
  for (const s of PARAMS.spikes) if (s.type === j && t >= s.start && t < s.start + PARAMS.spike_duration) return PARAMS.base_rate * PARAMS.spike_multiplier;
  return PARAMS.base_rate;
}

function simulate(cfg, arrivals, rng) {
  const { M, T, mu, types } = PARAMS;
  const CAP = 1 << 14;
  const q = [new Int32Array(CAP), new Int32Array(CAP)], head = [0, 0], tail = [0, 0];
  const active = new Int8Array(M).fill(-1);
  const theta = [new Float64Array(M), new Float64Array(M)];
  if (cfg.kind === 'threshold') for (let j = 0; j < types; j++) for (let i = 0; i < M; i++) theta[j][i] = cfg.thMin + (cfg.thMax - cfg.thMin) * rng.uniform();
  if (cfg.kind === 'fixed') { let i = 0; for (let j = 0; j < types; j++) for (let k = 0; k < cfg.perType; k++) active[i++] = j; }
  const qHist = [new Int32Array(T), new Int32Array(T)], aHist = [new Float64Array(T), new Float64Array(T)];
  const lamHat = [PARAMS.base_rate, PARAMS.base_rate];
  let activeSum = 0, backlogSum = 0, msgs = 0, done = 0;
  const lat = [];
  const backlogTrace = new Int32Array(T);
  for (let t = 0; t < T; t++) {
    for (let j = 0; j < types; j++) { const n = arrivals[j][t]; for (let k = 0; k < n; k++) q[j][(tail[j]++) & (CAP - 1)] = t; }
    const ql = [tail[0] - head[0], tail[1] - head[1]];
    // ---- decisão de alocação ----
    if (cfg.kind === 'threshold') {
      for (let i = 0; i < M; i++) {
        const a = active[i];
        if (a >= 0) {
          const pq = cfg.pIdleQuit !== undefined && ql[a] === 0 ? cfg.pIdleQuit : cfg.pQuit;
          if (rng.uniform() < pq) active[i] = -1;
        } else {
          const first = rng.uniform() < 0.5 ? 0 : 1;
          for (let k = 0; k < types; k++) {
            const j = (first + k) % types, s = ql[j];
            if (s <= 0) continue;
            const sn = s * s, th = theta[j][i];
            if (rng.uniform() < sn / (sn + th * th)) { active[i] = j; break; }
          }
        }
      }
    } else if (cfg.kind === 'dispatcher') {
      for (let j = 0; j < types; j++) { qHist[j][t] = ql[j]; aHist[j][t] = arrivals[j][t]; }
      const to = t - cfg.lag;
      const target = [0, 0];
      for (let j = 0; j < types; j++) {
        if (to >= 0) lamHat[j] = (1 - cfg.ewma) * lamHat[j] + cfg.ewma * aHist[j][to];
        const qo = to >= 0 ? qHist[j][to] : 0;
        target[j] = Math.min(M, Math.max(1, Math.ceil((lamHat[j] + qo / cfg.H) / mu)));
      }
      if (target[0] + target[1] > M) { const f = M / (target[0] + target[1]); target[0] = Math.floor(target[0] * f); target[1] = M - target[0]; }
      const cnt = [0, 0]; for (let i = 0; i < M; i++) if (active[i] >= 0) cnt[active[i]]++;
      for (let j = 0; j < types; j++) while (cnt[j] > target[j]) { for (let i = M - 1; i >= 0; i--) if (active[i] === j) { active[i] = -1; break; } cnt[j]--; msgs++; }
      for (let j = 0; j < types; j++) while (cnt[j] < target[j]) { for (let i = 0; i < M; i++) if (active[i] === -1) { active[i] = j; break; } cnt[j]++; msgs++; }
    }
    // ---- serviço ----
    let nAct = 0;
    for (let i = 0; i < M; i++) {
      const j = active[i]; if (j < 0) continue; nAct++;
      if (tail[j] > head[j] && rng.uniform() < mu) { const at = q[j][(head[j]++) & (CAP - 1)]; lat.push(t - at + 1); done++; }
    }
    if (cfg.kind === 'dispatcher') msgs += nAct; // relatório de status de cada agente ativo
    activeSum += nAct;
    const bl = (tail[0] - head[0]) + (tail[1] - head[1]);
    backlogSum += bl; backlogTrace[t] = bl;
  }
  // métricas de pico/recuperação
  let peakSum = 0, recSum = 0;
  for (const s of PARAMS.spikes) {
    const end = s.start + PARAMS.spike_duration;
    let peak = 0; for (let t = s.start; t < Math.min(T, end + 50); t++) peak = Math.max(peak, backlogTrace[t]);
    let rec = PARAMS.recovery_cap; for (let t = end; t < Math.min(T, end + PARAMS.recovery_cap); t++) if (backlogTrace[t] <= PARAMS.recovery_level) { rec = t - end; break; }
    peakSum += peak; recSum += rec;
  }
  lat.sort((a, b) => a - b);
  const meanLat = lat.reduce((a, b) => a + b, 0) / Math.max(1, lat.length);
  const p95 = lat.length ? lat[Math.min(lat.length - 1, Math.floor(0.95 * lat.length))] : 0;
  return { meanActive: activeSum / T, meanBacklog: backlogSum / T, meanLat, p95, peak: peakSum / PARAMS.spikes.length,
    recovery: recSum / PARAMS.spikes.length, msgsPerStep: msgs / T, unfinished: (tail[0] - head[0]) + (tail[1] - head[1]), trace: backlogTrace };
}

export function run() {
  const { runs, T, types } = PARAMS;
  const metrics = ['meanActive', 'meanBacklog', 'meanLat', 'p95', 'peak', 'recovery', 'msgsPerStep', 'unfinished'];
  const A = {}; for (const s of SN) { A[s] = {}; for (const m of metrics) A[s][m] = new Acc(); A[s].cost = PARAMS.msg_costs.map(() => new Acc()); }
  const traceSum = {}; for (const s of SN) traceSum[s] = new Float64Array(T);
  // diferenças pareadas
  const pairs = { 'lat:limiar-5-50 - fixo-media': new Acc(), 'active:limiar-5-50 - fixo-pico': new Acc(), 'active:despachante-L0 - limiar-5-50': new Acc(), 'lat:despachante-L0 - limiar-5-50': new Acc() };
  for (const L of [0, 2, 5, 10]) pairs[`peak:despachante-L${L} - limiar-5-50`] = new Acc();
  for (const c of PARAMS.msg_costs) for (const L of [0, 2, 5, 10]) pairs[`cost${c}:limiar-5-50 - despachante-L${L}`] = new Acc();
  for (let r = 0; r < runs; r++) {
    const ar = new Rng(hashSeed(BASE_SEED, ID, 'arrivals', r));
    const arrivals = []; for (let j = 0; j < types; j++) { const a = new Int32Array(T); for (let t = 0; t < T; t++) a[t] = ar.poisson(rateAt(t, j)); arrivals.push(a); }
    const res = {};
    for (const s of SN) {
      const o = simulate(PARAMS.strategies[s], arrivals, new Rng(hashSeed(BASE_SEED, ID, s, r)));
      res[s] = o;
      for (const m of metrics) A[s][m].add(o[m]);
      PARAMS.msg_costs.forEach((c, k) => A[s].cost[k].add(o.meanActive + c * o.msgsPerStep));
      for (let t = 0; t < T; t++) traceSum[s][t] += o.trace[t];
    }
    pairs['lat:limiar-5-50 - fixo-media'].add(res['limiar-5-50'].meanLat - res['fixo-media'].meanLat);
    pairs['active:limiar-5-50 - fixo-pico'].add(res['limiar-5-50'].meanActive - res['fixo-pico'].meanActive);
    pairs['active:despachante-L0 - limiar-5-50'].add(res['despachante-L0'].meanActive - res['limiar-5-50'].meanActive);
    pairs['lat:despachante-L0 - limiar-5-50'].add(res['despachante-L0'].meanLat - res['limiar-5-50'].meanLat);
    for (const L of [0, 2, 5, 10]) pairs[`peak:despachante-L${L} - limiar-5-50`].add(res[`despachante-L${L}`].peak - res['limiar-5-50'].peak);
    for (const c of PARAMS.msg_costs) for (const L of [0, 2, 5, 10]) pairs[`cost${c}:limiar-5-50 - despachante-L${L}`].add((res['limiar-5-50'].meanActive + c * res['limiar-5-50'].msgsPerStep) - (res[`despachante-L${L}`].meanActive + c * res[`despachante-L${L}`].msgsPerStep));
  }
  const summary = {};
  for (const s of SN) { summary[s] = {}; for (const m of metrics) summary[s][m] = A[s][m].ci(); summary[s].total_cost_per_step = PARAMS.msg_costs.map((c, k) => ({ msg_cost: c, ...A[s].cost[k].ci() })); }
  const P = {}; for (const k of Object.keys(pairs)) P[k] = pairs[k].ci();
  // curva média de backlog (amostrada a cada 5 passos) para gráficos
  const step = 5, tAxis = []; for (let t = 0; t < T; t += step) tAxis.push(t);
  const traces = {}; for (const s of SN) traces[s] = tAxis.map((t) => traceSum[s][t] / runs);

  const thr = summary['limiar-5-50'];
  const neg = (k) => P[k].hi < 0, pos = (k) => P[k].lo > 0;
  const p1 = neg('lat:limiar-5-50 - fixo-media') && thr.msgsPerStep.mean === 0;
  const p2 = neg('active:limiar-5-50 - fixo-pico') && thr.meanLat.mean <= 2 * summary['fixo-pico'].meanLat.mean;
  const p3 = neg('active:despachante-L0 - limiar-5-50') && P['lat:despachante-L0 - limiar-5-50'].lo <= 0 && P['lat:despachante-L0 - limiar-5-50'].mean <= 0;
  const Ls = [0, 2, 5, 10];
  const latInc = Ls.every((L, i) => i === 0 || summary[`despachante-L${L}`].meanLat.mean > summary[`despachante-L${Ls[i - 1]}`].meanLat.mean);
  const peakInc = Ls.every((L, i) => i === 0 || summary[`despachante-L${L}`].peak.mean > summary[`despachante-L${Ls[i - 1]}`].peak.mean);
  const peakVsThr = [5, 10].every((L) => pos(`peak:despachante-L${L} - limiar-5-50`));
  const p4 = latInc && peakInc && peakVsThr;
  const p5 = Ls.every((L) => neg(`cost0.2:limiar-5-50 - despachante-L${L}`));
  const tests = [
    { id: 'P1', verdict: p1 ? 'suporta' : 'nao-suporta', detail: `Δlatência limiar−fixo-media = ${ciNum(P['lat:limiar-5-50 - fixo-media'])} passos; mensagens do limiar = 0` },
    { id: 'P2', verdict: p2 ? 'suporta' : 'nao-suporta', detail: `Δativos limiar−fixo-pico = ${ciNum(P['active:limiar-5-50 - fixo-pico'])}; latência limiar ${num(thr.meanLat.mean)} vs fixo-pico ${num(summary['fixo-pico'].meanLat.mean)}` },
    { id: 'P3', verdict: p3 ? 'suporta' : 'nao-suporta', detail: `Δativos desp.L0−limiar = ${ciNum(P['active:despachante-L0 - limiar-5-50'])}; Δlatência = ${ciNum(P['lat:despachante-L0 - limiar-5-50'])}` },
    { id: 'P4', verdict: p4 ? 'suporta' : (latInc || peakInc || peakVsThr ? 'suporta-parcialmente' : 'nao-suporta'), detail: `latência cresce com L=${latInc}; pico cresce com L=${peakInc}; pico desp.(L=5,10) > limiar=${peakVsThr} (Δpico L5 ${ciNum(P['peak:despachante-L5 - limiar-5-50'])}, L10 ${ciNum(P['peak:despachante-L10 - limiar-5-50'])})` },
    { id: 'P5', verdict: p5 ? 'suporta' : 'nao-suporta', detail: Ls.map((L) => `L${L}: Δcusto ${ciNum(P[`cost0.2:limiar-5-50 - despachante-L${L}`])}`).join('; ') },
  ];
  const row = (s) => `${s}: ativos ${ciNum(summary[s].meanActive)}, latência ${ciNum(summary[s].meanLat)}, pico ${ciNum(summary[s].peak, 1)}, msgs/passo ${num(summary[s].msgsPerStep.mean, 1)}`;
  const headline = [row('limiar-5-50'), row('fixo-media'), row('fixo-pico'), row('despachante-L0'), row('despachante-L10'),
    `Custo total/passo com 0,2 por mensagem: limiar ${ciNum(thr.total_cost_per_step[2])} vs despachante-L0 ${ciNum(summary['despachante-L0'].total_cost_per_step[2])}`];
  return roundDeep({ id: ID, version: VERSION, title: 'Limiares de resposta vs papéis fixos vs despachante central', seed: BASE_SEED,
    hypothesis: HYPOTHESIS, params: PARAMS, results: { summary, paired_differences: P, backlog_trace: { t: tAxis, mean_backlog: traces } }, tests, headline }, 4);
}

mainIfDirect(import.meta.url, run);
