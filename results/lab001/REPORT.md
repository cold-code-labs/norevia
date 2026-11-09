---
id: obs-lab001-bio-vs-artificial
title: "LAB-001 — Biological swarm mechanisms vs artificial agent structures"
area: observatory
evidence: local-validation
tags: [lab-001, bio-vs-artificial, observatory, haiku-5-5]
related: [H-02, H-06, H-07, H-08, H-13, obs-lab001-prereg]
updated: 2026-11-08
summary: "15 agent structures (6 artificial, 9 bio-inspired or ablations) on multi-package repair tasks at matched budget. The pre-registered outcome was degenerate (false success dominates), so the verdicts come from an exploratory per-package analysis."
data: [results/charts/lab001-primary-by-arm.json, results/charts/lab001-packages-by-arm.json]
---
# LAB-001 — Biological swarm mechanisms vs artificial agent structures (report)

> **Charts on this page, in order.** Pre-registered outcome by structure (1 accepted tasks, 2 false success, 3 mean cost per run, 4 median latency); exploratory per-package analysis (5 package acceptance rate, 6 hidden-test pass rate, 7 cost per accepted package, 8 median latency). Bars are the 15 structures, from SOLO to the ablations, in the order of the table below. Raw runs, ledger and transcripts are in the repository folder `results/lab001/`.

Norevia Lab · 2026-11-08 · Claude Haiku 5.5, low effort, every call of every arm · ledger **US$ 24.72 of the US$ 25 cap** (`ledger.jsonl`, 1,569 calls) · pre-registration `PREREG.md` (+ Amendment 1) written before the calibration and main runs.

## Result in brief
1. **The pre-registered primary outcome is degenerate.** Acceptance needs every hidden test of every package to pass. Across 9 tasks, 13 of 15 arms accepted **0** tasks (THRESH-hab 1, THRESH-fixed 3); cost per accepted task is undefined for them. Under the pre-registered rule every mechanism is **INCONCLUSIVE** (`summary.json`). The dominant failure is the same as in every earlier result: the probe (agent-visible tests) reaches all-pass in 9/9 tasks for most arms while hidden tests still fail (false success: 9/9 for SOLO, ORCH, CTRL, GATE, ELASTIC, STIG, QUORUM).
2. **Exploratory secondary outcome** (not pre-registered as primary; added after seeing 0/9): the fraction of packages whose hidden suite fully passes, and cost per accepted package (59 packages in the 9 tasks). On it, the picture is clearer — see the tables. Use it as directional evidence only.
3. **Best artificial structure: ORCH** (central planner → one solver per package group → integrator): 61% of packages accepted at US$ 0.0156 per accepted package. **Best bio-labelled arm: THRESH (response threshold)**: 81% (habituating) and 85% (fixed thresholds), i.e. about +20 points over ORCH (CI +7 to +39) at ≈ 1.3–1.6× its cost per accepted package.
4. **Most of that gain is not the threshold.** A non-bio control added after the main run (CTRL+PATROL2: CTRL plus two extra review rounds on *every* package, whatever the stimulus) reaches 76% — +20 points over CTRL alone. THRESH adds only +5 points over the control (CI −3 to +15, not detectable) but does it at **0.67× the control's cost per accepted package** (CI 0.55–0.76). So: probe-silent re-review explains the accuracy; the threshold/habituation mechanism explains a cost saving, not extra accuracy.
5. **Everything else shows no accuracy edge over the best artificial arm.** Division of labour (CTRL), adaptive activation (GATE), clonal expansion (ELASTIC), stigmergy and quorum are at or below ORCH on packages accepted. Their advantages are cost and latency relative to SOLO and to the heavy structures (CTRL: 56 s median critical path vs 187 s for SOLO, 0.37× SOLO's cost per package).

## Setup (as pre-registered; deviations below)
- **Tasks.** 36 validated repositories built by `lab/build-tasks.mjs` from Observatory packages: 22 mid-size (3–5 packages), 12 multi-repo (8–14 packages), 2 cost probes (buggy fails hidden, reference passes both: 36/36). Per package, `probe/` = the original visible tests (agent-visible signal), `final/` = hidden tests (scoring only). 4 multi-repo tasks (lx04, lx05, lx06, lx08) were retired after calibration: their whole-repo prompts exceed ≈100k tokens and the price per call jumps ≈5× there (Amendment 1).
- **Selection.** SOLO calibration run once on 30 candidates; eligible = not accepted (18); 12 ceiling tasks excluded (`main-tasks.json`). Main run order interleaved multi/mid; the budget completed **9 tasks: 5 multi-repo (lx10, lx12, lx02, lx01, lx11; 8–9 packages) and 4 mid-size (lm03, lm01, lm05, lm04; 4 packages)** — fewer than the 11-task core planned. One repetition per (task, arm).
- **Arms (15 + 1 exploratory control).** Artificial: SOLO, ORCH, PIPE, VOTE3, DEBATE, TODAY. Bio-inspired: CTRL (division of labour), GATE (adaptive activation), ELASTIC (clonal expansion), THRESH-hab (response threshold, habituation), STIG-evap (stigmergy, evaporation), QUORUM-q2 (scouts, recruitment, cross-inhibition). Ablations: THRESH-fixed, STIG-noevap, QUORUM-q1. Each mechanism runs alone. Definitions in `lab/arms.mjs` and `PREREG.md`.
- **Matched ceiling for every arm:** calls ≤ 2k+4, USD ≤ 0.02 + 0.0001 × LOC, checked before every call. TODAY hit it in 9/9 runs and DEBATE in 6/9 (their patterns need more than the ceiling on these repositories), so they are measured *under matched budget*, not in their natural form.

## Pre-registered result (primary: cost per accepted task)
| Arm | Accepted tasks | False success | $/accepted task | Calls | Median latency (s) |
|---|---:|---:|---:|---:|---:|
| SOLO / ORCH / PIPE / VOTE3 / DEBATE / TODAY | 0/9 each | 9 / 9 / 5 / 4 / 7 / 3 | — | 1.8 / 4.6 / 3.0 / 3.0 / 4.2 / 8.8 | 187 / 129 / 355 / 224 / 412 / 345 |
| CTRL / GATE / ELASTIC / STIG-evap / QUORUM-q2 | 0/9 each | 9 each | — | 6.6 / 5.2 / 5.1 / 7.1 / 13.9 | 56 / 235 / 213 / 125 / 62 |
| THRESH-hab | 1/9 (0.02–0.44) | 8 | 0.99 | 14.6 | 146 |
| THRESH-fixed (ablation) | 3/9 (0.12–0.65) | 6 | 0.41 (0.19–1.35) | 17.1 | 203 |
Reference by the pre-registered tie rule: SOLO (all tied at 0). Every contrast: **INCONCLUSIVE (no detectable difference)**. With 9 tasks, one repetition and a 0/9 floor, this experiment could not rank the arms on accepted tasks.

## Exploratory result (packages accepted; 9 tasks, 59 packages; bootstrap over tasks)
| Arm | Packages accepted | Rate (95% CI) | Hidden-test pass | $ / accepted package (95% CI) | Mean $ per run | Calls | Median latency (s) |
|---|---:|---|---:|---|---:|---:|---:|
| SOLO | 29/59 | 0.49 (0.36–0.60) | 0.93 | 0.039 (0.026–0.050) | 0.126 | 1.8 | 187 |
| **ORCH** | 36/59 | 0.61 (0.43–0.75) | 0.96 | **0.0156** (0.012–0.023) | 0.062 | 4.6 | 129 |
| PIPE | 24/59 | 0.41 (0.28–0.56) | 0.89 | 0.044 (0.033–0.063) | 0.116 | 3.0 | 355 |
| VOTE3 | 16/59 | 0.27 (0.16–0.40) | 0.82 | 0.105 (0.057–0.204) | 0.187 | 3.0 | 224 |
| DEBATE | 32/59 | 0.54 (0.37–0.73) | 0.91 | 0.092 (0.059–0.142) | 0.328 | 4.2 | 412 |
| TODAY | 29/59 | 0.49 (0.35–0.63) | 0.92 | 0.081 (0.064–0.117) | 0.261 | 8.8 | 345 |
| CTRL | 33/59 | 0.56 (0.42–0.67) | 0.96 | 0.0145 (0.011–0.021) | 0.053 | 6.6 | 56 |
| GATE | 32/59 | 0.54 (0.43–0.64) | 0.94 | 0.027 (0.016–0.043) | 0.096 | 5.2 | 235 |
| ELASTIC | 31/59 | 0.53 (0.36–0.67) | 0.94 | 0.024 (0.017–0.031) | 0.084 | 5.1 | 213 |
| **THRESH-hab** | 48/59 | 0.81 (0.73–0.88) | 0.99 | 0.0207 (0.019–0.023) | 0.110 | 14.6 | 146 |
| THRESH-fixed | 50/59 | 0.85 (0.76–0.93) | 0.99 | 0.0244 (0.021–0.030) | 0.135 | 17.1 | 203 |
| STIG-evap | 30/59 | 0.51 (0.37–0.62) | 0.95 | 0.0139 (0.011–0.019) | 0.046 | 7.1 | 125 |
| STIG-noevap | 31/59 | 0.53 (0.39–0.64) | 0.95 | 0.0155 (0.013–0.020) | 0.053 | 7.8 | 148 |
| QUORUM-q2 | 33/59 | 0.56 (0.36–0.70) | 0.96 | 0.0247 (0.020–0.037) | 0.091 | 13.9 | 62 |
| QUORUM-q1 | 31/59 | 0.53 (0.36–0.65) | 0.95 | 0.0128 (0.010–0.020) | 0.044 | 6.9 | 57 |
| *CTRL+PATROL2 (control, non-bio, exploratory)* | 45/59 | 0.76 (0.63–0.86) | 0.98 | 0.031 (0.026–0.040) | 0.155 | 17.1 | 230 |

By tier (packages accepted / $ per accepted package): **multi-repo (5 tasks)** — ORCH 0.70 / 0.013; THRESH-hab 0.84 / 0.020; THRESH-fixed 0.86 / 0.022; CTRL 0.63 / 0.013; QUORUM-q2 0.70 / 0.020; SOLO 0.51 / 0.045; VOTE3 0.21 / 0.147; TODAY 0.54 / 0.073. **Mid-size (4 tasks)** — THRESH-fixed 0.81, THRESH-hab 0.75, DEBATE 0.69 (at $0.054 per package), SOLO 0.44, ORCH 0.38, CTRL 0.38, QUORUM-q2 0.19. Four mid tasks are too few to rank arms; this tier is exploratory.

## Verdict per mechanism (exploratory package analogue of the pre-registered rule; reference = ORCH, second contrast = SOLO)
| Mechanism (arm) | Accuracy vs ORCH (Δ points, 95% CI) | Cost per package vs ORCH | Versus SOLO | Verdict |
|---|---|---|---|---|
| Response threshold + habituation (THRESH-hab) | **+20 (+7 to +39)** | 1.33× (0.92–1.64) | +32 points, 0.53× cost | **Higher accuracy; cost not shown ≤ 1.25× → inconclusive on the combined rule.** Most of the accuracy comes from re-review, not from the threshold (see control). |
| Division of labour / single owner (CTRL) | −5 (−16 to +6) | 0.93× (0.75–1.13) | +7, 0.37× cost | **Equivalent to ORCH; much cheaper and faster than SOLO.** |
| Adaptive activation (GATE) | −7 (−16 to +2) | 1.73× (1.21–2.12) | +5, 0.69× | Inconclusive; no edge over ORCH. |
| Clonal expansion (ELASTIC) | −9 (−22 to +4) | 1.56× (0.95–2.03) | +3, 0.62× | Inconclusive vs ORCH; cheaper than SOLO at equal accuracy. |
| Stigmergy (STIG-evap) | −10 (−25 to +6) | 0.89× (0.72–1.09) | +2, 0.36× | Inconclusive; cheapest per package but no accuracy gain. |
| Quorum, q = 2 (QUORUM-q2) | −5 (−22 to +14) | 1.58× (1.22–2.06) | +7, 0.63× | Inconclusive; costlier than ORCH for the same accuracy. |
**No bio mechanism beat the best artificial structure on the pre-registered outcome** (nothing was detectable). On the exploratory outcome only THRESH shows higher accuracy than ORCH, and the control shows that a non-bio extra-review policy captures most of it.

**Ablations** (exploratory package analogue): evaporation vs none (STIG) — Δ −2 points (−14 to +11), cost ×0.90 (0.77–1.10): no detectable effect. Habituating vs fixed thresholds (THRESH) — Δ −3 points (−16 to +6), cost ×0.85 (0.73–0.98): habituation saves ~15% of cost per package with no detectable loss. Quorum q = 2 vs q = 1 — Δ +3 points (−9 to +19), cost ×1.93 (1.44–2.38): the second scout doubles the cost for no detectable gain.

## What this does and does not say
- At this scale (one small model at low effort, one repetition, 9 tasks), *how many independent, package-scoped reviews each package gets, and whether review continues after the visible tests pass*, mattered more than which structure coordinated the agents. Single-owner package scoping (CTRL, ORCH) removes most of the cost and latency of whole-repository structures; whole-repository voting (VOTE3), debate and the TEAM-TODAY pattern were the least efficient under a matched ceiling.
- Hidden defects behind a passing probe remained the limit for every arm; no coordination scheme can find what neither the tests nor the specification re-read exposes. Verifier strength, not swarm structure, still dominates (fourth time in this archive).
- The bio-inspired labels describe engineering analogues. THRESH's gain is explained by baseline stimulus (patrol) and multiple recruits; those could be adopted without any biological framing.
- Not shown: any effect with a stronger model, tasks needing different tools or credentials, longer runs, or more repetitions. Task acceptance needs a larger sample (or a softer criterion fixed in advance) to be informative.

## Deviations, incidents and limits (all disclosed)
- **Primary outcome degenerate** (above); the package-level analysis is exploratory and was written after seeing it. The control arm CTRL+PATROL2 was added after the main run and is labelled exploratory (`runs-expl.jsonl`).
- **Realised design:** 9 of the planned 11 core tasks (budget), 1 repetition, 5 multi-repo + 4 mid-size. The validated deliverable is 36 tasks (≥ 25, ≥ 5 multi-repo); the main run used 9.
- **Amendment 1** (before the main run): four multi-repo tasks retired for the ≈5× price jump above ≈100k input tokens (itself a finding: package-only context avoids that price tier); order interleaved; task reserve added.
- **Harness bug, voided:** the first two smoke attempts sent calls without the output-format system prompt; arms produced no files (≈ US$ 0.43, in `void/`, counted in the ledger). Fixed before any calibration or main run.
- **Cap-guard incident:** the per-call reservation guard refused four of lx11's runs near the cap (spend 22.6, 8 calls in flight). Those four were re-run afterwards with lower concurrency (partial attempts killed by a timeout are in the ledger). No outcome influenced this.
- **Statistics:** 9 tasks, task-level bootstrap, several tasks share packages (not independent), a package-level rate treats 59 packages as clustered by task. CIs are wide; the "best artificial arm" was chosen from the same data (slightly favours the reference). Hidden-test failures can be test-suite strictness, not only agent error.
- **Budget:** every call reserves its per-call maximum in code; the ledger can never exceed US$ 25.

## Files (relative to the repository root)
- Tools: `observatory/lab/` — `build-tasks.mjs`, `validate.mjs`, `lib.mjs` (model layer, ledger, hard cap, Run API with per-run ceiling and critical-path latency), `arms.mjs` (16 arms as plugins), `run.mjs` (resumable runner), `select-tasks.mjs`, `analyze.mjs` (pre-registered analysis), `analyze-secondary.mjs` (exploratory), `tasks/` (36 validated repositories + `index.json`). Code hashes: lib 62882dcb62ec7ca0, run 2cff1eee3b7a5f76, analyze ffbcd54362e91d79 (unchanged since registration); arms 4f043bd2f4ce1942 (only change since the main run: PATROL2 appended).
- Results: `results/lab001/` — `PREREG.md`, `runs-main.jsonl` (135 runs), `runs-expl.jsonl` (9), `runs-calib.jsonl` (34), `runs-smoke.jsonl`, `summary.json` (pre-registered analysis), `summary-secondary.json` (exploratory, per task and tier), `main-tasks.json`, `ledger.jsonl`, `raw/` (transcripts and final files per run, ≈29 MB), `void/`.
- Reproduce: `node observatory/lab/run.mjs --phase main --tasks @results/lab001/main-order.json --arms all --jobs 6` then `node observatory/lab/analyze.mjs --phases main` and `node observatory/lab/analyze-secondary.mjs`.
