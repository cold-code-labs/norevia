// LAB-004 swarm engine. N agents, B rounds, T micro-tasks. The SAME coordination code runs with a real backend (LLM calls) or a calibrated simulated backend.
// Agents act in waves (wave = max(10, ceil(N/10)) agents): inside a wave they see the same board snapshot (race window), between waves the board is updated.
// Arms (policy = selection + commit rule + options). Baselines: ORCH, INDEP, VOTE. Flags (one at a time): BOARD (stigmergy_board), QUORUM (quorum_stop), LOCUST (locust_phase_switch),
// ECOLI (ecoli_run_tumble), LEADERS (informed_leaders, on VOTE), WOUND (wound_resolution, on BOARD), RENAL (renal_compaction, on BOARD) with HISTORY as its control.
export const ARM_DEFS = {
  ORCH: { select: 'orch', commit: 'first', msgs: 2 }, 'ORCH-U': { select: 'orch', commit: 'first', msgs: 2, orchCap: Infinity }, INDEP: { select: 'random', commit: 'first', msgs: 0 }, VOTE: { select: 'fixed3', commit: 'vote', msgs: 1 },
  BOARD: { select: 'spread', commit: 'first', msgs: 2 }, QUORUM: { select: 'quorum', commit: 'quorum2', msgs: 2 }, LOCUST: { select: 'sample', commit: 'first', locust: true, msgs: 2 },
  ECOLI: { select: 'random', commit: 'first', ecoli: true, msgs: 0 }, LEADERS: { select: 'fixed3', commit: 'wvote', msgs: 1 }, WOUND: { select: 'spread', commit: 'first', wound: true, msgs: 2 },
  RENAL: { select: 'spread', commit: 'first', context: 'compact', msgs: 2 }, HISTORY: { select: 'spread', commit: 'first', context: 'history', msgs: 2 },
};
export const rngOf = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const shuffle = (a, r) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export async function runSwarm({ arm, N, B = 4, T, backend, seed = 1, V = 30, orchCap = 100, tau = 1, quorum = 2, log = null }) {
  const D = ARM_DEFS[arm]; const r = rngOf(seed * 7919 + N); const W = Math.max(10, Math.ceil(N / 10));
  const committed = new Array(T).fill(null), cands = Array.from({ length: T }, () => []), claims = Array.from({ length: T }, () => []);
  const agents = Array.from({ length: N }, (_, i) => ({ id: i, G: false, last: null, mem: [], retired: false }));
  const M = { calls: 0, cost: 0, inTok: 0, outTok: 0, ms: 0, msgs: 0, idle: 0, conflicts: 0, failedCalls: 0, rounds: [] }; let attemptCounter = 0;
  const claimCount = (t, rd) => claims[t].filter((x) => x >= rd - tau).length;
  for (let rd = 0; rd < B; rd++) {
    let active = agents.filter((a) => !a.retired);
    if (D.wound) { const U = committed.filter((x) => !x).length; if (U < active.length / 2) { const keep = Math.max(1, Math.ceil(2 * U)); active.sort((a, b) => a.id - b.id).slice(keep).forEach((a) => (a.retired = true)); active = active.slice(0, keep); } }
    const order = shuffle(active.map((a) => a.id), r); const roundStat = { round: rd, active: active.length, calls: 0, G: 0, committed0: committed.filter(Boolean).length };
    const assigned = new Set(); let orchLeft = D.orchCap ?? orchCap; let unresolved = null;
    for (let w = 0; w < order.length; w += W) {
      const wave = order.slice(w, w + W); const dec = [];
      const snap = committed.map(Boolean); const cc = new Map(); const cnt = (t) => { if (!cc.has(t)) cc.set(t, claimCount(t, rd)); return cc.get(t); };
      const sample = () => { const s = new Set(); while (s.size < Math.min(V, T)) s.add(Math.floor(r() * T)); return [...s]; };
      for (const id of wave) {
        const ag = agents[id]; let d = null;
        if (D.select === 'orch') { if (orchLeft <= 0) { M.idle++; continue; } orchLeft--; if (!unresolved) unresolved = shuffle(committed.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0), r); let t = -1; while (unresolved.length) { const c = unresolved.pop(); if (!committed[c] && !assigned.has(c)) { t = c; break; } } if (t < 0) { M.idle++; continue; } assigned.add(t); d = { t, mode: 'fresh' }; }
        else if (D.select === 'fixed3') { const t = Math.floor(attemptCounter++ / 3); if (t >= T) { M.idle++; continue; } d = { t, mode: 'fresh' }; }
        else if (D.ecoli && ag.last && !ag.last.vis && !committed[ag.last.t]) { const improved = ag.last.visCount > (ag.last.prevCount ?? 0); d = improved ? { t: ag.last.t, mode: 'revise', prior: ag.last.cand } : { t: ag.last.t, mode: 'fresh', hint: true }; }
        else if (D.select === 'random') d = { t: Math.floor(r() * T), mode: 'fresh' };
        else { let U = sample().filter((t) => !snap[t]); if (!U.length) U = [Math.floor(r() * T)]; let t;
          if (D.select === 'quorum') { const need = U.filter((x) => cands[x].filter((c) => c.vis).length === 1); const pool = need.length ? need : U; t = pool.reduce((b, x) => (cnt(x) < cnt(b) ? x : b), pool[0]); }
          else if (D.select === 'spread') { const mn = Math.min(...U.map(cnt)); const pool = U.filter((x) => cnt(x) === mn); t = pool[Math.floor(r() * pool.length)]; } else t = U[Math.floor(r() * U.length)];
          d = { t, mode: 'fresh' };
          if (D.locust) { const dens = cnt(t); let G = ag.G; if (dens >= 2) G = true; else if (dens <= 0) G = false; if (ag.last && !ag.last.vis) G = !G; ag.G = G; if (G) { const best = cands[t].filter((c) => c.code).sort((a, b) => b.visCount - a.visCount)[0]; if (best) { d.mode = 'revise'; d.prior = best; } roundStat.G++; } } }
        if (snap[d.t]) M.conflicts++;
        d.agent = ag; d.ctx = { mode: d.mode, prior: d.prior, hint: d.hint, context: D.context, mem: D.context ? ag.mem : null, agentId: id }; dec.push(d); claims[d.t].push(rd);
      }
      const res = await Promise.all(dec.map((d) => backend.attempt(d.t, d.ctx))); let wmax = 0;
      res.forEach((o, i) => { const d = dec[i], t = d.t; M.calls++; roundStat.calls++; M.cost += o.cost; M.inTok += o.inTok; M.outTok += o.outTok; wmax = Math.max(wmax, o.ms); M.msgs += D.msgs; if (o.failed) M.failedCalls++;
        const c = { agent: d.agent.id, round: rd, vis: o.vis, hid: o.hid, sig: o.sig, visCount: o.visCount, code: o.code, mode: d.mode }; cands[t].push(c);
        if (!committed[t]) { if (D.commit === 'first' && o.vis) committed[t] = { ...c }; else if (D.commit === 'quorum2') { const v = cands[t].filter((x) => x.vis); const g = {}; for (const x of v) (g[x.sig] ||= []).push(x); const hit = Object.values(g).find((a) => a.length >= quorum); if (hit) committed[t] = { ...hit[0] }; } }
        const prev = d.agent.last; d.agent.last = { t, vis: o.vis, visCount: o.visCount, prevCount: prev && prev.t === t ? prev.visCount : undefined, cand: c };
        if (D.context === 'history') { d.agent.mem.push({ prompt: o.prompt, answer: o.answer, ok: o.vis }); d.agent.mem = d.agent.mem.slice(-2); } else if (D.context === 'compact' && o.vis) { d.agent.mem.push({ code: o.code }); d.agent.mem = d.agent.mem.slice(-2); } });
      M.ms += wmax;
    }
    roundStat.committedEnd = committed.filter(Boolean).length; M.rounds.push(roundStat); if (log) log(arm, N, rd, M);
  }
  if (D.commit === 'vote' || D.commit === 'wvote') for (let t = 0; t < T; t++) { const cs = cands[t]; if (!cs.length) continue; const g = {}; for (const c of cs) { const w = D.commit === 'wvote' ? (c.vis ? 1 : 0.25) : 1; (g[c.sig] ||= { w: 0, c }).w += w; } const best = Object.entries(g).sort((a, b) => b[1].w - a[1].w || (a[0] < b[0] ? -1 : 1))[0][1].c; committed[t] = { ...best }; }
  // metrics
  const per = Array.from({ length: T }, (_, t) => (committed[t] ? (committed[t].hid ? 1 : 2) : 0)); const accepted = per.filter((x) => x === 1).length, fsx = per.filter((x) => x === 2).length, cm = accepted + fsx;
  let pairsSame = 0, pairsTot = 0; for (let t = 0; t < T; t++) { const w = cands[t].filter((c) => !c.hid); for (let i = 0; i < w.length; i++) for (let j = i + 1; j < w.length; j++) { pairsTot++; if (w[i].sig === w[j].sig) pairsSame++; } }
  const attempts = cands.map((c) => c.length); const dups = attempts.reduce((s, a) => s + Math.max(0, a - 1), 0);
  return { arm, N, B, T, seed, calls: M.calls, failedCalls: M.failedCalls, cost: +M.cost.toFixed(5), inTok: M.inTok, outTok: M.outTok, criticalPathS: +(M.ms / 1000).toFixed(1), accepted, falseSuccess: fsx, committed: cm, coverage: +(accepted / T).toFixed(4), fsRate: cm ? +(fsx / cm).toFixed(4) : 0, dupCalls: dups, conflicts: M.conflicts, idleAgentRounds: M.idle, msgs: M.msgs, msgsPerAccepted: accepted ? +(M.msgs / accepted).toFixed(2) : null, wrongPairsSame: pairsSame, wrongPairsTotal: pairsTot, errCorr: pairsTot ? +(pairsSame / pairsTot).toFixed(3) : null, rounds: M.rounds, per, attempts };
}
