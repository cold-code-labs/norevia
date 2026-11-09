---
id: obs-lab006-allocator-v0
title: "LAB-006 — Norevia Allocator v0 and its evaluation"
area: observatory
evidence: local-validation
tags: [lab-006, allocator, split-by-size, frontier, observatory, haiku-5-5]
related: [obs-lab006-prereg, obs-lab003-split-retry-memory, obs-lab004-massive-swarm, H-04, H-11, H-14]
updated: 2026-11-09
summary: "A reusable policy (solo below 3 parts, owners per part above, repair only failing parts, stop when resolved, verification gate, budget ceiling) evaluated against SOLO, a central orchestrator, TEAM-TODAY and always-split on repository repair and micro-function bundles. It is the cheapest per accepted task on repository work from 3 parts, but a grouped orchestrator accepts more and the split rule is wrong when parts are tiny."
data: [results/charts/lab006-repo-by-size.json, results/charts/lab006-micro-by-size.json, results/charts/lab006-pooled.json]
---
# LAB-006 — Norevia Allocator v0 and its evaluation

Norevia Lab · 2026-11-09 · Claude Haiku 5.5 through the Anthropic API · `PREREG.md` written before the main runs · **ledger US$ 28.40 counted of the US$ 30 cap** (counted = cost × 1.5; ≈ US$ 18.9 at the price table, not an invoice; 5,671 model calls; 780 evaluation runs; 19 failed calls in the ledger, of which 17 ended as failed calls inside a run) · 4 repetitions.

> **Charts on this page, in order.** Repository tasks by number of packages (1, 3, 8, 15): acceptance rate, cost per accepted task, median critical-path latency, false success, one series per arm; then micro-function bundles by number of parts (3, 8, 15); then pooled repository tasks and pooled bundles.

## The Allocator (`allocator/`, documented in its README, 7 unit tests, zero dependencies, model-agnostic)
Decide solo if the task has < 3 independent parts, team otherwise; team = one owner per part with part-only context, in parallel; free baseline check of the starting state fed to first-pass agents; **repair only failing parts** with their feedback and previous candidate (≤ 2 rounds, kept only if the check score does not drop, files merged); **stop as soon as every part passes** (no patrol); **verification gate** (accepted only if every part passed its visible check, otherwise reported unverified); per-task **budget ceiling** before every call; every decision logged with its reason. No type memory, no voting without a check.

## Answer in brief
1. **On repository work from 3 packages the Allocator is the cheapest per accepted task and fast, but not the most accurate.** Pooled over the 15 repository tasks (60 runs per arm): cost per accepted task US$ 0.029 (Allocator) vs 0.034 (central orchestrator ORCH), 0.055 (SOLO), 0.150 (TEAM-TODAY); acceptance 57/60 (0.95) vs ORCH 60/60 (1.00) vs SOLO 50/60 (0.83) vs TEAM-TODAY 51/60 (0.85); median critical path 63 s vs 104 s (ORCH), 99 s (SOLO), 200 s (TEAM-TODAY).
2. **It beats SOLO exactly where LAB-003 said it would, and by a lot at 15 packages**: k = 15 acceptance 8/8 vs SOLO 2/8, cost per accepted US$ 0.085 vs 0.54 (the single agent's answer hits the output cap); k = 3 cost ×0.86 at equal acceptance; k = 1 identical to SOLO (the policy stays solo).
3. **A grouped central orchestrator is a strong baseline that I did not beat on accuracy**: ORCH (planner → ⌈k/3⌉ group solvers → integrator only for failing parts) accepted 60/60 repository runs against the Allocator's 57/60 at ≈ 16% higher cost per accepted task and 1.7× the latency; at k = 8 the gap is 12/12 vs 9/12 (Δ −0.25, interval includes 0, and 3 of the Allocator's 3 repository false successes are at k = 8 vs 0 for ORCH).
4. **Where it loses outright: tiny parts.** On micro-function bundles, splitting into one call per part is no help when the context is tiny: at 3 parts the Allocator accepted 30/40 vs 36/40 for SOLO and ORCH (cost per accepted ×1.33), at 8 parts 22/32 vs 25/32 for ORCH (×1.19); pooled, ORCH accepted 78/96 (0.81) vs 66/96 (0.69) for the Allocator, at a slightly lower cost per accepted (US$ 0.0009 vs 0.0011) — but ORCH has 11 false successes in 96 runs against 5. The "split at ≥ 3 parts" rule comes from repository tasks where splitting shrinks a very large context; for tiny parts the threshold should depend on context size, not on the number of parts.
5. **The Allocator is, in effect, ALWAYS-SPLIT with a solo path for k < 3**: the two are statistically indistinguishable at every k ≥ 3 (same code path), and ALWAYS-SPLIT is nominally ahead by 0–4 accepted runs, which is noise; at k = 1 the solo path saves nothing measurable (cost ×1.02). TEAM-TODAY is dominated everywhere (3–10× the cost, lower acceptance).

## Results (4 repetitions; 39 tasks × 5 arms; cost per accepted task in US$; acceptance with Wilson 95%; latency = median critical path)
**Repository tasks (LAB-003 builder, strengthened probe)**
| Packages (tasks) | Arm | Accepted | Cost per accepted | False success | Critical path (s) | Calls |
|---|---|---:|---:|---:|---:|---:|
| k = 1 (6) | SOLO / ALWAYS-SPLIT / ORCH / ALLOCATOR | 24/24 each | 0.0060 / 0.0058 / 0.0060 / 0.0059 | 0 | 25 / 27 / 23 / 23 | 1 / 1 / 2 / 1 |
| | TEAM-TODAY | 24/24 | 0.0235 | 0 | 175 | 4 |
| k = 3 (4) | SOLO / ORCH | 16/16 each | 0.0175 / 0.0184 | 0 | 112 / 123 | 1 / 2 |
| | ALWAYS-SPLIT / **ALLOCATOR** | 16/16 each | 0.0150 / **0.0150** | 0 | 60 / 56 | 3 |
| | TEAM-TODAY | 15/16 | 0.0656 | 0 | 219 | 8 |
| k = 8 (3) | SOLO | 8/12 | 0.157 | 0 | 638 | 2.6 |
| | ALWAYS-SPLIT / **ALLOCATOR** | 11/12 / **9/12** | 0.053 / **0.065** | 1 / **3** | 74 / 71 | 8 |
| | ORCH | **12/12** | 0.056 | 0 | 150 | 4 |
| | TEAM-TODAY | 10/12 | 0.324 | 0 | 275 | 18 |
| k = 15 (2) | SOLO | 2/8 | 0.542 | 0 | 638 | 3 |
| | ALWAYS-SPLIT / **ALLOCATOR** | 6/8 / **8/8** | 0.115 / **0.085** | 2 / 0 | 79 / 80 | 15 |
| | ORCH | 8/8 | 0.113 | 0 | 355 | 5.9 |
| | TEAM-TODAY | 2/8 | 1.441 | 0 | 165 | 16 (8 hit the ceiling) |
| **All repository (15)** | SOLO | 50/60 | 0.0552 | 0 | 99 | 1.6 |
| | ALWAYS-SPLIT | 57/60 | 0.0290 | 3 | 61 | 4.8 |
| | **ALLOCATOR** | **57/60** | **0.0290** | 3 | **63** | 4.8 |
| | ORCH | 60/60 | 0.0337 | 0 | 104 | 2.9 |
| | TEAM-TODAY | 51/60 | 0.1504 | 0 | 200 | 9.5 |
**Micro-function bundles (LAB-004 pool parts solved in ≥ 2 of 3 calibration attempts)**
| Parts (bundles) | SOLO | ALWAYS-SPLIT | ORCH | TEAM-TODAY | **ALLOCATOR** |
|---|---|---|---|---|---|
| 3 (10) accepted | 36/40 | 31/40 | 36/40 (4 false) | 27/40 | **30/40** |
| 8 (8) accepted | 16/32 | 24/32 | 25/32 (5 false) | 14/32 | **22/32** (2 false) |
| 15 (6) accepted | 13/24 | 15/24 | 17/24 (2 false) | 8/24 | **14/24** (3 false) |
| All (24) accepted | 65/96 | 70/96 | 78/96 (11 false) | 49/96 | **66/96** (5 false) |
| All, cost per accepted (US$) | 0.0016 | 0.0010 | 0.0009 | 0.0187 | **0.0011** |
| All, critical path (s) | 4.8 | 2.7 | 4.1 | 19.3 | **2.8** |

## Position on the frontier and where it loses
- **Frontier (cost per accepted × acceptance × median latency, point estimates):** repository k = 1, 3, 15: the Allocator is non-dominated; k = 8: non-dominated together with ALWAYS-SPLIT and ORCH; pooled repository: {ALWAYS-SPLIT, ORCH} (Allocator tied with ALWAYS-SPLIT within noise, behind ORCH on acceptance, ahead on cost and latency); micro bundles: not on the frontier at 3 and 8 parts (SOLO and ORCH ahead), on it at 15 parts.
- **By the pre-registered rule** (LOSES if the cost ratio's lower bound > 1.10 or the acceptance difference's upper bound < −0.10; WINS if the ratio's upper bound < 0.90 with no acceptance loss > 0.10): the Allocator **WINS** against TEAM-TODAY on pooled repository tasks, on pooled bundles and at k = 1, 3 and 15; **WINS** against SOLO at k = 15 (ratio 0.16) and against ORCH at k = 15 (ratio 0.75); every other comparison is a TIE under the rule — with only 2–3 tasks per cell and 4 repetitions the intervals are wide, and the rule's thresholds are conservative. **No comparison reaches LOSES**, although the point estimates above show where it is behind (acceptance at k = 8 and on micro bundles of 3 and 8 parts).
- **Decisions logged** (Allocator, 156 runs): solo in 24/24 runs of 1 part; team in 100% of runs of ≥ 3 parts; repair rounds: 21 in 56 runs at 3 parts, 18 in 44 at 8, 18 in 32 at 15; stop-when-resolved fired in 46/56, 36/44, 25/32 runs; the verification gate refused 10, 8 and 7 runs respectively (result reported unverified instead of accepted); no budget ceiling was hit by the Allocator (8 hits, all TEAM-TODAY at k = 15).

## What I would change in v1 (not done, not tested)
Choose between solo and team by **context size** (tokens a part needs) and not by part count; group small parts (≈ 3 per call, as ORCH does) before splitting further; give owners a cross-part check at k = 8 (3 false successes where ORCH had none). These are hypotheses from this evaluation, not results.

## Limits and incidents (disclosed)
1. **Two kinds of task only** (code repair on a fixed pool of 38 packages; synthetic micro-functions), one cheap model at default sampling; cells k = 8 and k = 15 have 3 and 2 tasks; tasks share packages across tasks; bundles use parts that were solvable in the LAB-004 calibration (selection from calibration only), so acceptance is measurable but easier than the whole pool. Intervals are task-level bootstrap and wide; 4 repetitions.
2. **ORCH and TEAM-TODAY are my reconstructions** (LAB-001-style), not OpenBot itself; ORCH is uncapped and only calls its integrator when a check still fails, which makes it a strong baseline.
3. **Defects found and fixed before the registered runs** (while smoke-testing, US$ 2.1 counted): repairs replaced a package's candidate by only the returned files (fixed with the `merge` hook, used by every arm); first-pass agents did not receive the starting-state check feedback LAB-003 owners had (added as `baseline`, given to every arm); the API layer disabled thinking by default (now per request: off for micro-functions, model default for repository tasks, as in LAB-004 and LAB-003).
4. **A 4th repetition** was run after three (allowed by the pre-registration, stated in it); nothing else changed between repetitions.
5. **Latency** is critical-path time from provider fetch durations, not wall clock; repository calls use the model default thinking so their latency is higher than micro calls by design.
6. Cost from a price table, not an invoice; the counted ledger includes a 1.5 safety factor.

## Files (relative to the repository root)
Library `allocator/` (`index.mjs`, `README.md`, `test/`). Evaluation `observatory/lab006/` (`adapters.mjs` repository and micro adapters, `arms.mjs`, `run6.mjs`, `analyze6.mjs`, `api.mjs`). Results `results/lab006/`: `PREREG.md`, `REPORT.md`, `runs-main.jsonl` (780 runs), `decisions-main.jsonl` (the Allocator's decision logs), `runs-smoke*.jsonl`, `summary.json`, `ledger.jsonl.gz`. Reproduce: `ANTHROPIC_API_KEY_FILE=… node observatory/lab006/run6.mjs --reps 4`, then `node observatory/lab006/analyze6.mjs`; library tests `cd allocator && npm test`.
