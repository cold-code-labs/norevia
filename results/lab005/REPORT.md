---
id: obs-lab005-flags-batch2
title: "LAB-005 — Flag batch 2, looking for a bio-specific effect"
area: observatory
evidence: local-validation
tags: [lab-005, flags, bio-specific, controls, observatory, haiku-5-5]
related: [obs-lab005-prereg, obs-lab004-massive-swarm, H-05, H-06, H-08, H-10]
updated: 2026-11-09
summary: "Five more flags (proportional allocation, quorum-sensing activation, correlation stop, acceptance-coupled launch, predator-prey damping), each against its closest engineering control and against an uncapped central dispatcher, on 630 micro-tasks with real Haiku 5.5 agents. None beat its plain base or its controls; no bio-specific effect found."
data: [results/charts/lab005-n100-static-by-arm.json, results/charts/lab005-n300-static-by-arm.json, results/charts/lab005-n300-dynamic-cost-vs-wait.json]
---
# LAB-005 — Flag batch 2: looking for a bio-specific effect

> **Charts on this page, in order.** Static world with a limited budget (N = 100, 6 rounds, 10 arms): coverage, accepted tasks per US$, false-success rate, duplicate calls per call; static world at N = 300 (same four metrics); dynamic bursty world at N = 300: accepted tasks per US$ and mean waiting rounds per arm, coverage, calls. S-CENTRAL and D-CENTRAL are the uncapped central dispatcher; the other arms are flags and their controls (see the verdict table).

Norevia Lab · 2026-11-09 · Claude Haiku 5.5 through the Anthropic API · `PREREG.md` (+ Amendment 1) written before the main runs · **ledger US$ 25.59 counted of the US$ 35 cap** (counted = cost × 1.5; ≈ US$ 17.0 at the price table US$ 0.10/M in, 0.50/M out, not an invoice; 236,353 calls, 498 rate-limit errors all retried, 0 calls lost) · 137 swarm runs.

## Answer in brief
**No bio-specific effect in any of the five flags.** Under the pre-registered rule every flag is **null**: none was BETTER than its plain base, and in the unsaturated regime four of five were worse than the base or than a control. What each flag does is matched or beaten by a one-line engineering control (table below). The negative result is itself informative: all five flags had no obvious one-line engineering equivalent when chosen; the controls turned out to be enough.

## Setup (see `PREREG.md`; code `observatory/lab005/`)
Same 630-task micro pool and agent call as LAB-004 (about 200 input and 100 output tokens per call), uncapped central dispatcher as the reference baseline (fixing LAB-004's capped-orchestrator artefact), one flag at a time against its closest control and the plain base. Static world: all tasks open at round 0. Dynamic world: the pool is released in four bursts (19, 40, 25, 16%). Registered scales: N = 300, 8 rounds, 4 seeds (static and dynamic); N = 1,000, 6 rounds, 3 seeds (static, five arms). **Amendment 1 (after seeing N = 300):** all static arms saturate the pool ceiling at N = 300 (coverage 0.39–0.42), so a budget-limited static regime was added (**N = 100, 6 rounds, 6 seeds**), and the N = 1,000 stage was stopped after 1–2 seeds. Verdict rule: BETTER only if Δcoverage's lower bound ≥ −0.03 and the accepted-per-US$ ratio's lower bound > 1.10 (or Δcoverage lower bound > 0 and ratio ≥ 1.0); a flag is **bio-specific** only if BETTER than its base and every control.

## Verdict per flag
| Flag (arm) | Closest controls | N = 300 | N = 100 (budget-limited) | Class |
|---|---|---|---|---|
| `proportional_allocation` (S-PROP) | S-GREEDY, S-BOARD | vs board Δcov +0.002 [−0.005, 0.008], ×1.06 [1.00, 1.13] INCONCLUSIVE; vs greedy +0.173, ×1.58 BETTER | vs board Δcov −0.032 [−0.046, −0.019], ×0.93 INCONCLUSIVE; vs greedy +0.151, ×2.01 BETTER; vs central WORSE (×0.76) | **null** — proportional recruitment beats winner-take-all but not uniform spreading |
| `quorum_sensing_activation` (S-QSA) | S-ESC1, S-ESC2 | vs board ×0.99, vs ESC1 ×0.99, vs ESC2 ×0.99, all INCONCLUSIVE | vs board Δcov −0.045, ×0.86 WORSE; vs ESC1 +0.008, ×1.03; vs ESC2 −0.039, ×0.87 | **null** — a class-density trigger does no better than escalating after 1–2 failures |
| `correlation_stop` (S-SEQCORR) | S-FIXED3, S-SEQMAJ | WORSE vs both (Δcov −0.118/−0.126, ×0.54) | WORSE vs both (Δcov −0.068/−0.088, ×0.52/0.47) | **null (worse)** — stopping on effective n cuts coverage, false success stays 0.52–0.60 |
| `acceptance_coupled_launch` (D-ACL) | D-AIMD | vs all-on: ×1.36 but wait 0.49 vs 0.06 rounds → INCONCLUSIVE (downgraded); vs AIMD WORSE (×0.54) | — | **null** |
| `predator_prey_damping` (D-PPD) | D-HYST, D-PCTRL | vs all-on ×1.39 but wait 0.23 vs 0.06 → INCONCLUSIVE (downgraded); vs HYST WORSE (×0.84); vs PCTRL INCONCLUSIVE (×1.06) | — | **null** (descriptively: on the engineering cost–latency frontier, not beyond it) |
False success is reported separately: static arms 0.20–0.27 for "commit on the first visible pass" and 0.46–0.60 for voting arms; no flag moved it by more than 0.03 in either direction except GREEDY (0.25–0.26) and the voting arms.

## Tables
**Static world, N = 300, 8 rounds, 4 seeds (saturated: ≈ 2,400 calls each)**
| Arm | Coverage | False success | Calls | Accepted/US$ | Duplicate calls per call |
|---|---:|---:|---:|---:|---:|
| S-CENTRAL (reference) | 0.416 | 0.24 | 2,367 | 1,498 | 0.73 |
| S-BOARD (base) | 0.414 | 0.25 | 2,400 | 1,468 | 0.74 |
| S-GREEDY | 0.243 | 0.25 | 2,400 | 988 | 0.85 |
| S-PROP | 0.416 | 0.25 | 2,400 | 1,561 | 0.74 |
| S-ESC1 / S-ESC2 | 0.416 / 0.415 | 0.24 / 0.24 | 2,400 | 1,478 / 1,466 | 0.74 |
| S-QSA | 0.412 | 0.23 | 2,400 | 1,456 | 0.74 |
| S-FIXED3 / S-SEQMAJ | 0.391 / 0.398 | 0.59 / 0.58 | 1,860 / 1,817 | 1,836 / 1,853 | 0.66 / 0.65 |
| S-SEQCORR | 0.272 | 0.60 | 2,397 | 996 | 0.75 |
**Static world, N = 100, 6 rounds, 6 seeds (≤ 600 calls; coverage below the ceiling)**
| Arm | Coverage | False success | Accepted/US$ | Duplicates per call |
|---|---:|---:|---:|---:|
| **S-CENTRAL (reference)** | **0.383** | 0.20 | **5,526** | 0.00 |
| S-BOARD (base) | 0.315 | 0.20 | 4,519 | 0.18 |
| S-ESC2 | 0.310 | 0.21 | 4,487 | 0.19 |
| S-PROP | 0.283 | 0.23 | 4,183 | 0.26 |
| S-QSA | 0.271 | 0.21 | 3,880 | 0.30 |
| S-ESC1 | 0.263 | 0.22 | 3,754 | 0.30 |
| S-SEQMAJ / S-FIXED3 | 0.163 / 0.143 | 0.46 / 0.55 | 2,311 / 2,079 | 0.59 / 0.67 |
| S-GREEDY | 0.132 | 0.26 | 2,089 | 0.65 |
| S-SEQCORR | 0.076 | 0.52 | 1,084 | 0.67 |
**Dynamic (bursty) world, N = 300, 8 rounds, 4 seeds** (wait = mean rounds from release to acceptance)
| Arm | Coverage | Calls | Accepted/US$ | Mean wait (rounds) | On the cost × wait frontier? |
|---|---:|---:|---:|---:|---|
| D-FULL (all on) | 0.414 | 2,400 | 1,482 | 0.06 | yes (fastest) |
| D-CENTRAL | 0.410 | 1,807 | 1,912 | 0.09 | yes |
| D-PCTRL (undamped proportional) | 0.415 | 1,807 | 1,954 | 0.12 | yes |
| D-PPD (flag) | 0.413 | 1,703 | 2,064 | 0.23 | yes, but on the line traced by PCTRL and HYST (interpolated 2,083 at that wait) |
| D-ACL (flag) | 0.404 | 1,705 | 2,009 | 0.49 | **dominated by D-PPD** |
| D-HYST (autoscaler) | 0.410 | 1,435 | 2,479 | 0.58 | yes |
| D-AIMD | 0.382 | 900 | 3,700 | 0.98 | yes (cheapest, slowest, −0.03 coverage) |
**N = 1,000, 6 rounds (exploratory; 1–2 seeds: CENTRAL 2, BOARD 2, PROP 2, QSA 2, GREEDY 1)**: coverage 0.415 / 0.427 / 0.428 / 0.425 / 0.303; accepted/US$ 1,685 / 605 / 632 / 599 / 518 — saturated, the central dispatcher is 2.7× more efficient because it stops duplicating; PROP and QSA are not different from the board.

## Reading
- **What a good allocator does here is not duplicate.** With the pool unsaturated (N = 100) the central dispatcher with global state covers 0.38 against 0.32 for the board and 0.26–0.28 for proportional/escalating policies at 18–32% less cost per accepted task; every decentralised flag pays for local information with duplicate work. When the pool saturates (N ≥ 300) the question becomes cost only, and again the arm that stops duplicating wins.
- **Proportional allocation (`proportional_allocation`)**: probability-matching on partial quality is better than best-first (which concentrates agents on the same tasks and doubles duplicates), but no better than spreading agents by claims; the partial-visible-pass score carries little information on programming-by-example tasks.
- **Quorum-sensing activation**: the class-level failure density does flag hard classes (calls on teams: 189 of 600 at N = 100), but the same team size triggered after 1 failure costs the same and covers the same; the pooled signal adds no value over a per-task counter in this pool.
- **Correlation stop**: error correlation among wrong answers is ≈ 0.4 (0.22 under margin voting), so the effective number of voters saturates early and the rule stops adding voters early; coverage falls and false success stays 0.52–0.60. Voting without a check is the wrong baseline for these tasks; the check (first visible pass) is.
- **Population control (`acceptance_coupled_launch`, `predator_prey_damping`)**: both cut calls by about 30% against keeping every agent on, at the price of waiting 0.2–0.5 more rounds; an additive-increase/multiplicative-decrease rule on the same signal is cheaper (900 calls) and slower, and a threshold autoscaler or undamped proportional rule sit on the same cost–wait curve. The damped controller does not leave that curve and the acceptance-coupled launch is dominated by it.

## Limits and incidents (disclosed)
1. **Saturation at the registered scale.** The registered N = 300 and N = 1,000 stages are saturated (the pool is about 42% solvable by this agent in 8 attempts), which left no room for allocation to matter; the N = 100 regime was added after seeing that (Amendment 1), and N = 1,000 was cut to 1–2 seeds (the registered 3 were not reached; the money funded the new regime).
2. **Mechanisms are one reading each** (fixed rules, thresholds set by me: 0.75 and 6 attempts for the class signal, 0.12 for effective-n gain, 0.25 and 0.15 commit-rate references); a different reading could behave differently. Task classes for the quorum signal are defined from the hidden operation structure of the pool (about 55 classes), which is generous to the flag.
3. **Task-level intervals only** (same 630 tasks for every arm; seeds change agent order, release times and sampling); model sampling at default temperature; Haiku 5.5, micro-tasks only; these results do not transfer by themselves to real code work.
4. **Smoke runs and one fixed defect before registration:** two smoke runs (US$ 1.0 counted) found that the vote arms' assignment spread single votes instead of completing started tasks; fixed before the PREREG. 
5. **Cost** from a price table (not an invoice); counted ledger includes a 1.5 safety factor.

## Files (relative to the repository root)
Tools `observatory/lab005/` (`engine5.mjs`, `run5.mjs`, `analyze5.mjs`, `tasks5.mjs`, `backend.mjs`, `api.mjs`); results `results/lab005/` — `PREREG.md`, `REPORT.md`, `runs-main.jsonl` (137 runs with per-task outcomes), `runs-smoke.jsonl`, `summary-N100.json`, `summary-N300.json`, `summary-N1000.json`, `ledger.jsonl` (gzipped copy `ledger.jsonl.gz`). Reproduce: `ANTHROPIC_API_KEY_FILE=… node observatory/lab005/run5.mjs --arms all --N 300 --B 8 --reps 4`, `--arms S --N 100 --B 6 --reps 6`, then `node observatory/lab005/analyze5.mjs --N 300` (and 100, 1000).
