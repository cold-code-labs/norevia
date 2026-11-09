---
id: obs-lab004-simulation
title: "LAB-004 — Calibrated simulation to 100,000 agents"
area: observatory
evidence: local-validation
tags: [lab-004, simulation, scale, observatory]
related: [obs-lab004-massive-swarm, obs-lab004-prereg, H-07, H-08, H-14, H-24]
updated: 2026-11-09
summary: "The same coordination code as the real runs, driven by a simulated backend fitted on the pool calibration and real runs with N up to 100, validated on held-out real runs at N = 300 and 1,000 (12 of 12 arms, coverage error at most 10 percent), then extrapolated to N = 100,000. Exploratory."
data: [results/charts/lab004-sim-validation-heldout.json, results/charts/lab004-sim-fixed-pool-baselines.json, results/charts/lab004-sim-fixed-pool-flags.json, results/charts/lab004-sim-constant-density-baselines.json, results/charts/lab004-sim-constant-density-flags.json]
---
# LAB-004 — Calibrated simulation to 100,000 agents

> **Charts on this page, in order.** Validation: 1 relative coverage error of the simulation against the held-out real runs at N = 300 and N = 1,000, per arm. Extrapolation, fixed pool of 630 tasks (2–5: baselines and wound_resolution; 6–9: flags against the board base; metrics: coverage, false-success rate, accepted tasks per US$, conflicts per call), then the same with the pool growing with N at constant density (10–13 baselines, 14–17 flags). Log axis for N. **Simulation, exploratory**: the held-out runs use the same 630 tasks as the fit, so the validation covers swarm dynamics, not new tasks; the first simulator version failed validation (3 of 12 arms) and the second was chosen after seeing that (Amendment 2 of the pre-registration).

Real runs and verdicts: [LAB-004 — Massive swarm](/c/obs-lab004-massive-swarm/). Files: `results/lab004/sim-validation.json`, `sim-validation-v1.json`, `sim-extrapolation.json`, code `observatory/lab004/sim.mjs`.

## How the simulator was built and validated
- **Fit** only on the pool calibration (630 tasks × 3 fresh attempts + 311 revise attempts: single-attempt hidden-pass 0.40, visible-pass 0.51, false-success share of visible passes 0.22, revise-after-failure hidden-pass 0.06) and real runs with N ≤ 100: per-task success and false-success profiles, wrong-answer agreement (ρ_wrong 0.42, ρ_false-success 0.96), revise gain, context effects, cost and latency per call.
- **Validation** on held-out real N = 300 and 1,000 for every arm (not used for fitting). **v1** (strong smoothing, α = 3) **failed**: coverage overpredicted by 36–56% at N = 1,000, only 3 of 12 arms passed (`sim-validation-v1.json`). **v2** (α chosen by cross-validation on the pool only, Amendment 2, after seeing v1 fail): **12 of 12 arms pass**; median coverage error 0–2%, maximum 10% (HISTORY at N = 1,000, 0.43 simulated vs 0.48 real); accepted/US$ error ≤ 8%; false-success rate errors up to 0.15 (HISTORY) and 0.09 (RENAL) (context effects on false success are not modelled). Caveats: the held-out runs use the **same 630 tasks** as the fit, so this validates swarm dynamics (selection, duplication, commit rules), not new tasks; v2's α = 0.05 means almost no smoothing of per-task estimates from 3 attempts; simulator success ignores agent identity and assumes independence given the task.
- **Extrapolation (simulation, exploratory, labelled; all 12 arms validated)**, `sim-extrapolation.json`: (a) fixed pool of 630 tasks: arms that retry unresolved tasks without limit (BOARD, INDEP, QUORUM, LOCUST, ECOLI, RENAL, HISTORY) keep gaining coverage slowly, 0.43 (N = 1,000) → 0.66–0.67 (N ≥ 30,000), but accepted per US$ collapses (900 → 14) and false success climbs from 0.25 to 0.33–0.34, because more attempts per task give a wrong-but-visible-passing candidate more chances to commit first; WOUND (0.42, accepted/US$ ≈ 1,200 at any N), ORCH-U (0.41–0.42) and VOTE/LEADERS (0.41, fs 0.59) plateau; (b) constant density (T = 2.1 N): coverage flat at ≈ 0.41–0.42 for BOARD/WOUND/RENAL/ORCH-U and ≈ 0.35–0.40 for INDEP/QUORUM/LOCUST, 0.26 for VOTE/LEADERS/ECOLI, accepted/US$ constant (≈ 3,000 for BOARD/WOUND/ORCH-U), **no phase transition** in coverage, false success, error correlation or gregarious share; the capped orchestrator collapses to 0.0007 coverage at N = 100,000 (central throughput bottleneck, by construction of the cap).


## What the extrapolation shows (simulation)
- **Fixed pool of 630 tasks:** arms that keep retrying unresolved tasks (board, independent agents, quorum, locust, e-coli, renal, history) gain coverage slowly, 0.43 at N = 1,000 to 0.66–0.67 at N ≥ 30,000, while accepted tasks per US$ collapse from about 900 to 14 and false success climbs from 0.25 to 0.33–0.34; wound_resolution, the uncapped orchestrator and voting plateau at 0.41–0.42.
- **Constant density (tasks = 2.1 N):** coverage is flat near 0.41–0.42 (board, wound, renal, uncapped orchestrator) or 0.26–0.40 (others); no phase transition in coverage, false success, error correlation or gregarious share; the capped orchestrator collapses to 0.0007 at N = 100,000 because of its throughput cap (by construction).
