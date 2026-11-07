// sim-clonal — expansão/contração inspirada em seleção clonal: escalar agentes enquanto o sinal de erro persiste,
// contrair após a resolução (retorno ao repouso), com memória opcional por tipo de incidente. Comparado com N fixo.
// Uso: node sims/sim-clonal.mjs
import { Rng, hashSeed, BASE_SEED, Acc, roundDeep, num, ciNum, mainIfDirect } from './lib.mjs';

export const ID = 'sim-clonal';
export const VERSION = '1.0.0';

export const HYPOTHESIS = {
  statement: 'Escalar multiplicativamente enquanto um sinal de erro persiste e contrair após a resolução dá recuperação comparável a um pool grande fixo com custo ocioso próximo ao de um pool mínimo; um filtro de persistência contém o custo de alarmes falsos, e memória por tipo de incidente acelera respostas secundárias.',
  predictions: [
    { id: 'P1', text: 'No cenário principal (alarme falso f=0,01), clonal-g2-h1 não é dominado por nenhum N fixo (1,2,4,8,16) em (custo ocioso, tempo médio de recuperação): para cada N fixo, o clonal é significativamente melhor em pelo menos uma das duas métricas.' },
    { id: 'P2', text: 'No cenário principal, clonal-g2-h1 tem custo ocioso <= 2x o do fixo-1 e tempo médio de recuperação <= o do fixo-4.' },
    { id: 'P3', text: 'No cenário ruidoso (f=0,05), persistência h=3 reduz o custo ocioso em >= 30% vs h=1, com aumento do tempo de recuperação <= 20%.' },
    { id: 'P4', text: 'Memória por tipo reduz o tempo médio de recuperação vs sem memória (IC95% disjuntos) com aumento de custo total <= 10%, no cenário principal.' },
    { id: 'P5', text: 'Contração lenta (c=0,8) aumenta o custo ocioso vs c=0,5 sem reduzir o tempo de recuperação em mais de 5%, no cenário principal.' },
  ],
};

export const PARAMS = {
  seed: BASE_SEED,
  T: 3000, runs: 1000,
  incident_rate: 1 / 120,                       // chegadas Poisson de incidentes por passo
  incident_types: [{ median_work: 20 }, { median_work: 40 }, { median_work: 80 }, { median_work: 120 }, { median_work: 200 }],
  work_sigma_log: 0.5,                         // trabalho ~ lognormal(ln(mediana), 0,5) em agente-passos efetivos
  alpha: 0.8,                                  // vazão efetiva = n^alpha (overhead de coordenação)
  detection_delay: 2,                          // passos até o sinal de erro refletir um incidente novo
  scenarios: { principal: { false_alarm: 0.01 }, ruidoso: { false_alarm: 0.05 } },
  n_min: 1, n_max: 32,
  policies: {
    'fixo-1': { kind: 'fixed', N: 1 }, 'fixo-2': { kind: 'fixed', N: 2 }, 'fixo-4': { kind: 'fixed', N: 4 }, 'fixo-8': { kind: 'fixed', N: 8 }, 'fixo-16': { kind: 'fixed', N: 16 },
    'clonal-g2-h1': { kind: 'clonal', g: 2, h: 1, c: 0.5, memory: false },
    'clonal-g2-h3': { kind: 'clonal', g: 2, h: 3, c: 0.5, memory: false },
    'clonal-g1.5-h1': { kind: 'clonal', g: 1.5, h: 1, c: 0.5, memory: false },
    'clonal-g2-h1-mem': { kind: 'clonal', g: 2, h: 1, c: 0.5, memory: true },
    'clonal-g2-h1-c0.8': { kind: 'clonal', g: 2, h: 1, c: 0.8, memory: false },
  },
  rules: 'clonal: se o sinal está ligado há >= h passos, n <- min(n_max, ceil(n*g)); se desligado, n <- max(n_min, floor(n*c)). Memória: ao detectar um tipo já visto, n <- max(n, n_pico_anterior_do_tipo). Trabalho FIFO: a vazão n^alpha vai ao incidente mais antigo; sobra passa ao seguinte.',
  idle_cost: 'soma de n(t) nos passos sem incidente aberto (agente-passos ociosos)',
};
const PN = Object.keys(PARAMS.policies);

function genIncidents(rng) {
  const { T, incident_rate, incident_types, work_sigma_log } = PARAMS; const out = [];
  for (let t = 0; t < T; t++) { const k = rng.poisson(incident_rate); for (let i = 0; i < k; i++) { const ty = rng.int(incident_types.length); out.push({ start: t, type: ty, work: rng.lognormal(Math.log(incident_types[ty].median_work), work_sigma_log) }); } }
  return out;
}
function simulate(pol, incidents, falseAlarms) {
  const { T, alpha, detection_delay, n_min, n_max } = PARAMS;
  let n = pol.kind === 'fixed' ? pol.N : n_min, onFor = 0, next = 0;
  const open = []; const mem = new Map(); const peak = new Map();
  let idle = 0, total = 0, idleSteps = 0; const rec = []; let maxN = n;
  for (let t = 0; t < T; t++) {
    while (next < incidents.length && incidents[next].start === t) { open.push({ ...incidents[next], left: incidents[next].work, detected: false }); next++; }
    // sinal e controle (antes de trabalhar neste passo)
    if (pol.kind === 'clonal') {
      let signal = falseAlarms[t] === 1;
      for (const inc of open) if (t - inc.start >= detection_delay) { signal = true; if (!inc.detected) { inc.detected = true; if (pol.memory && mem.has(inc.type)) n = Math.max(n, mem.get(inc.type)); } }
      onFor = signal ? onFor + 1 : 0;
      if (signal && onFor >= pol.h) n = Math.min(n_max, Math.ceil(n * pol.g));
      else if (!signal) n = Math.max(n_min, Math.floor(n * pol.c));
    }
    maxN = Math.max(maxN, n); total += n;
    if (open.length === 0) { idle += n; idleSteps++; }
    // trabalho FIFO
    let cap = Math.pow(n, alpha);
    for (const inc of open) peak.set(inc, Math.max(peak.get(inc) || 0, n));
    while (cap > 1e-12 && open.length) {
      const inc = open[0]; const d = Math.min(cap, inc.left); inc.left -= d; cap -= d;
      if (inc.left <= 1e-9) { rec.push(t - inc.start + 1); if (pol.memory) mem.set(inc.type, peak.get(inc)); peak.delete(inc); open.shift(); }
    }
  }
  return { idle, total, idleSteps, meanRec: rec.length ? rec.reduce((a, b) => a + b, 0) / rec.length : NaN, nRes: rec.length, unresolved: open.length, maxN, p95: rec.length ? rec.sort((a, b) => a - b)[Math.floor(0.95 * (rec.length - 1))] : NaN };
}

export function run() {
  const out = {};
  const pairs = {};
  for (const [sc, cfg] of Object.entries(PARAMS.scenarios)) {
    const A = {}; for (const p of PN) A[p] = { idle: new Acc(), total: new Acc(), rec: new Acc(), p95: new Acc(), unresolved: new Acc(), maxN: new Acc() };
    const P = { 'idle:h3-h1': new Acc(), 'rec:h3-h1': new Acc(), 'rec:mem-nomem': new Acc(), 'total:mem-nomem': new Acc(), 'idle:c0.8-c0.5': new Acc(), 'rec:c0.8-c0.5': new Acc() };
    for (const N of [1, 2, 4, 8, 16]) { P[`idle:clonal-fixo${N}`] = new Acc(); P[`rec:clonal-fixo${N}`] = new Acc(); }
    for (let r = 0; r < PARAMS.runs; r++) {
      const rng = new Rng(hashSeed(BASE_SEED, ID, 'env', r)); // mesmos incidentes nos dois cenários e em todas as políticas
      const inc = genIncidents(rng);
      const fa = new Uint8Array(PARAMS.T); const rf = new Rng(hashSeed(BASE_SEED, ID, 'fa', sc, r)); for (let t = 0; t < PARAMS.T; t++) fa[t] = rf.uniform() < cfg.false_alarm ? 1 : 0;
      const res = {};
      for (const p of PN) { const o = simulate(PARAMS.policies[p], inc, fa); res[p] = o; const a = A[p];
        a.idle.add(o.idle); a.total.add(o.total); if (Number.isFinite(o.meanRec)) a.rec.add(o.meanRec); if (Number.isFinite(o.p95)) a.p95.add(o.p95); a.unresolved.add(o.unresolved); a.maxN.add(o.maxN); }
      const ok = (x) => Number.isFinite(x);
      P['idle:h3-h1'].add(res['clonal-g2-h3'].idle - res['clonal-g2-h1'].idle);
      if (ok(res['clonal-g2-h3'].meanRec) && ok(res['clonal-g2-h1'].meanRec)) P['rec:h3-h1'].add(res['clonal-g2-h3'].meanRec - res['clonal-g2-h1'].meanRec);
      if (ok(res['clonal-g2-h1-mem'].meanRec) && ok(res['clonal-g2-h1'].meanRec)) P['rec:mem-nomem'].add(res['clonal-g2-h1-mem'].meanRec - res['clonal-g2-h1'].meanRec);
      P['total:mem-nomem'].add(res['clonal-g2-h1-mem'].total - res['clonal-g2-h1'].total);
      P['idle:c0.8-c0.5'].add(res['clonal-g2-h1-c0.8'].idle - res['clonal-g2-h1'].idle);
      if (ok(res['clonal-g2-h1-c0.8'].meanRec) && ok(res['clonal-g2-h1'].meanRec)) P['rec:c0.8-c0.5'].add(res['clonal-g2-h1-c0.8'].meanRec - res['clonal-g2-h1'].meanRec);
      for (const N of [1, 2, 4, 8, 16]) { P[`idle:clonal-fixo${N}`].add(res['clonal-g2-h1'].idle - res[`fixo-${N}`].idle); if (ok(res['clonal-g2-h1'].meanRec) && ok(res[`fixo-${N}`].meanRec)) P[`rec:clonal-fixo${N}`].add(res['clonal-g2-h1'].meanRec - res[`fixo-${N}`].meanRec); }
    }
    const S = {}; for (const p of PN) { S[p] = {}; for (const m of Object.keys(A[p])) S[p][m] = A[p][m].ci(); S[p].idle_per_step = A[p].idle.mean / PARAMS.T; S[p].total_per_step = A[p].total.mean / PARAMS.T; }
    out[sc] = { summary: S, paired: Object.fromEntries(Object.entries(P).map(([k, a]) => [k, a.ci()])),
      pareto: PN.map((p) => ({ policy: p, idle_cost: S[p].idle.mean, mean_recovery: S[p].rec.mean, total_cost: S[p].total.mean })) };
  }
  const M = out.principal, R = out.ruidoso;
  const p1rows = [1, 2, 4, 8, 16].map((N) => { const di = M.paired[`idle:clonal-fixo${N}`], dr = M.paired[`rec:clonal-fixo${N}`]; return { N, betterIdle: di.hi < 0, betterRec: dr.hi < 0, di, dr }; });
  const p1 = p1rows.every((x) => x.betterIdle || x.betterRec);
  const cS = M.summary['clonal-g2-h1'];
  const p2 = cS.idle.mean <= 2 * M.summary['fixo-1'].idle.mean && cS.rec.mean <= M.summary['fixo-4'].rec.mean;
  const idleRed = 1 - R.summary['clonal-g2-h3'].idle.mean / R.summary['clonal-g2-h1'].idle.mean;
  const recInc = R.summary['clonal-g2-h3'].rec.mean / R.summary['clonal-g2-h1'].rec.mean - 1;
  const p3 = idleRed >= 0.3 && recInc <= 0.2;
  const totInc = M.summary['clonal-g2-h1-mem'].total.mean / cS.total.mean - 1;
  const p4 = M.paired['rec:mem-nomem'].hi < 0 && totInc <= 0.1;
  const recRed = 1 - M.summary['clonal-g2-h1-c0.8'].rec.mean / cS.rec.mean;
  const p5 = M.paired['idle:c0.8-c0.5'].lo > 0 && recRed <= 0.05;
  const tests = [
    { id: 'P1', verdict: p1 ? 'suporta' : 'nao-suporta', detail: p1rows.map((x) => `vs fixo-${x.N}: Δocioso ${ciNum(x.di, 0)}, Δrecuperação ${ciNum(x.dr, 1)}`).join('; ') },
    { id: 'P2', verdict: p2 ? 'suporta' : 'nao-suporta', detail: `ocioso clonal ${num(cS.idle.mean, 0)} vs 2×fixo-1 ${num(2 * M.summary['fixo-1'].idle.mean, 0)}; recuperação clonal ${num(cS.rec.mean, 1)} vs fixo-4 ${num(M.summary['fixo-4'].rec.mean, 1)}` },
    { id: 'P3', verdict: p3 ? 'suporta' : 'nao-suporta', detail: `ruidoso: redução do ocioso com h=3 ${num(100 * idleRed, 1)}%; aumento da recuperação ${num(100 * recInc, 1)}%` },
    { id: 'P4', verdict: p4 ? 'suporta' : 'nao-suporta', detail: `Δrecuperação memória ${ciNum(M.paired['rec:mem-nomem'], 2)}; aumento do custo total ${num(100 * totInc, 1)}%` },
    { id: 'P5', verdict: p5 ? 'suporta' : 'nao-suporta', detail: `Δocioso c=0,8 ${ciNum(M.paired['idle:c0.8-c0.5'], 0)}; redução da recuperação ${num(100 * recRed, 1)}%` },
  ];
  const line = (sc, p) => { const s = out[sc].summary[p]; return `${sc} ${p}: ocioso ${ciNum(s.idle, 0)} agente-passos, recuperação ${ciNum(s.rec, 1)} passos, custo total/passo ${num(s.total_per_step, 2)}`; };
  const headline = ['fixo-1', 'fixo-4', 'fixo-16', 'clonal-g2-h1', 'clonal-g2-h1-mem'].map((p) => line('principal', p)).concat(['clonal-g2-h1', 'clonal-g2-h3'].map((p) => line('ruidoso', p)));
  return roundDeep({ id: ID, version: VERSION, title: 'Expansão/contração clonal vs N fixo', seed: BASE_SEED, hypothesis: HYPOTHESIS, params: PARAMS, results: out, tests, headline }, 4);
}

mainIfDirect(import.meta.url, run);
