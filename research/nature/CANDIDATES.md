---
id: nat-candidates
title: 10 nature-derived candidate hypotheses for the official registry
area: nature
evidence: hypothesis
tags: [candidate-hypotheses, ranking, elastic-swarm, when-to-cooperate, how-much-to-cooperate]
sources:
  - "Derived from the nat-* cards in this folder; primary sources in each card."
related: [nat-map, nat-condorcet-correlated, nat-small-groups-correlated-cues, nat-quorum-nest-bees, nat-speed-accuracy-quorum, nat-response-threshold, nat-interaction-rate-foraging, nat-topological-neighbors, nat-brain-energy-sparse, nat-recruitment-benefit-conditions, nat-kessler-cascade]
updated: 2026-11-07
summary: The 10 hypotheses of natural origin that are most testable today and have the most power to explain when 1 agent suffices, when a micro-swarm adds value and when expanding is wasteful — for formalization by the theory agent.
---

# Candidate hypotheses (nature → `H-xx` registry)

Proposed for the theory agent to formalize. **None has been tested with an LLM.** The IDs `nat-C01…C10` are provisional; the official registry assigns `H-xx`.

## Ranking criterion
- **Testability today (T, 1–5):** can it be tested with what exists (sims in `sims/`, tasks with mechanical acceptance, a few dollars of API) without new infrastructure?
- **Transition power (P, 1–5):** does the hypothesis predict *where* the boundaries 1 agent → micro-swarm (2–5) → macro-swarm (10+) lie, with a measurable quantity?
- **Order:** by T + P, ties broken by P. Risk of non-novelty indicated when the literature already covers part of it (see `lit-*` cards).

| # | ID | Hypothesis (short) | Natural origin | T | P | Where to test first |
|---|---|---|---|---|---|---|
| 1 | nat-C01 | The voting gain saturates at N ≈ 1/ρ̂ (error correlation) | Correlated Condorcet; Kao & Couzin | 5 | 5 | CALC ✓ → existing sim → LLM |
| 2 | nat-C02 | Expanding only helps if the majority brings correct independent evidence; otherwise there is a small interior N* | Kao & Couzin 2014 | 4 | 5 | SIM → LLM |
| 3 | nat-C03 | Tunable quorum: k* grows with C_error/C_time; k = 1 is the "1 agent" regime | Ants/bees (Pratt & Sumpter; Franks; Seeley) | 5 | 4 | LLM |
| 4 | nat-C04 | Threshold activation on a cheap stimulus beats fixed N iff the stimulus predicts difficulty | Response threshold; allostasis | 4 | 5 | SIM → LLM |
| 5 | nat-C05 | Independence first, sharing later: debate only helps when solutions are rare | Dornhaus 2006; Galton/Lorenz | 4 | 4 | LLM |
| 6 | nat-C06 | Spawning coupled to acceptances contracts on its own on infeasible tasks | Harvester ants (Gordon) | 4 | 4 | SIM → LLM |
| 7 | nat-C07 | In a macro-swarm, reading a fixed k of peers saturates at a small k* independent of N | Starlings (Ballerini; Young) | 4 | 3 | LLM |
| 8 | nat-C08 | Sparse activation k ≪ N matches dense activation at a fraction of the cost | Brain energy budget; sparse coding | 3 | 4 | LLM |
| 9 | nat-C09 | Expansion without active contraction has a critical generation/cleanup ratio > 1 → the stock explodes | Kessler; resolution of inflammation; clonal contraction | 4 | 3 | SIM |
| 10 | nat-C10 | Routes reinforced by acceptance need evaporation: without decay there is lock-in | Pheromone/ACO; Physarum | 4 | 3 | SIM |

---

## nat-C01 — Correlation ceiling and the N ≈ 1/ρ rule
- **Statement:** for N agents voting with individual accuracy p̂ > 1/2 and error correlation ρ̂ measured on a calibration set, majority accuracy saturates at a ceiling A_∞(p̂, ρ̂) < 1, and ≥ 90% of the possible gain is obtained with N ≤ ⌈1/ρ̂⌉. For ρ̂ ≥ 0.3, N > 3 is wasteful.
- **Basis:** local calculation (p = 0.6, ρ = 0.1 → ceiling 0.736; ρ = 0.3 → 0.643; n_eff ≤ 1/ρ) in `calc/`; Ladha 1992; Kao & Couzin 2014. Converges with `sim-correlated-vote` (Gaussian copula) — two different correlation models.
- **Variables:** N ∈ {1,3,5,9,15}; homogeneous (copies) vs heterogeneous (models/prompts/evidence).
- **Metric:** accuracy, pairwise ρ̂, cost per correct answer; prediction error of the (p̂, ρ̂) model.
- **Refutation:** accuracy rising > 3 pp beyond N = 2/ρ̂; or the 2-parameter model off by > 5 pp.
- **Transition explained:** micro → macro boundary (when expanding is wasteful). Also 1 → micro: if p̂ < 1/2 on hard tasks, voting makes things worse — 1 agent with high effort should win.
- **Risk of non-novelty:** high in form (that correlation limits voting is known; see `lit-correlated-errors`, `lit-more-agents`); the contribution is the **estimable operational rule** (ρ̂ → N_max) and its validation.

## nat-C02 — Kao–Couzin condition for expanding
- **Statement:** let q be the fraction of agents with access to independent evidence (tool, file, own test) and a the accuracy of that evidence. If q·a > 1/2, accuracy(N) is monotonic; if q·a < 1/2, there is a small interior maximum N* (3–7) and accuracy falls thereafter.
- **Basis:** Kao & Couzin 2014 (condition p > 1/(2r_L)); Couzin 2005 (a few informed individuals suffice in large groups).
- **Variables:** N × q ∈ {0, 0.25, 0.5, 0.75}.
- **Metric:** argmax_N of accuracy; position of the observed boundary vs 1/(2a).
- **Refutation:** monotonic accuracy in all conditions; or N* insensitive to q.
- **Transition explained:** micro → macro and **why** macro-swarms need distributed evidence, not more copies.

## nat-C03 — Quorum tuned to urgency
- **Statement:** a single sequential quorum-stopping algorithm (stop when k canonical answers agree) with k chosen by the declared C_error/C_time ratio reaches utility ≥ 95% of the best fixed configuration in hindsight; k = 1 (single agent) is optimal when C_time dominates.
- **Basis:** Pratt & Sumpter 2006 (quorum 5.7 vs 12.7; accuracy 65% vs 90%; time 87 vs 565 min); Franks 2003; Seeley & Visscher 2003 (10–15 bees, without consensus).
- **Metric:** utility = value·accuracy − token cost − latency cost; Pareto frontier.
- **Refutation:** optimal k independent of the cost ratio; or controller < 90% of the optimum.
- **Transition explained:** 1 agent ↔ micro-swarm, as a continuous function of an urgency parameter.
- **Risk of non-novelty:** adaptive stopping already exists (`lit-adaptive-consistency`, `lit-early-stopping-sc`); what is new is **coupling k to the task's cost ratio** and predicting k* from it.

## nat-C04 — Stimulus-threshold activation (and allostatic predictor)
- **Statement:** choosing effort and N before execution, by thresholds on a cheap stimulus s (disagreement between 2 short samples, open acceptance criteria, failing tests), reduces cost per acceptance by ≥ 25% vs fixed N **iff** s predicts difficulty with AUC ≥ ~0.75 and costs ≤ 10% of the average task. Below that, the reactive policy (escalation ladder) wins.
- **Basis:** Bonabeau 1996/Theraulaz 1998 (threshold and reinforcement); Sterling 2012 (allostasis: anticipate vs correct); Kurtzer 2015/Pruszynski 2011 (reflex → transcortical → voluntary tiers).
- **Refutation:** gain unrelated to the stimulus AUC; or no gain with AUC ≥ 0.85.
- **Transition explained:** 0 (deterministic check) → 1 → micro, by the quality of the stimulus. Provides the existence condition for a cheap "adaptive controller".

## nat-C05 — Independence first; share only when solutions are rare
- **Statement:** (a) exposing agents to their peers' answers before they respond reduces dispersion without reducing error (Lorenz effect); (b) sharing intermediate findings reduces cost on tasks with low solution density and increases cost on tasks with high density.
- **Basis:** Lorenz et al. 2011; Galton 1907; Dornhaus et al. 2006; Cavagna 2010 (long-range correlation propagates both error and correct answers).
- **Refutation:** benefit of sharing independent of solution density; or debate consistently reducing error (> 5% relative).
- **Transition explained:** when a micro-swarm should **converse** vs only **vote** — relates to `lit-debate-or-vote`.

## nat-C06 — Recruitment coupled to acceptance (automatic elasticity)
- **Statement:** a launch rate of new attempts proportional to the rate of verified acceptances in a short window contracts the swarm on its own on infeasible tasks (≥ 50% fewer calls) with ≤ 20% delay on feasible ones; quality depends on the false-acceptance rate.
- **Basis:** Gordon et al. 2008 (response within 2–3 min to a drop in returns); Prabhakar et al. 2012 (Poisson + feedback).
- **Refutation:** no contraction on infeasible tasks, or delay > 20% on feasible ones.
- **Transition explained:** expansion/contraction **during** execution (Elastic Swarm), without estimating difficulty a priori.

## nat-C07 — Fixed topological neighborhood in macro-swarms
- **Statement:** in aggregation/debate with N ∈ {6, 12, 24}, reading k fixed peers saturates accuracy at k* ≤ 4, **independent of N**; reading all (k = N−1) costs O(N²) with no gain > 1 pp.
- **Basis:** Ballerini 2008 (6.5 ± 0.9; stragglers 5% vs 43%); Young 2013 (optimum independent of N); Tero 2010 (adaptive network with ~30% of the links).
- **Refutation:** k* growing with N; or k = N−1 outperforming k* by > 3 pp.
- **Transition explained:** how a macro-swarm keeps coordination cost linear in N.

## nat-C08 — Sparse activation
- **Statement:** with N = 12 specialists and a cheap router, k = 2–3 active reach acceptance ≥ (k = 12) − 2 pp at ≤ 25% of the cost; the k routed specialists have less correlated errors among themselves than a dense group.
- **Basis:** Raichle & Gusnard 2002 (2% of mass, 20% of O₂); Attwell & Laughlin 2001 (≤ 15% active); Lennie 2003 (< 1%); Olshausen & Field 1996.
- **Refutation:** acceptance growing ~linearly up to k = 12; or the router erring to the point that small k loses > 5 pp.
- **Transition explained:** macro-swarm as a large **reserve** with small activation — "available size" ≠ "active size".

## nat-C09 — Critical generation/cleanup ratio
- **Statement:** in a system where each job spawns children with probability p, without deduplication/depth limit/owner, there exists a p_c (mean number of children ≈ 1) above which the job stock grows even after input ceases; active resolution (transitive cancellation) keeps the stock decaying for every p tested.
- **Basis:** Kessler & Cour-Palais 1978; Liou & Johnson 2006 (critical density; growth after 2055 with no launches); Serhan 2014 (active resolution); Kaech & Cui 2012 (contraction of 90–95%).
- **Refutation:** gradual growth without a threshold; or containment failing above p_c.
- **Transition explained:** why expanding **without** programmed contraction is unstable — the cost of macro-swarms is not only that of execution.

## nat-C10 — Reinforcement with evaporation in the router
- **Statement:** a configuration router (1 agent vs micro-swarm, which specialist) with weights reinforced by acceptance needs decay: without it, after a distribution shift, readaptation is ≥ 3× slower (lock-in); with a suitable finite half-life, the steady-state loss is ≤ 5%.
- **Basis:** Dorigo et al. 1996/1997 (positive feedback + avoiding premature convergence); Goss 1989/Deneubourg 1990 (lock-in reported in secondary sources — gap); Tero 2010 (tubes without flow disappear).
- **Refutation:** no lock-in with h = ∞; or any decay costing > 5%.
- **Transition explained:** how the system autonomously **discovers and rediscovers** the minimal sufficient configuration when the load changes.

---

## Suggested execution order (proposal, not authorization)
1. C01 and C02 together (same voting battery with measured ρ̂ and q) — there is already a basis in `sims/sim-correlated-vote.mjs` and `research/theory/`.
2. C03 and C05 on tasks with mechanical acceptance (e.g.: code with tests) — cheap.
3. C04 once a candidate stimulus with measured AUC exists.
4. C06, C09, C10 in simulation before any LLM.
5. C07 and C08 when there are ≥ 6 agents/specialists in the Observatory.

## Relation to simulations already in the repo
Summaries read from the frontmatters of `results/sims/*.md` (work of the simulation agent; I did not re-run or audit them):
- C01 ↔ `sim-correlated-vote` (latent correlation 0.1 already prevents 64 agents with p = 0.6 from reaching 1 agent with p = 0.8) and `sim-verifier`.
- C03 ↔ `sim-quorum` (a larger quorum trades speed for accuracy; shared evaluation bias brings accuracy down even with a high quorum; preregistered predictions not supported) — reinforces C03's refutation clause on correlated errors.
- C04 ↔ `sim-response-threshold`; C06 ↔ `sim-elastic`; C09 ↔ `sim-clonal`; C10 ↔ `sim-stigmergy` (without evaporation the trail grows without bound).

## What these candidates do NOT claim
No natural mechanism demonstrates effectiveness in LLMs. The numerical ranges in the predictions (25%, 40%, k* ≤ 4, etc.) are **proposed refutation thresholds**, chosen to make the hypotheses falsifiable — not estimates derived from the sources.
