// A-low-loop (control): 1 haiku/low agent that self-repairs using visible-test
// feedback, up to 3 rounds. Separates the "verification + rework" effect from the "swarm" effect.
import { feedbackBlock } from '../lib/prompt.mjs';
const KEEP = 'Return the complete content of every file you change relative to the previous candidate; files you do not return keep the previous candidate version.';
export const A_low_loop = async (ctx, { model = 'haiku', effort = 'low', maxRounds = 3 } = {}) => {
  let cand = (await ctx.solve({ model, effort })).files;
  let t = await ctx.testVisible(cand);
  for (let r = 1; r < maxRounds && !t.allPass; r++) {
    const { files } = await ctx.solve({ role: 'self-repair', model, effort, rework: true, extra: feedbackBlock(cand, t) + '\n\n' + KEEP });
    const next = { ...cand, ...files };
    const tn = await ctx.testVisible(next);
    if (tn.pass >= t.pass) { cand = next; t = tn; }
  }
  return { files: cand, visible: t };
};
