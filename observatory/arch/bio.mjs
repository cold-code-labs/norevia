// S-*: bioinspired architectures, budget-matched to B-vote5 (at most MAX_CALLS haiku/low calls per run).
// Each one implements a mechanism from the hypothesis registry as an engineering analogy — not a claim that
// the biological mechanism transfers. Only visible tests are used as the environmental signal.
import { feedbackBlock } from '../lib/prompt.mjs';
import { selectBest } from '../lib/ctx.mjs';

const MODEL = 'haiku', EFFORT = 'low', MAX_CALLS = 5;
const KEEP = 'Return the complete content of every file you change relative to the shared candidate; files you do not return keep the shared candidate version.';
const failRatio = (t) => (t.total ? 1 - t.pass / t.total : 1);

// S-threshold — response-threshold recruitment with habituation (H-06; nat-response-threshold).
// One seed agent works first. The stimulus s is the fraction of failing visible tests on the best candidate.
// Idle agents have heterogeneous thresholds; every agent with θ < s is recruited in parallel and revises the best
// candidate. Recruits that do not improve it raise their threshold (habituation); s = 0 means everyone rests.
export const S_threshold = async (ctx, { thetas = [0.05, 0.3, 0.55, 0.8], habituation = 0.25 } = {}) => {
  const seed = await ctx.solve({ role: 'seed', model: MODEL, effort: EFFORT });
  let best = { files: seed.files, test: await ctx.testVisible(seed.files) };
  let calls = 1; const th = [...thetas]; const trace = [{ round: 0, recruited: 1, pass: best.test.pass, total: best.test.total }];
  for (let round = 1; calls < MAX_CALLS && !best.test.allPass; round++) {
    const s = failRatio(best.test);
    const idx = th.map((t, i) => [t, i]).filter(([t]) => t < s).map(([, i]) => i).slice(0, MAX_CALLS - calls);
    if (!idx.length) { trace.push({ round, s, stop: 'stimulus below every threshold' }); break; }
    const extra = feedbackBlock(best.files, best.test, 'Shared candidate') + '\n\n' + KEEP;
    const outs = await ctx.par(idx.map((i) => async (sub) => {
      const { files } = await sub.solve({ role: `recruit-${i}`, model: MODEL, effort: EFFORT, extra, rework: true });
      const merged = { ...best.files, ...files };
      return { i, files: merged, test: await sub.testVisible(merged) };
    }));
    calls += idx.length;
    const prev = best; best = selectBest([prev, ...outs]);
    for (const o of outs) if (o.test.pass <= prev.test.pass) th[o.i] = Math.min(1, th[o.i] + habituation);
    trace.push({ round, s: +s.toFixed(2), recruited: idx.length, pass: best.test.pass, thresholds: th.map((t) => +t.toFixed(2)) });
  }
  ctx.log({ threshold: trace, calls });
  return { files: best.files, visible: best.test };
};

// S-stigmergy — coordination through the environment, no agent-to-agent messages (H-07; nat-stigmergy,
// nat-pheromone-evaporation-aco). The environment holds (a) the shared artifact (best code so far) and
// (b) marks on failing visible tests whose strength accumulates with each unsuccessful visit and evaporates
// each round (rho). Agents in parallel read the artifact plus only the strongest fresh marks.
export const S_stigmergy = async (ctx, { width = 2, rho = 0.5, topMarks = 4 } = {}) => {
  const seed = await ctx.solve({ role: 'seed', model: MODEL, effort: EFFORT });
  let art = { files: seed.files, test: await ctx.testVisible(seed.files) };
  const marks = new Map(); let calls = 1; const trace = [{ round: 0, pass: art.test.pass, total: art.test.total }];
  const deposit = (t) => { for (const f of t.failures || []) { const k = `${f.file} › ${f.name}`; const m = marks.get(k) || { s: 0, msg: f.message }; m.s += 1; m.msg = f.message; marks.set(k, m); } };
  deposit(art.test);
  for (let round = 1; calls < MAX_CALLS && !art.test.allPass; round++) {
    const n = Math.min(width, MAX_CALLS - calls);
    const strongest = [...marks.entries()].sort((a, b) => b[1].s - a[1].s).slice(0, topMarks);
    const files = Object.entries(art.files).map(([k, v]) => `--- ${k} ---\n${v.replace(/\s+$/, '')}\n--- end ${k} ---`).join('\n\n') || '(no files changed yet)';
    const extra = `## Shared artifact (current state of the code in the environment)\n${files}\n\n## Environment marks (strongest first; strength grows each time a visit leaves the test failing and evaporates over time)\n${strongest.map(([k, m]) => `- [strength ${m.s.toFixed(2)}] ${k}: ${m.msg}`).join('\n') || '(none)'}\n\nWork on the strongest marks first. ${KEEP}`;
    const outs = await ctx.par(Array.from({ length: n }, (_, i) => async (sub) => {
      const { files: f } = await sub.solve({ role: `forager-${round}-${i}`, model: MODEL, effort: EFFORT, extra, rework: true });
      const merged = { ...art.files, ...f };
      return { files: merged, test: await sub.testVisible(merged) };
    }));
    calls += n;
    for (const m of marks.values()) m.s *= 1 - rho;
    for (const o of outs) deposit(o.test);
    for (const [k, m] of marks) if (m.s < 0.05) marks.delete(k);
    art = selectBest([art, ...outs]);
    trace.push({ round, n, pass: art.test.pass, marks: marks.size });
  }
  ctx.log({ stigmergy: trace, calls });
  return { files: art.files, visible: art.test };
};

// S-quorum — scouts, recruitment to the best site and a quorum to commit (H-08, H-27; nat-quorum-nest-bees,
// nat-stop-signal-cross-inhibition). Two independent scouts sample. Further agents are recruited to revise the
// best site (recruitment proportional to quality); worse sites get no recruits (cross-inhibition). The swarm
// commits only when a quorum of q independent candidates passes every visible test, or when calls run out.
export const S_quorum = async (ctx, { scouts = 2, q = 2 } = {}) => {
  const sites = await ctx.par(Array.from({ length: scouts }, (_, i) => async (sub) => {
    const { files } = await sub.solve({ role: `scout-${i}`, model: MODEL, effort: EFFORT });
    return { files, test: await sub.testVisible(files), origin: `scout-${i}` };
  }));
  let calls = scouts; const trace = [{ scouts: sites.map((s) => s.test.pass) }];
  const quorum = () => sites.filter((s) => s.test.allPass);
  while (calls < MAX_CALLS && quorum().length < q) {
    const best = selectBest(sites);
    const committed = quorum().length > 0;
    // If one site already passes, recruit an independent confirmation from scratch; otherwise recruit to repair the best site.
    const extra = committed ? '' : feedbackBlock(best.files, best.test, 'Most promising candidate (recruited site)') + '\n\n' + KEEP;
    const { files } = await ctx.solve({ role: committed ? 'confirmer' : 'recruit', model: MODEL, effort: EFFORT, extra, rework: !committed });
    const merged = committed ? files : { ...best.files, ...files };
    sites.push({ files: merged, test: await ctx.testVisible(merged), origin: committed ? 'independent' : 'recruit' });
    calls += 1;
    trace.push({ call: calls, mode: committed ? 'confirm' : 'recruit', pass: sites.at(-1).test.pass, quorum: quorum().length });
  }
  const winners = quorum();
  const out = winners.length ? winners[0] : selectBest(sites);
  ctx.log({ quorum: trace, calls, reached: winners.length >= q });
  return { files: out.files, visible: out.test };
};
