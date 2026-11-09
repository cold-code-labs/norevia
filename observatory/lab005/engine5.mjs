// LAB-005 engine: LAB-004's micro-task swarm with (a) an optional bursty release of tasks, (b) population policies, (c) allocation/escalation/commit policies.
// One flag at a time, each next to its closest non-bio engineering control. The same code can run with the real backend (backend5.mjs).
// Worlds: 'S' static pool (all 630 tasks released at round 0), 'D' dynamic (bursts at 0%, 25%, 50%, 75% of the rounds: 19%, 40%, 25%, 16% of the pool).
import { rngOf } from '../lab004/engine.mjs';
const OPKEY = [['subtract 7', 'cond'], ['remainder', 'mod'], ['digits', 'dig'], ['divide', 'fdiv'], ['multiply', 'mul'], ['clamp', 'clamp'], ['negate', 'neg'], ['absolute', 'abs'], ['odd', 'odd'], ['add', 'add']];
export const klassOf = (t) => (t.family !== 'pbe' || !t.steps ? t.family : 'pbe:' + t.steps.map((ph) => (OPKEY.find(([k]) => ph.includes(k)) || [0, '?'])[1]).sort().join('+'));
export const ARMS5 = {
  // ---- static pool (population N always active; what differs is allocation / escalation / commit)
  'S-CENTRAL': { world: 'S', assign: 'central', commit: 'first', note: 'uncapped central dispatcher with global state (reference baseline)' },
  'S-BOARD': { world: 'S', select: 'spread', commit: 'first', note: 'shared board, least-claimed task (plain base)' },
  'S-GREEDY': { world: 'S', select: 'greedy', commit: 'first', note: 'control for proportional_allocation: best partial score first' },
  'S-PROP': { world: 'S', select: 'prop', commit: 'first', flag: 'proportional_allocation' },
  'S-ESC1': { world: 'S', select: 'spread', commit: 'first', team: { mode: 'count', k: 1 }, note: 'control for quorum_sensing_activation: team after 1 failure on the task' },
  'S-ESC2': { world: 'S', select: 'spread', commit: 'first', team: { mode: 'count', k: 2 }, note: 'control: team after 2 failures on the task' },
  'S-QSA': { world: 'S', select: 'spread', commit: 'first', team: { mode: 'density' }, flag: 'quorum_sensing_activation' },
  'S-FIXED3': { world: 'S', assign: 'vote', commit: 'vote3', note: 'control for correlation_stop: exactly 3 votes' },
  'S-SEQMAJ': { world: 'S', assign: 'vote', commit: 'seqmaj', note: 'control: add voters until a margin of 2 (max 5)' },
  'S-SEQCORR': { world: 'S', assign: 'vote', commit: 'seqcorr', flag: 'correlation_stop' },
  // ---- dynamic (bursty) world: population control
  'D-FULL': { world: 'D', select: 'spread', pop: 'full', commit: 'first', note: 'all agents always on' },
  'D-CENTRAL': { world: 'D', assign: 'central', pop: 'central', commit: 'first', note: 'central dispatcher: one agent per open task (reference baseline)' },
  'D-AIMD': { world: 'D', select: 'spread', pop: 'aimd', commit: 'first', note: 'control for acceptance_coupled_launch: additive increase / multiplicative decrease on the same acceptance signal' },
  'D-ACL': { world: 'D', select: 'spread', pop: 'acl', commit: 'first', flag: 'acceptance_coupled_launch' },
  'D-HYST': { world: 'D', select: 'spread', pop: 'hyst', commit: 'first', note: 'control for predator_prey_damping: threshold autoscaler with hysteresis on backlog per agent' },
  'D-PCTRL': { world: 'D', select: 'spread', pop: 'pctrl', commit: 'first', note: 'control: active agents proportional to backlog, undamped' },
  'D-PPD': { world: 'D', select: 'spread', pop: 'ppd', commit: 'first', flag: 'predator_prey_damping' },
};
const shuffle = (a, r) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
function popSize(D, s) { // s = { N, rd, backlog, prevA, prevCalls, prevCommits, prevIdleShare }
  const { N, rd, backlog } = s; const rate = s.prevCalls ? s.prevCommits / s.prevCalls : 0;
  switch (D.pop || 'full') {
    case 'full': return N;
    case 'central': return Math.min(N, backlog);
    case 'aimd': return rd === 0 ? Math.round(0.2 * N) : clamp(Math.round(rate >= 0.15 ? s.prevA + 0.05 * N : s.prevA * 0.5), Math.round(0.05 * N), N);
    case 'acl': return rd === 0 ? Math.round(0.3 * N) : clamp(Math.round(N * clamp(rate / 0.25, 0.1, 1)), Math.round(0.05 * N), N);
    case 'hyst': { if (rd === 0) return Math.round(0.2 * N); const ratio = backlog / Math.max(1, s.prevA); return clamp(Math.round(ratio > 1.5 ? s.prevA * 1.5 : ratio < 0.5 ? s.prevA * 0.67 : s.prevA), Math.round(0.05 * N), N); }
    case 'pctrl': return clamp(backlog, Math.round(0.05 * N), N);
    case 'ppd': { if (rd === 0) return Math.round(0.3 * N); let a = s.prevA + 0.5 * (backlog - s.prevA); if (s.prevIdleShare > 0.3) a *= 0.8; return clamp(Math.round(a), Math.round(0.05 * N), N); }
  }
}
export async function runWorld({ arm, N, B, tasks, backend, seed = 1, V = 30, tau = 1 }) {
  const D = ARMS5[arm]; const T = tasks.length; const r = rngOf(seed * 7919 + N * 13 + arm.length * 101); const kl = tasks.map(klassOf); const nVis = tasks.map((t) => t.visible.length);
  const rel = new Array(T).fill(0);
  if (D.world === 'D') { const idx = shuffle([...Array(T).keys()], r); const share = [0.19, 0.40, 0.25, 0.16], at = [0, Math.round(B * 0.25), Math.round(B * 0.5), Math.round(B * 0.75)]; let p = 0; share.forEach((s, i) => { const n = i === 3 ? T - p : Math.round(s * T); idx.slice(p, p + n).forEach((t) => (rel[t] = at[i])); p += n; }); }
  const committed = new Array(T).fill(null), cands = Array.from({ length: T }, () => []), claims = Array.from({ length: T }, () => []); const commitRound = new Array(T).fill(-1);
  const clsStat = {}; const cs = (k) => (clsStat[k] ||= { att: 0, fail: 0 }); let wrongSame = 0, wrongTot = 0;
  const M = { calls: 0, cost: 0, inTok: 0, outTok: 0, ms: 0, conflicts: 0, idle: 0, failedCalls: 0, activeRounds: 0, backlogArea: 0, teamCalls: 0, rounds: [] };
  let prevA = N, prevCalls = 0, prevCommits = 0, prevIdle = 0; let attemptsPerTask = new Array(T).fill(0);
  const q = (t) => (cands[t].length ? Math.max(...cands[t].map((c) => c.visCount)) / nVis[t] : 0.25);
  const finalizeVote = (t, weighted) => { const g = {}; for (const c of cands[t]) { const w = weighted ? (c.vis ? 1 : 0.25) : 1; (g[c.sig] ||= { w: 0, c }).w += w; } return Object.entries(g).sort((a, b) => b[1].w - a[1].w || (a[0] < b[0] ? -1 : 1))[0][1].c; };
  const margin = (t) => { const g = {}; for (const c of cands[t]) g[c.sig] = (g[c.sig] || 0) + 1; const v = Object.values(g).sort((a, b) => b - a); return (v[0] || 0) - (v[1] || 0); };
  const neff = (n, rho) => n / (1 + (n - 1) * rho);
  for (let rd = 0; rd < B; rd++) {
    const open = () => { const o = []; for (let t = 0; t < T; t++) if (rel[t] <= rd && !committed[t]) o.push(t); return o; };
    let O = open(); const backlog = O.length; M.backlogArea += backlog;
    const A = popSize(D, { N, rd, backlog, prevA, prevCalls, prevCommits, prevIdleShare: prevIdle }); const order = shuffle([...Array(N).keys()], r).slice(0, Math.min(N, Math.max(0, A))); M.activeRounds += order.length;
    const stat = { round: rd, active: order.length, backlog, calls: 0, commits: 0, idle: 0 }; const W = Math.max(10, Math.ceil(Math.max(1, order.length) / 10)); let centralQ = null; const teamedNow = new Set();
    for (let w = 0; w < order.length; w += W) {
      const wave = order.slice(w, w + W); const dec = []; O = open(); const snap = new Set(O); const claimCnt = (t) => claims[t].filter((x) => x >= rd - tau).length; const forced = [];
      if (D.assign && !centralQ) { centralQ = O.slice().sort((a, b) => (D.assign === 'vote' ? cands[b].length - cands[a].length : cands[a].length - cands[b].length) || r() - 0.5); }
      for (const id of wave) {
        let t = -1;
        if (forced.length) t = forced.shift();
        else if (D.assign) { while (centralQ.length) { const c = centralQ.shift(); if (!committed[c]) { t = c; break; } } }
        else { if (!O.length) { stat.idle++; M.idle++; continue; } const smp = []; const seen = new Set(); const want = Math.min(V, O.length); while (smp.length < want) { const c = O[Math.floor(r() * O.length)]; if (!seen.has(c) && snap.has(c)) { seen.add(c); smp.push(c); } }
          if (D.select === 'greedy') { const mx = Math.max(...smp.map(q)); const p = smp.filter((x) => q(x) === mx); t = p.reduce((b, x) => (claimCnt(x) < claimCnt(b) ? x : b), p[Math.floor(r() * p.length)]); }
          else if (D.select === 'prop') { const wts = smp.map((x) => 0.05 + q(x)); let u = r() * wts.reduce((a, b) => a + b, 0); t = smp[0]; for (let i = 0; i < smp.length; i++) { u -= wts[i]; if (u <= 0) { t = smp[i]; break; } } }
          else { const mn = Math.min(...smp.map(claimCnt)); const p = smp.filter((x) => claimCnt(x) === mn); t = p[Math.floor(r() * p.length)]; }
          if (D.team && !teamedNow.has(t)) { const fails = cands[t].filter((c) => !c.vis).length; let go = false; if (D.team.mode === 'count') go = fails >= D.team.k; else { const s = cs(kl[t]); go = s.att >= 6 && (s.fail + 1) / (s.att + 2) >= 0.75; } if (go) { teamedNow.add(t); forced.push(t, t); } } }
        if (t < 0) { stat.idle++; M.idle++; continue; }
        if (snap && !snap.has(t)) M.conflicts++; dec.push({ t, team: forced.length >= 0 && teamedNow.has(t) }); claims[t].push(rd);
      }
      const res = await Promise.all(dec.map((d) => backend.attempt(d.t, { mode: 'fresh' }))); let wmax = 0;
      res.forEach((o, i) => { const { t, team } = dec[i]; M.calls++; stat.calls++; M.cost += o.cost; M.inTok += o.inTok; M.outTok += o.outTok; wmax = Math.max(wmax, o.ms); if (o.failed) M.failedCalls++; if (team) M.teamCalls++; attemptsPerTask[t]++;
        const c = { rd, vis: o.vis, hid: o.hid, sig: o.sig, visCount: o.visCount }; if (!o.vis) { for (const p of cands[t].filter((x) => !x.vis)) { wrongTot++; if (p.sig === c.sig) wrongSame++; } } cands[t].push(c); const s = cs(kl[t]); s.att++; if (!o.vis) s.fail++;
        if (!committed[t]) { const n = cands[t].length;
          if (D.commit === 'first') { if (o.vis) { committed[t] = c; commitRound[t] = rd; stat.commits++; } }
          else if (D.commit === 'vote3') { if (n >= 3) { committed[t] = finalizeVote(t, false); commitRound[t] = rd; stat.commits++; } }
          else if (D.commit === 'seqmaj') { if (margin(t) >= 2 || n >= 5) { committed[t] = finalizeVote(t, false); commitRound[t] = rd; stat.commits++; } }
          else if (D.commit === 'seqcorr') { const rho = wrongTot >= 20 ? wrongSame / wrongTot : 0.4; const gain = neff(n + 1, rho) - neff(n, rho); if ((n >= 2 && gain < 0.12) || n >= 5) { committed[t] = finalizeVote(t, true); commitRound[t] = rd; stat.commits++; } } } });
      M.ms += wmax;
    }
    prevA = order.length; prevCalls = stat.calls; prevCommits = stat.commits; prevIdle = order.length ? stat.idle / order.length : 0; M.rounds.push(stat);
  }
  const per = committed.map((c) => (c ? (c.hid ? 1 : 2) : 0)); const acc = per.filter((x) => x === 1).length, fsx = per.filter((x) => x === 2).length, cm = acc + fsx;
  const waits = []; for (let t = 0; t < T; t++) if (per[t] === 1) waits.push(commitRound[t] - rel[t]);
  const finalBacklog = (() => { let n = 0; for (let t = 0; t < T; t++) if (rel[t] < B && !committed[t]) n++; return n; })();
  return { arm, N, B, T, seed, world: D.world, calls: M.calls, failedCalls: M.failedCalls, cost: +M.cost.toFixed(5), criticalPathS: +(M.ms / 1000).toFixed(1), accepted: acc, falseSuccess: fsx, committed: cm, coverage: +(acc / T).toFixed(4), fsRate: cm ? +(fsx / cm).toFixed(4) : 0, dupCalls: attemptsPerTask.reduce((s, a) => s + Math.max(0, a - 1), 0), conflicts: M.conflicts, idleAgentRounds: M.idle, activeAgentRounds: M.activeRounds, teamCalls: M.teamCalls, backlogArea: M.backlogArea, finalBacklog, meanWaitRounds: waits.length ? +(waits.reduce((a, b) => a + b, 0) / waits.length).toFixed(3) : null, errCorr: wrongTot ? +(wrongSame / wrongTot).toFixed(3) : null, rounds: M.rounds, per, attempts: attemptsPerTask };
}
