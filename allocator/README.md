# Norevia Allocator v0

A small, dependency-free policy that decides **how much agent effort a task gets** and then spends it carefully: one agent or one owner per part, repair only what fails, stop as soon as it is resolved, and never accept what was not checked. It is the one policy the Norevia experiments (LAB-001 to LAB-004) supported, packaged so it can be reused and measured (LAB-006).

> Status: v0, evaluated on two kinds of tasks (multi-package code repair and bundles of micro-functions) with Claude Haiku 5.5. See `results/lab006/REPORT.md` for where it wins and where it loses. It is not a general scheduler.

## The policy (every decision is logged with its reason)
| Step | Rule | Evidence |
|---|---|---|
| decide | solo if the task has fewer than `splitMinParts` (default 3) independent parts, team otherwise | LAB-003 Q1: splitting pays from about 3 packages (cost per accepted 0.64× at 3, 0.37× at 8; a single agent cannot emit the answer at 15) |
| team | one owner per part, part-only context, in parallel | LAB-003 Q1, LAB-001 CTRL/ORCH (package-only context avoids long-context cost) |
| baseline | optional free check of the starting state; failing parts get its feedback on the first pass | LAB-003 owners saw the failing probe of the unfixed code |
| repair | re-ask only parts whose check fails, with feedback and previous candidate, ≤ `maxRepairs` (default 2); keep a repair only if its score does not drop; merge returned files on the previous ones | LAB-003 Q2: extra attempts with check feedback are what matter; retry = recruit |
| stop | as soon as every part passes: no patrol, no extra calls | LAB-004 wound_resolution: cost saving once agents outnumber open work |
| gate | `accepted` only if every part passed its check; otherwise `unverified` parts are listed | all labs: verification, not structure, dominates false success; voting without a check amplifies correlated errors (LAB-004) |
| ceiling | per-task budget (calls, USD) checked before every call; hitting it stops the run | cost control |
Deliberately **not** included: type memory (LAB-003 Q3: no effect), majority voting without a check, free-running fan-out.

## API
```js
import { createAllocator } from './allocator/index.mjs';

const allocator = createAllocator({
  model: async ({ system, prompt, maxTokens, think, meta }) => ({ text, cost, inTok, outTok, ms }), // any provider
  policy: { splitMinParts: 3, maxRepairs: 2 },                // force: 'solo' | 'team' overrides the decision (baselines)
  budget: { maxCalls: 20, maxUsd: 0.3 },                      // per-task ceiling (a task may carry its own `budget`)
  onEvent: (e) => console.log(e),                              // optional live decision log
});
const result = await allocator.run(task);
// result: { mode, accepted, unverified, candidates, verification, calls, usd, inTok, outTok, budgetHit, criticalPathMs, wallMs, events }
```
`task` is an adapter:
| Field | Meaning |
|---|---|
| `id`, `parts: [{ id, label? }]` | the independent parts (a part can be solved without seeing the others) |
| `group(ids, { feedback, previous, extra })` | builds `{ system?, prompt, maxTokens?, think? }` for a call covering parts `ids` (all parts → solo, one part → owner); `feedback` and `previous` are keyed by part id |
| `parse(text, ids)` | extracts `{ partId: candidate }` from the model answer |
| `verify(candidates)` | visible check of the current candidate set → `{ partId: { pass, score (0..1), feedback } }` |
| `baseline()` (optional) | the same shape for the starting state; its feedback goes to first-pass agents |
| `merge(previous, next)` (optional) | how a repaired candidate combines with the previous one (default: replace) |
| `budget` (optional) | `{ maxCalls, maxUsd }` for this task |

## Decision log
`result.events` is an ordered list of `{ t, event, reason?, ... }`: `decide` (mode and why), `baseline-check`, `verify` (round, failing parts), `repair` (round, which parts, why), `stop-resolved`, `budget-stop`, `parse-error`, `gate` (accepted or not and why).

## Adapters used in the evaluation
`observatory/lab006/adapters.mjs`: `repoAdapter` (multi-package repair; visible check = probe tests, hidden = full suite) and `microAdapter` (bundles of independent micro-functions). Writing an adapter for a new kind of task is the work needed to use the Allocator elsewhere: parts that really are independent, and a visible check an agent cannot argue with.

## Tests
`cd allocator && npm test` (Node ≥ 20, mock model; covers the split threshold, repair of only failing parts, stop, gate, ceiling, baseline feedback and merge).

## Limits
v0 has fixed thresholds taken from experiments on cheap models and synthetic or repository-repair tasks. It assumes independent parts and a trustworthy visible check; without them it should not be used. It does not choose models, learn from earlier tasks, or recover from a verifier that is wrong.

License MIT (code); see the repository for the research content license.
