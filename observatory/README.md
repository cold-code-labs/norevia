# Swarm Efficiency Observatory

The Observatory runs the same verifiable JavaScript bug-fix tasks against different agent architectures and compares acceptance, false success, cost, tokens, latency, calls, and rework. It is a research benchmark, not a deployment mechanism. No result here authorizes changes to production systems.

The runner was designed for the methods in section 5 of [`docs/SWARM-BRIEF.md`](../docs/SWARM-BRIEF.md). Curated task cards and interpreted results belong in `results/observatory/`; raw task runs and the call ledger are reproducibility artifacts.

## Layout

```text
observatory/
  tasks/<id>/             task.json, buggy source, visible tests, hidden tests, reference solution
  tasks/manifest.json     generated validation data and source hashes
  validate-tasks.mjs      checks that the buggy version fails and the reference passes
  lib/testrun.mjs         isolated test harness with read-only Node permissions and a 20 s timeout
  lib/llm.mjs             model-call layer, persistent ledger, and global spending cap
  lib/prompt.mjs          solver, critic, and planner prompts; response parser
  lib/ctx.mjs             per-run cost, token, and critical-path latency accounting
  lib/costmodel.mjs       estimated cost by model and effort from recent calls
  arch/                   architecture implementations
  run.mjs                 resumable runner with bounded concurrency
  analyze.mjs             aggregation to results/observatory/summary.json
```

## Architectures

| ID | Method | Model calls per run |
|---|---|---:|
| A-high / A-mid / A-low | Single agent at high / medium / low effort | 1 |
| A-low-loop | Low-effort single agent with up to three feedback repair rounds | 1–3 |
| B-vote3 / B-vote5 | Independent low-effort candidates; choose the candidate passing the most visible tests, ties by frequency | 3 / 5 |
| B-pipeline | Medium-effort solver, low-effort critic, solver revision | 3 |
| C-elastic | Increase effort or candidate count when visible tests fail; stop on acceptance, no gain, five rounds, or the per-task budget | 1–8 |
| C-decompose | Low-effort planner; restricted micro-swarm for independent parts, otherwise joint solver; at most one repair | 2–6 |

No architecture sees hidden tests. They are used only by the harness to determine acceptance and false success.

## Existing pilot evidence

The recorded pilot contains 45 runs: five tasks, nine architectures, one repetition per pair. All 45 passed both visible and hidden tests. Each architecture therefore has only five observations; its 95% interval for acceptance is 56.6%–100%. The task set was too easy to distinguish architectures, so this pilot supports no claim that any architecture is better. See `results/observatory/runs-pilot.jsonl` and `results/observatory/summary-pilot.json`.

The recorded call ledger currently totals about US$17.51 across smoke, calibration, generation, and pilot phases. The requested global cap remains US$250. Ledger spend is provider-reported and includes every phase; it is not the pilot's cost alone.

The latest full validation found 76 of 76 task folders valid. Five previously incomplete tasks now have task cards and tests; two reference-test expectations were corrected to match their documented contracts. See `observatory/tasks/manifest.json` for per-task counts and hashes. Most legacy benchmark task statements and test descriptions remain in Portuguese, so this suite is not yet an English-language benchmark. The English Observatory documentation must not be read as a translation or revalidation of those prompts.

## Calls and budget

The original adapter calls Claude Code in headless mode with tools disabled, an isolated temporary working directory, no session persistence, and a per-call `--max-budget-usd`. Each attempt is appended to `results/observatory/ledger.jsonl`. Before a call, the runner checks completed spend plus in-flight reservations against `OBS_GLOBAL_CAP_USD` (default US$250).

The Claude Code executable is selected by `CLAUDE_CODE_EXECPATH`. If it is unset or unavailable, the real-model benchmark cannot run. The OpenBot Luna model used for this continuation is not exposed to the local runner as an inference endpoint; do not substitute simulated model outputs for real calls.

## Reproduce

```bash
node observatory/validate-tasks.mjs
node observatory/run.mjs --phase pilot --tasks a01-clamp-range,b01-texto-kit --archs all --reps 1 --jobs 4 --concurrency 5
node observatory/run.mjs --phase full --split all --archs all --reps 3 --jobs 5 --concurrency 6 --phase-cap 150
node observatory/analyze.mjs --phases full
```

The runner resumes from `runs-<phase>.jsonl`. Full responses, final files, and hidden failures are stored under `results/observatory/raw/<phase>/`. Calls may vary between repetitions because the provider CLI does not expose a controlled sampling seed; provider-reported cost and token usage are recorded per attempt.

## Evidence limits

- One successful run does not estimate a reliable acceptance rate. Use repeated, paired runs over tasks spanning a range of difficulty.
- Report acceptance and false success with intervals alongside cost and latency. Cost per accepted task alone rewards systems that abstain on hard tasks.
- A local hidden-test pass validates the task suite's acceptance rule, not general software quality.
- The first pilot hit a ceiling effect. The next benchmark phase needs harder tasks, validated hidden tests, and enough repetitions to estimate uncertainty before architecture comparisons are interpreted.
