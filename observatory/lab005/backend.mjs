// LAB-004 backends. Real: one Claude API call per attempt (micro-prompt), scored by code. The engine only sees backend.attempt(taskIndex, ctx) → outcome.
import { call } from './api.mjs'; import { score, taskForPrompt, expectedOut, evalCode } from './tasks5.mjs';
const SYSTEM = 'You write one short JavaScript function. Your reply must begin with ```js on its first line and contain only that code block. Never write reasoning, analysis or any text outside the code block; if the examples are ambiguous, guess the most plausible general function. No comments.';
export const extractCode = (t) => { const m = t.match(/```(?:js|javascript)?\s*\n([\s\S]*?)(?:```|$)/); return (m ? m[1] : t).trim(); };
const feedback = (task, code) => { const vo = evalCode(code, task.fname, task.visible); const ve = (task._ve ||= expectedOut(task, task.visible)); let passed = 0, first = null; for (let i = 0; i < ve.length; i++) { if (vo && vo[i] === ve[i]) passed++; else if (!first) first = `${task.fname}(${task.visible[i].map((x) => JSON.stringify(x)).join(', ')}) returned ${vo ? vo[i] : 'an error'}, expected ${ve[i]}`; } return { passed, total: ve.length, first }; };
export function buildPrompt(task, ctx) {
  let p = taskForPrompt(task);
  if (ctx.context === 'history' && ctx.mem?.length) p = `Earlier in this session you worked on other functions:\n${ctx.mem.map((m) => `--- earlier task ---\n${m.prompt}\n--- your answer (${m.ok ? 'passed' : 'failed'} its examples) ---\n${m.answer}`).join('\n')}\n\nNow the current task:\n\n${p}`;
  if (ctx.context === 'compact' && ctx.mem?.length) p = `Verified solutions you wrote earlier (they passed their examples; they may or may not be relevant):\n${ctx.mem.map((m) => m.code).join('\n')}\n\nNow the current task:\n\n${p}`;
  if (ctx.mode === 'revise' && ctx.prior) { const fb = feedback(task, ctx.prior.code); p += `\n\nA previous attempt by a colleague:\n\`\`\`js\n${ctx.prior.code}\n\`\`\`\nIt passes ${fb.passed} of ${fb.total} of the examples${fb.first ? `; for instance ${fb.first}` : ''}. Write a corrected, complete function.`; }
  if (ctx.hint) p += '\n\nSolve it with a different approach than the most obvious one, and check edge cases.';
  return p;
}
export const realBackend = (tasks, tag) => ({ real: true,
  async attempt(ti, ctx) { const task = tasks[ti]; const prompt = buildPrompt(task, ctx); const t0 = Date.now(); const r = await call({ system: SYSTEM, prompt, maxTokens: 300, meta: { run: tag, task: task.id, mode: ctx.mode || 'fresh', context: ctx.context || 'none' } });
    if (!r?.text) return { ok: false, vis: false, hid: false, sig: 'NONE', cost: r?.cost || 0, inTok: r?.inTok || 0, outTok: r?.outTok || 0, ms: r?.ms || 0, code: '', visCount: 0, failed: true, prompt: '', answer: '' };
    const code = extractCode(r.text); const s = score(task, code); const fb = feedback(task, code);
    return { ok: true, vis: s.vis, hid: s.hid, sig: s.sig, cost: r.cost, inTok: r.inTok, outTok: r.outTok, ms: r.ms, code, visCount: fb.passed, prompt: taskForPrompt(task), answer: r.text.slice(0, 600) }; } });
