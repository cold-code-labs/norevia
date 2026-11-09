---
id: obs-lab003-prereg-step0
title: "LAB-003 — Step 0 pre-registration"
area: observatory
evidence: hypothesis
tags: [lab-003, preregistration, observatory]
related: [obs-lab003-calibration]
updated: 2026-11-09
summary: "Gate and probe design for the false-success calibration, written before the calibration runs."
---
# LAB-003 — Step 0 pre-registration (2026-11-09, before the calibration runs)

Budget: US$ 15 hard cap for the whole LAB-003 (own ledger `ledger.jsonl`, enforced in `lab003/api.mjs`; the cap counts cost × 1.5 safety; model `claude-haiku-5-5` through the Anthropic API, price table US$ 0.10/M in, US$ 0.50/M out, not checked against an invoice). Calls so far: 2 API checks of the output limit (max_tokens 64,000 accepted), < US$ 0.001.

## What "stronger probe" means here
Agent-visible probe per package = the original visible tests **plus a stratified share of the hidden test cases** (case level, node `--test-name-pattern`), chosen deterministically: bug-revealing cases (fail on the buggy code) and guard cases (pass on it) are thinned separately and spread evenly; at least one revealing case stays unseen when a package has ≥ 2. **Acceptance ("final") = the full original hidden suite** (probe cases included), so a task is accepted only if every hidden test passes. This is a train/test-style leak of part of the hidden suite into the visible signal, declared as such; false success = probe all-pass but final not. Share fixed now: **0.6**; fallback **0.8** only if the gate fails. Packages: the 38 validated Observatory packages (b01–b21, c01–c17; 296 of 704 hidden cases reveal a bug).

## Calibration (single-package tasks; 38 packages × 2 repetitions; SOLO = one agent, ≤ 2 probe repairs; ≈ 76 runs)
Record for every run: first-pass candidate and final candidate; probe pass (new probe) and visible-only pass (old probe), hidden pass. The first-pass candidate is produced before any probe feedback, so it can be scored offline under any probe design without new calls.
- **False-success rate FS** = P(hidden suite fails | probe passes), at package-run level.
- **Gate** (all must hold): (1) FS after repair under the new probe ≤ **0.20** (point estimate; Wilson interval reported); (2) FS of first-pass candidates under the new probe is ≥ **50% lower** than under the visible-only probe, on the same candidates. If it fails at 0.6, rerun the calibration at 0.8 (cost < US$ 1). If it still fails, **stop and report the false-success problem as the main finding; Q1–Q3 do not run.**
- Probe design is chosen from {0.6, 0.8} only; no other tuning.

## Task eligibility after calibration (fixed now)
A package is **eligible** if, over its 2 calibration runs, it had no false success and was accepted at least once (hard-for-the-model packages are excluded; this excludes only what the single agent never solved, which is conservative for the team arms, and is reported). If fewer than 20 packages are eligible, packages with ≤ 1 false success and ≥ 1 acceptance are admitted. Tasks of 3, 8 and ~15 packages are composed from eligible packages with a seeded shuffle (packages may recur across tasks; tasks are therefore not independent, and the analysis resamples tasks).

## Limits
Calibration uses single-package tasks; false success in merged tasks is re-measured in the main runs and reported. One model, low-effort-equivalent default sampling, price table not an invoice.

---
## Amendment 0.1 (after the single-package calibration, before any multi-package run)
Single-package result (`calibration-cal.json`, 76 runs, share 0.6, cost US$ 0.49 at the price table): after repair the single agent accepted **76/76** with **0** false successes; on first-pass candidates the visible-only probe let 9 of 71 probe-passing candidates fail hidden tests (FS 0.127), the 0.6 probe 0 of 62 (0.000; Wilson 0–0.058). Gate conditions (1) and (2) hold. But k = 1 is at the ceiling (the model solves every package alone), so the gate is weak evidence for multi-package tasks, where earlier experiments saw acceptance ≈ 0.
**Extension (fixed now):** calibrate SOLO (same policy) once on composed tasks: 12 tasks of 3 packages, 6 of 8, 2 of 15, made by seeded shuffles of the 38 packages (seed 31), share 0.6. Same gate, evaluated on the pooled k ≥ 3 runs: FS after repair ≤ 0.20 and first-pass FS ≥ 50% lower than the visible-only probe on the same candidates (if there are fewer than 10 probe-passing first-pass candidates for the comparison, report it as not estimable and rely on condition 1). If the gate fails at 0.6, rerun the k ≥ 3 calibration at 0.8 (once); if it still fails, stop and report. Acceptance of SOLO at each k is reported (it determines where Q1 can measure anything). Per-task eligibility for Q1–Q3: all packages are eligible (none had a false success or zero acceptance); tasks for Q1 are drawn from fresh seeded compositions (seed 77), not from the calibration tasks.
