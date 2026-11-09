// C-decompose: a cheap planner (haiku/low) decides whether the task is decomposable
// by file. If yes → micro-swarm (1 haiku/low per subproblem, restricted edit scope,
// in parallel) + integration + at most 1 repair (sonnet/medium) if visible tests fail.
// If not → 1 joint sonnet/medium solver + at most 1 repair.
import { feedbackBlock, parseJson, SYSTEM_PLANNER, taskPrompt } from '../lib/prompt.mjs';
const KEEP = 'Return the complete content of every file you change relative to the previous candidate; files you do not return keep the previous candidate version.';

export const C_decompose = async (ctx) => {
  const base = await ctx.testVisible({});
  const plan = await ctx.call({ role: 'planner', model: 'haiku', effort: 'low', system: SYSTEM_PLANNER,
    prompt: taskPrompt(ctx.task, { extra: feedbackBlock({}, base, 'Current code (no changes yet)') }).replace(/Fix the bugs so[\s\S]*$/, 'Return ONLY the JSON plan.') });
  const p = parseJson(plan.text) || { decomposable: false, subproblems: [] };
  const seen = new Set();
  const subs = (p.subproblems || []).map((s) => ({ goal: String(s.goal || ''), files: (s.files || []).map((f) => (f.startsWith('src/') ? f : 'src/' + f)).filter((f) => ctx.allowed.includes(f) && !seen.has(f) && seen.add(f)) })).filter((s) => s.files.length);
  const decomposed = !!p.decomposable && subs.length >= 2;
  let cand;
  if (decomposed) {
    const parts = await ctx.par(subs.map((s, i) => async (sub) => (await sub.solve({ role: `micro-${i}`, model: 'haiku', effort: 'low', editable: s.files, extra: `## Your subproblem\n${s.goal}` })).files));
    cand = Object.assign({}, ...parts);
  } else {
    cand = (await ctx.solve({ role: 'joint-solver', model: 'sonnet', effort: 'medium' })).files;
  }
  let t = await ctx.testVisible(cand);
  let repaired = false;
  if (!t.allPass) {
    const { files } = await ctx.solve({ role: 'integrator-repair', model: 'sonnet', effort: 'medium', rework: true, extra: feedbackBlock(cand, t, 'Integrated candidate') + '\n\n' + KEEP });
    const next = { ...cand, ...files };
    const tn = await ctx.testVisible(next);
    if (tn.pass >= t.pass) { cand = next; t = tn; }
    repaired = true;
  }
  ctx.log({ decomposed, plan: { decomposable: p.decomposable, n: subs.length, reason: String(p.reason || '').slice(0, 200) }, repaired });
  return { files: cand, visible: t, decomposed };
};
