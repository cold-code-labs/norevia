// B-vote: N independent haiku/low agents in parallel; selection by most VISIBLE
// tests passing (tie → vote by identical content).
import { selectBest } from '../lib/ctx.mjs';
export const makeVote = (n, model = 'haiku', effort = 'low') => async (ctx) => {
  const cands = await ctx.par(Array.from({ length: n }, (_, i) => async (sub) => {
    const { files } = await sub.solve({ role: `voter-${i}`, model, effort });
    const test = await sub.testVisible(files);
    return { files, test };
  }));
  const best = selectBest(cands);
  ctx.log({ votes: cands.map((c) => c.test.pass), chosen: cands.indexOf(best) });
  return { files: best.files, visible: best.test };
};
export const B_vote3 = makeVote(3);
export const B_vote5 = makeVote(5);
