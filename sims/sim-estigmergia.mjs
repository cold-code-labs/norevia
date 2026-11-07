// sim-estigmergia — coordenação por rastro compartilhado com evaporação vs mensagens diretas todos-com-todos
// vs sem coordenação, em busca sequencial de alvos numa grade (exploração/forrageio abstrato).
// Uso: node sims/sim-estigmergia.mjs
import { Rng, hashSeed, BASE_SEED, Acc, roundDeep, num, ciNum, pct, mainIfDirect } from './lib.mjs';

export const ID = 'sim-estigmergia';
export const VERSION = '1.0.0';

export const HYPOTHESIS = {
  statement: 'Um rastro compartilhado ("já explorei aqui") reduz trabalho duplicado e tempo até a solução sem mensagens; como os agentes não sabem quando um episódio termina, o rastro velho vira ruído, e a evaporação funciona como esquecimento: existe uma taxa intermediária ótima, e o rastro sem evaporação cresce sem limite.',
  predictions: [
    { id: 'P1', text: 'Para K=4 e K=16, estigmergia com evaporação baixa (epsilon=0,01) tem tempo médio até a solução e fração de visitas duplicadas menores que sem-coordenação (IC95% disjuntos).' },
    { id: 'P2', text: 'O tempo até a solução é em forma de U em epsilon: existe epsilon intermediário (0<epsilon<1) com tempo significativamente menor (IC95% disjuntos) que epsilon=0 e que epsilon=1, para K=4 e K=16.' },
    { id: 'P3', text: 'Mensagens todos-com-todos (informação perfeita e zerada a cada episódio) têm o menor tempo, ao custo de K(K-1) mensagens por passo; o melhor epsilon de estigmergia fica a no máximo 15% do tempo das mensagens, com zero mensagens.' },
    { id: 'P4', text: 'Com epsilon=0, a massa de rastro cresce ~linearmente com o tempo (memória ilimitada) e o 10º episódio é mais lento que o 1º; com o melhor epsilon a massa se estabiliza (razão massa ep.10/ep.5 < 1,2).' },
  ],
};

export const PARAMS = {
  seed: BASE_SEED,
  grid: 24, neighborhood: 4, Ks: [4, 16], episodes: 10, runs: 500, max_steps_episode: 20000,
  epsilons: [0, 0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1],
  deposit: 1,
  strategies: {
    'sem-coordenacao': 'passeio aleatório sem retorno imediato',
    'estigmergia': 'move para o vizinho com menor rastro (decaído por (1-epsilon)^dt), empates aleatórios; deposita +1 ao chegar; NÃO sabe quando o episódio termina',
    'mensagens-todos': 'cada agente transmite sua posição a todos a cada passo (K(K-1) msgs/passo) + aviso de alvo encontrado (K-1); escolhe o vizinho menos visitado no episódio atual',
  },
  duplicated_work: 'fração de movimentos que chegam a um nó já visitado (por qualquer agente) no episódio atual',
  episode: 'alvo uniforme na grade; episódio termina quando um agente pisa no alvo; novo alvo surge e os agentes continuam de onde estão',
};

function buildGrid(W) {
  const n = W * W, nb = new Int32Array(n * 4).fill(-1), deg = new Uint8Array(n);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const v = y * W + x; const ns = [];
    if (x > 0) ns.push(v - 1); if (x < W - 1) ns.push(v + 1); if (y > 0) ns.push(v - W); if (y < W - 1) ns.push(v + W);
    deg[v] = ns.length; ns.forEach((u, i) => { nb[v * 4 + i] = u; });
  }
  return { n, nb, deg };
}

function simulateRun(G, K, mode, eps, rng) {
  const { n, nb, deg } = G; const W = PARAMS.grid;
  const pos = new Int32Array(K).fill(Math.floor(W / 2) * W + Math.floor(W / 2)), prev = new Int32Array(K).fill(-1);
  const m = new Float64Array(n), tl = new Float64Array(n); // rastro e instante da última atualização
  const cnt = new Int32Array(n);                             // contagem por episódio (mensagens)
  const visitedEp = new Int32Array(n).fill(-1);
  const logk = eps > 0 && eps < 1 ? Math.log(1 - eps) : 0;
  const val = (v, t) => { if (eps === 0) return m[v]; if (eps >= 1) return t === tl[v] ? m[v] : 0; return m[v] * Math.exp((t - tl[v]) * logk); };
  let t = 0;
  const epTimes = [], epDup = [], epMass = [], epMsgs = [];
  const cand = new Int32Array(4);
  for (let e = 0; e < PARAMS.episodes; e++) {
    let target; do { target = rng.int(n); } while (pos.some((p) => p === target));
    for (let k = 0; k < K; k++) visitedEp[pos[k]] = e;
    if (mode === 'mensagens-todos') { cnt.fill(0); for (let k = 0; k < K; k++) cnt[pos[k]]++; }
    let mass = 0; if (mode === 'estigmergia') for (let v = 0; v < n; v++) mass += val(v, t);
    epMass.push(mass);
    let steps = 0, moves = 0, dups = 0, found = false;
    while (!found && steps < PARAMS.max_steps_episode) {
      t++; steps++;
      for (let k = 0; k < K && !found; k++) {
        const v = pos[k], d = deg[v]; let next;
        if (mode === 'sem-coordenacao') {
          let c = 0; for (let i = 0; i < d; i++) { const u = nb[v * 4 + i]; if (u !== prev[k]) cand[c++] = u; }
          next = c ? cand[rng.int(c)] : nb[v * 4 + rng.int(d)];
        } else {
          let best = Infinity, c = 0;
          for (let i = 0; i < d; i++) {
            const u = nb[v * 4 + i]; const x = mode === 'estigmergia' ? val(u, t) : cnt[u];
            if (x < best - 1e-12) { best = x; c = 0; cand[c++] = u; } else if (Math.abs(x - best) <= 1e-12) cand[c++] = u;
          }
          next = cand[rng.int(c)];
        }
        prev[k] = v; pos[k] = next; moves++;
        if (visitedEp[next] === e) dups++; else visitedEp[next] = e;
        if (mode === 'estigmergia') { m[next] = val(next, t) + PARAMS.deposit; tl[next] = t; }
        else if (mode === 'mensagens-todos') cnt[next]++;
        if (next === target) found = true;
      }
    }
    epTimes.push(steps); epDup.push(dups / moves);
    epMsgs.push(mode === 'mensagens-todos' ? steps * K * (K - 1) + (K - 1) : 0);
  }
  return { epTimes, epDup, epMass, epMsgs };
}

export function run() {
  const G = buildGrid(PARAMS.grid);
  const configs = [];
  for (const K of PARAMS.Ks) {
    configs.push({ K, mode: 'sem-coordenacao', eps: null, label: 'sem-coordenacao' });
    configs.push({ K, mode: 'mensagens-todos', eps: null, label: 'mensagens-todos' });
    for (const eps of PARAMS.epsilons) configs.push({ K, mode: 'estigmergia', eps, label: `estigmergia-e${eps}` });
  }
  const results = [];
  for (const c of configs) {
    const time = new Acc(), dup = new Acc(), msgs = new Acc(), censored = { n: 0 };
    const byEp = Array.from({ length: PARAMS.episodes }, () => new Acc()), massEp = Array.from({ length: PARAMS.episodes }, () => new Acc());
    for (let r = 0; r < PARAMS.runs; r++) {
      const rng = new Rng(hashSeed(BASE_SEED, ID, c.K, c.label, r));
      const o = simulateRun(G, c.K, c.mode, c.eps ?? 0, rng);
      time.add(o.epTimes.reduce((a, b) => a + b, 0) / o.epTimes.length);
      dup.add(o.epDup.reduce((a, b) => a + b, 0) / o.epDup.length);
      msgs.add(o.epMsgs.reduce((a, b) => a + b, 0) / o.epMsgs.length);
      o.epTimes.forEach((x, i) => { byEp[i].add(x); if (x >= PARAMS.max_steps_episode) censored.n++; });
      o.epMass.forEach((x, i) => massEp[i].add(x));
    }
    results.push({ K: c.K, strategy: c.mode, epsilon: c.eps, label: c.label, time_to_solution: time.ci(), duplicated_fraction: dup.ci(), messages_per_episode: msgs.ci(),
      time_by_episode: byEp.map((a) => a.mean), trail_mass_at_episode_start: massEp.map((a) => a.mean), censored_episodes: censored.n });
  }
  const get = (K, label) => results.find((x) => x.K === K && x.label === label);
  const less = (a, b) => a.hi < b.lo;
  // P1
  const p1 = PARAMS.Ks.every((K) => { const s = get(K, 'estigmergia-e0.01'), n = get(K, 'sem-coordenacao'); return less(s.time_to_solution, n.time_to_solution) && less(s.duplicated_fraction, n.duplicated_fraction); });
  // P2 + melhor epsilon
  const best = {}; const p2parts = [];
  for (const K of PARAMS.Ks) {
    const st = PARAMS.epsilons.map((e) => get(K, `estigmergia-e${e}`));
    const b = st.reduce((a, x) => (x.time_to_solution.mean < a.time_to_solution.mean ? x : a));
    best[K] = b;
    const ok = b.epsilon > 0 && b.epsilon < 1 && less(b.time_to_solution, st[0].time_to_solution) && less(b.time_to_solution, st[st.length - 1].time_to_solution);
    p2parts.push({ K, ok, best_eps: b.epsilon, t_best: b.time_to_solution.mean, t0: st[0].time_to_solution.mean, t1: st[st.length - 1].time_to_solution.mean });
  }
  const p2 = p2parts.every((x) => x.ok);
  // P3
  const p3parts = PARAMS.Ks.map((K) => { const msg = get(K, 'mensagens-todos'), b = best[K]; const allStig = results.filter((x) => x.K === K && x.strategy === 'estigmergia');
    const lowest = allStig.every((x) => x.time_to_solution.mean >= msg.time_to_solution.mean) && get(K, 'sem-coordenacao').time_to_solution.mean >= msg.time_to_solution.mean;
    return { K, lowest, ratio: b.time_to_solution.mean / msg.time_to_solution.mean, msgs: msg.messages_per_episode.mean }; });
  const p3 = p3parts.every((x) => x.lowest && x.ratio <= 1.15);
  // P4
  const p4parts = PARAMS.Ks.map((K) => { const z = get(K, 'estigmergia-e0'), b = best[K];
    return { K, slower: z.time_by_episode[9] > z.time_by_episode[0], mass0_ratio: z.trail_mass_at_episode_start[9] / z.trail_mass_at_episode_start[4], massBest_ratio: b.trail_mass_at_episode_start[9] / b.trail_mass_at_episode_start[4] }; });
  const p4 = p4parts.every((x) => x.slower && x.mass0_ratio > 1.5 && x.massBest_ratio < 1.2);
  const tests = [
    { id: 'P1', verdict: p1 ? 'suporta' : 'nao-suporta', detail: PARAMS.Ks.map((K) => `K=${K}: tempo ${num(get(K, 'estigmergia-e0.01').time_to_solution.mean, 1)} vs ${num(get(K, 'sem-coordenacao').time_to_solution.mean, 1)}; duplicação ${pct(get(K, 'estigmergia-e0.01').duplicated_fraction.mean)} vs ${pct(get(K, 'sem-coordenacao').duplicated_fraction.mean)}`).join('; ') },
    { id: 'P2', verdict: p2 ? 'suporta' : (p2parts.some((x) => x.ok) ? 'suporta-parcialmente' : 'nao-suporta'), detail: p2parts.map((x) => `K=${x.K}: melhor epsilon=${x.best_eps} (t=${num(x.t_best, 1)}) vs epsilon=0 (${num(x.t0, 1)}) e epsilon=1 (${num(x.t1, 1)}); significativo=${x.ok}`).join('; ') },
    { id: 'P3', verdict: p3 ? 'suporta' : 'nao-suporta', detail: p3parts.map((x) => `K=${x.K}: mensagens com menor tempo=${x.lowest}; melhor estigmergia/mensagens=${num(x.ratio, 3)}; mensagens/episódio=${num(x.msgs, 0)}`).join('; ') },
    { id: 'P4', verdict: p4 ? 'suporta' : 'nao-suporta', detail: p4parts.map((x) => `K=${x.K}: eps=0 ep10 mais lento que ep1=${x.slower}; massa ep10/ep5 eps=0: ${num(x.mass0_ratio, 2)}; melhor eps: ${num(x.massBest_ratio, 2)}`).join('; ') },
  ];
  const h = (K, label) => { const x = get(K, label); return `${label} (K=${K}): tempo ${ciNum(x.time_to_solution, 1)}, duplicação ${pct(x.duplicated_fraction.mean)}, msgs/episódio ${num(x.messages_per_episode.mean, 0)}`; };
  const headline = PARAMS.Ks.flatMap((K) => [h(K, 'sem-coordenacao'), h(K, 'mensagens-todos'), h(K, 'estigmergia-e0'), h(K, `estigmergia-e${best[K].epsilon}`)]);
  return roundDeep({ id: ID, version: VERSION, title: 'Estigmergia com evaporação vs mensagens todos-com-todos vs sem coordenação', seed: BASE_SEED,
    hypothesis: HYPOTHESIS, params: PARAMS, results: { configs: results, best_epsilon: Object.fromEntries(PARAMS.Ks.map((K) => [K, best[K].epsilon])) }, tests, headline }, 4);
}

mainIfDirect(import.meta.url, run);
