// B-pipeline: fixed specialists, always 3 calls: solver sonnet/medium → critic
// haiku/low (sees spec, original, patch and visible-test results) → solver revises.
import { feedbackBlock, SYSTEM_CRITIC, taskPrompt } from '../lib/prompt.mjs';
export const B_pipeline = async (ctx) => {
  const s1 = await ctx.solve({ role: 'solver', model: 'sonnet', effort: 'medium' });
  let cand = s1.files;
  const t1 = await ctx.testVisible(cand);
  const critique = await ctx.call({ role: 'critic', model: 'haiku', effort: 'low', system: SYSTEM_CRITIC,
    prompt: taskPrompt(ctx.task, { extra: feedbackBlock(cand, t1, 'Proposed fix') }).replace(/Fix the bugs so[\s\S]*$/, 'Review the proposed fix against the full specification. List concrete remaining defects, or answer APPROVE.') });
  const crit = critique.text.trim();
  const s2 = await ctx.solve({ role: 'reviser', model: 'sonnet', effort: 'medium', rework: true,
    extra: feedbackBlock(cand, t1, 'Your previous candidate') + `\n\n## Reviewer critique\n${crit}\n\nRevise your candidate if the critique or test results reveal real defects (verify against the specification; the reviewer may be wrong). Return the complete content of every file you change relative to the previous candidate; files you do not return keep the previous candidate version. If nothing should change, output NO CHANGES.` });
  cand = { ...cand, ...s2.files };
  ctx.log({ critiqueApprove: /^APPROVE\b/.test(crit), revisedFiles: Object.keys(s2.files) });
  return { files: cand };
};
