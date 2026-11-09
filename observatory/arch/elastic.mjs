// C-elastic: starts minimal (1 haiku/low). Uses visible tests as the stimulus.
// - Contraction: stops as soon as visible tests pass.
// - Response threshold: if after the 1st attempt the fraction of failing visible tests
//   (stimulus s) exceeds THETA, jump straight to the next caste (task looks hard).
// - Clonal selection: each round, clones mutate the BEST candidate using test feedback;
//   selection by most visible tests passing (the previous best competes too).
// - Marginal gain: if the round improved the best candidate, stay in the caste
//   (expansion is paying off); if not, escalate (haiku/low → sonnet/medium → opus/high).
// - Per-task budget: never start a round whose estimated cost exceeds what remains.
import { feedbackBlock } from '../lib/prompt.mjs';
import { selectBest } from '../lib/ctx.mjs';
import { estCost } from '../lib/costmodel.mjs';

export const TIERS = [
  { model: 'haiku', effort: 'low', clones: 2 },
  { model: 'sonnet', effort: 'medium', clones: 1 },
  { model: 'opus', effort: 'high', clones: 1 },
];
const KEEP = 'Return the complete content of every file you change relative to the previous candidate; files you do not return keep the previous candidate version.';

export const C_elastic = async (ctx, { theta = 0.6, maxRounds = 5, budgetUsd = 1.0 } = {}) => {
  const first = await ctx.solve({ role: 'seed', model: 'haiku', effort: 'low' });
  let best = { files: first.files, test: await ctx.testVisible(first.files) };
  const trace = [{ round: 0, tier: 'haiku/low', n: 1, pass: best.test.pass, total: best.test.total }];
  let k = 0;
  const s0 = 1 - best.test.pass / best.test.total;
  if (!best.test.allPass && s0 > theta) { k = 1; trace.push({ threshold: `s=${s0.toFixed(2)}>θ=${theta} → escalate` }); }
  for (let round = 1; round <= maxRounds && !best.test.allPass && k < TIERS.length; round++) {
    const tier = TIERS[k];
    const est = estCost(tier.model, tier.effort) * tier.clones;
    if (ctx.spent + est > budgetUsd) { trace.push({ stop: 'per-task budget', spent: ctx.spent, est }); break; }
    const extra = feedbackBlock(best.files, best.test, 'Best candidate so far') + '\n\nThe candidate above still fails some visible tests. ' + KEEP;
    const clones = await ctx.par(Array.from({ length: tier.clones }, (_, i) => async (sub) => {
      const { files } = await sub.solve({ role: `clone-${tier.model}-${i}`, model: tier.model, effort: tier.effort, extra, rework: true });
      const merged = { ...best.files, ...files };
      return { files: merged, test: await sub.testVisible(merged) };
    }));
    const prev = best;
    best = selectBest([prev, ...clones]);
    const gain = best.test.pass - prev.test.pass;
    trace.push({ round, tier: `${tier.model}/${tier.effort}`, n: tier.clones, pass: best.test.pass, gain });
    if (!best.test.allPass && gain <= 0) k++;
  }
  ctx.log({ elastic: trace });
  return { files: best.files, visible: best.test };
};
