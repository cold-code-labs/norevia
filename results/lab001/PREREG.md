---
id: obs-lab001-prereg
title: "LAB-001 — Pre-registration and amendment"
area: observatory
evidence: hypothesis
tags: [lab-001, preregistration, observatory]
related: [obs-lab001-bio-vs-artificial]
updated: 2026-11-08
summary: "Arms, tasks, matched ceiling, primary outcome and the decision rule per mechanism, written before the main run."
---
# LAB-001 — Pre-registration (written 2026-11-08, before the calibration and main runs)

Owner: Norevia Lab. Budget: US$ 25 hard cap, own ledger `ledger.jsonl` (enforced in code: every call reserves its per-call maximum; the ledger total can never exceed US$ 25). Spent before this file: ≈ US$ 1.86 on harness smoke/cost probes (see "Exploratory and void runs").

## Question
At matched budget (same model and effort, same per-run call and USD ceiling), does each bio-inspired mechanism reach a higher accepted-outcome rate, a lower cost per accepted task, lower latency or fewer false successes than the best artificial agent structure — and on which task types (mid-size 3–5 packages vs multi-repository 8–14 packages)?

## Model and effort
Claude Haiku 5.5, low effort, for every call of every arm (parameters `LAB_MODEL`, `LAB_EFFORT`; the harness is model-agnostic). Headless Claude Code, tools disabled, isolated temp directory, no session persistence.

## Tasks
`lab/build-tasks.mjs` merges validated Observatory packages (b01–b21, c01–c17) into repositories; `lab/validate.mjs` checks that the buggy repository fails the hidden suite and that the reference passes both suites (32/32 valid: 22 mid-size `lm*`, 8 multi-repo `lx*` with 8–14 packages, 2 cost-probe `lp*`). Per package: `probe/` = the package's original visible tests (the only signal agents see), `final/` = its hidden tests (scoring only). On every task each package starts with failing probe tests (no package is blind at the start); a probe pass does not imply a hidden pass, so false success is measurable. Task statements are the legacy ones (mostly Portuguese). Several tasks share packages (limit: tasks are not independent).

**Calibration and selection (fixed now).** Run SOLO once on each of the 30 candidate tasks (22 mid + 8 multi; phase `calib`, same limits). A task is *eligible* if that SOLO run did not reach acceptance. `lab/select-tasks.mjs` orders eligible tasks by a seeded shuffle (seed 7). **Core set** = first 5 eligible multi-repo + first 6 eligible mid-size tasks, run interleaved (multi, mid, mid, …); **extension set** = remaining eligible tasks, run only while budget allows. Tasks where calibration-SOLO is accepted are excluded as ceiling tasks (listed in the report). If fewer than 5 multi-repo tasks are eligible, ceiling multi-repo tasks fill the gap and are labelled. Calibration runs are not part of the main analysis (the main SOLO run is a fresh sample, so selection on calibration does not favour or hurt any arm). The 30 validated candidates are the task set delivered; the number actually run in the main phase is set by budget and is reported.

## Arms (15; each mechanism also runs alone)
Artificial: **SOLO** (one agent, whole repo, ≤ 2 probe-driven repairs); **ORCH** (planner → one solver per group → integrator); **PIPE** (solver → critic → revision); **VOTE3** (3 independent whole-repo candidates, choose by probe, ties by agreement); **DEBATE** (2 agents × 2 rounds + judge); **TODAY** (coordinator briefs, specialists with full repo context, coordinator review, second specialist round).
Bio-inspired (engineering analogies, not claims that the biology transfers): **CTRL** (division of labour: one owner per package, package-only context, re-activated only while its probe fails, ≤ 2 repairs); **GATE** (adaptive activation: one agent first, package owners only for failing packages, ≤ 2 rounds); **ELASTIC** (clonal expansion/contraction: solo seed, failing packages get 1, 2, 4 clones in rounds, passing packages retire); **THRESH-hab** (response threshold: stimulus s = max(0.15, probe-fail fraction); workers with θ = [0.1, 0.5, 0.9] below s respond; a worker that fails to improve a package raises its θ for it by 0.3; ≤ 3 rounds); **STIG-evap** (stigmergy: no messages; marks per package = 0.5 + failing probe tests; each round the ⌈k/3⌉ strongest marks get a worker; marks evaporate ρ = 0.5 and failing tests re-deposit; ≤ 4 rounds); **QUORUM-q2** (2 scouts per package; a package commits when 2 independent candidates pass its probe; otherwise max(1, round(2·quality)) recruits revise only the best candidate; ≤ 2 recruitment rounds).
Ablations: **THRESH-fixed** (no habituation), **STIG-noevap** (ρ = 0), **QUORUM-q1** (1 scout, q = 1).
Definitions are in `lab/arms.mjs`. Mechanism arms act on the probe signal only; a package whose probe passes gets only baseline attention, so hidden bugs behind a passing probe are a known blind spot for every arm.

**Matched ceiling (same for all arms).** Calls ≤ 2k + 4 (k = packages); USD ≤ 0.02 + 0.0001 × LOC of the repository (≈ 5× the expected cost of one whole-repo SOLO chain, fitted on the cost probe). The ceiling is checked before every call (completed spend + in-flight estimates); an arm that reaches it stops and submits its best files so far (`budgetHit`), which counts as its result. Arms whose pattern needs more than the ceiling (notably TODAY on large repositories) are truncated by design of the matched-budget question; unconstrained costs from the probe are reported for context.

## Outcomes
Primary: **cost per accepted task** (accepted = every `final` test passes) with the **acceptance rate**. Secondary: false success (probe all-pass, final not), critical-path latency (sequential stages add, parallel branches take the max; local test time included), calls, input/output tokens, inter-agent messages, per-package accepted fraction, budget hits. Repetitions: 1 per (task, arm) — the budget does not allow more; no run is repeated except infrastructure failures (a run whose model call failed twice, `callFailures > 0`, is re-run once and replaces the failed run; budget-hit runs are never re-run).

## Order and stopping
Task-major: all 15 arms of a task run before the next task, in the order given by the selection script. Dispatch stops when the ledger reaches US$ 24.0 (hard cap US$ 25 in code) or the phase cap; the analysis uses only tasks completed by all 15 arms.

## Analysis and decision rule (stated before running)
`lab/analyze.mjs`: Wilson 95% CI for acceptance; task-level bootstrap (4000, seeded) for cost per accepted and for paired contrasts. **Reference** = the artificial arm with the most accepted runs (ties: lower cost per accepted); a second contrast uses SOLO. For each bio mechanism M (CTRL, GATE, ELASTIC, THRESH-hab, STIG-evap, QUORUM-q2) versus the reference R: ΔA = acceptance(M) − acceptance(R); ρ = cost per accepted (M) / (R).
- **BETTER**: (lower 95% bound of ΔA ≥ −0.10 and upper 95% bound of ρ < 1 and ρ ≤ 0.80) or (lower bound of ΔA > 0 and upper bound of ρ ≤ 1.25).
- **WORSE**: upper bound of ΔA < 0, or (lower bound of ρ > 1.25 and not lower bound of ΔA > 0).
- Otherwise **INCONCLUSIVE (no detectable difference)**.
The 0.80 threshold reflects the run-to-run noise measured earlier (~20% between identical policies at this scale). Ablations use the same rule on the pair (first arm vs second). Task-type contrasts (mid vs multi) are exploratory because n per tier is small. Choosing R from the same data favours R slightly (conservative for BETTER).

## Anticipated limits
One small model at low effort; the first verifier problem is by construction (hidden tests vs probe); few tasks (budget-limited), legacy task statements, shared packages across tasks, one repetition, TEAM-TODAY is an emulation, and mechanism analogies are engineering reconstructions. The result says nothing about other models, larger tasks needing different tools or credentials, or long-running work.

## Exploratory and void runs (not in the analysis)
`runs-smoke.jsonl` (all 15 arms on `lp01`/`lp02`; cost probe, ≈ US$ 1.2) and the first two smoke attempts moved to `void/` (an initial harness bug sent calls without the output-format system prompt, so arms produced no files; ≈ US$ 0.43, counted in the ledger). After the cost probe: THRESH thresholds changed from [0.05, 0.35, 0.65] to [0.1, 0.5, 0.9] (baseline 0.15), a budget-aware plan fit was added (no order-dependent truncation), and the matched ceiling was set to the formula above. No main-phase outcome informed these choices.

## Code hashes at registration (sha256, first 16 hex)
lib.mjs 62882dcb62ec7ca0 · arms.mjs 0b62d078a2699e89 · run.mjs 19d5c1d5af2fbdd1 · analyze.mjs ffbcd54362e91d79 · build-tasks.mjs 2825eaaca4e79a85 · validate.mjs 74f870c6c9354e17 · select-tasks.mjs 4eb41ac4af390c8f · ../lib/prompt.mjs efd7901796d33378 · ../lib/testrun.mjs abe8e6b83efbb7ee

---
## Amendment 1 (2026-11-08, after calibration, BEFORE any main-phase run)
Reasons are cost- and budget-driven; no main-phase outcome existed. Calibration (SOLO ×1 per candidate) cost ≈ US$ 4.8 (ledger US$ 6.65 at this point; budget left ≈ US$ 18.3).
1. **Long-context price tier.** Calibration showed a ≈ 5× jump in price per call when a prompt exceeds ≈ 100k input tokens (e.g. lx05: 124k tokens in, 15k out → US$ 0.225; lx01: 88k in, 36k out → US$ 0.044), and calls that hit the per-call guard return nothing while still costing up to US$ 0.30. Whole-repo arms cannot run 15 structures on such repositories within the budget. **lx04, lx05, lx06, lx08 are retired** (whole-repo prompt > 195k chars; their calibration data stay in `runs-calib.jsonl` and in the report) and replaced by **lx09–lx12** (8–9 packages, prompt 132–177k chars); lx09–lx12 were calibrated the same way. The delivered validated set is the 30 non-retired candidates (22 mid, 8 multi) plus the 4 retired tasks (36 valid in total). This is itself a finding: package-only context avoids the price tier that whole-repo prompts hit.
2. **Order.** Core tasks are interleaved multi, mid, multi, mid, … (not multi, mid, mid) so that a stop at the budget leaves ≥ 4 multi-repo tasks.
3. **Task reserve.** `run.mjs` starts a task only if the expected cost of its 15 arms (multi US$ 3.0, mid US$ 1.4) fits in the remaining budget, so the analysed set contains only complete tasks. Dispatch stop: ledger ≥ US$ 24.0 less in-flight reservations; the US$ 25 cap is also enforced per call in code.
4. **Selection result** (`main-tasks.json`, rule unchanged): 18 of 30 candidates eligible (SOLO calibration not accepted); core = lx10, lx12, lx02, lx01, lx11 (multi) and lm03, lm01, lm05, lm04, lm16, lm13 (mid); extension = lm06, lm19, lm12, lm11, lm21, lm22, lm08. Run order: lx10 lm03 lx12 lm01 lx02 lm05 lx01 lm04 lx11 lm16 lm13 lm06 … ; ceiling tasks excluded: lm02, lm07, lm09, lm10, lm14, lm15, lm17, lm18, lm20, lx03, lx07, lx09. Expected: the budget completes ≈ 9–10 tasks, not the full core; the report states the realised number.
Code hashes at this amendment: lib.mjs 62882dcb62ec7ca0 · arms.mjs 0b62d078a2699e89 · run.mjs 2cff1eee3b7a5f76 · analyze.mjs ffbcd54362e91d79 · build-tasks.mjs 50be11257fe2e497 · select-tasks.mjs 8224e9676e8f7453.
