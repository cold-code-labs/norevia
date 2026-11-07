---
id: nat-map
title: Map nature → principle → engineering → hypothesis → where to test
area: nature
evidence: hypothesis
tags: [map, index, nature, candidate-hypotheses]
sources:
  - "See the 35 nat-* cards in this folder; each lists its primary sources and what was checked."
related: [nat-candidates]
updated: 2026-11-07
summary: Table linking 35 verified natural mechanisms to principles, engineering mechanisms for LLM swarms, falsifiable hypotheses and the place where each can be tested (simulation or LLM benchmark).
---

# Map of the nature collection (nature agent, 2026-11-07)

**How to read:** each row is a `nat-*` card. "Principle" is the regularity extracted from the source (with the key number when the source gives it). "Candidate hypothesis" summarizes the card's prediction; the full text, with manipulated variable, metric, prediction and refutation, is in the card. "Where to test": **SIM** = agent-based simulation (`sims/`), **LLM** = benchmark with real models (`observatory/`), **CALC** = analytical calculation already done locally (`calc/`). The 10 most promising are in `CANDIDATES.md` (`nat-candidates`).

**Discipline:** nature generates hypotheses; it does not prove them. Celestial rows (★) are **strict analogies**, with no intention attributed to celestial bodies. No row was tested on an LLM in this round; only the CALC rows have `local-validation`, and only of the mathematics.

## Insect colonies

| Card | Principle (source) | Engineering mechanism | Candidate hypothesis | Where to test |
|---|---|---|---|---|
| `nat-response-threshold` | An individual takes up the task if its threshold θ < stimulus s; T(s)=sⁿ/(sⁿ+θⁿ); reinforcement creates specialists (Bonabeau 1996; Theraulaz 1998) | Per-role threshold on a cheap stimulus (open criteria, failing tests, disagreement) | Threshold activation reduces cost per acceptance by ≥25% vs fixed N, if the stimulus predicts difficulty (ρ_S ≥ 0.3) | SIM → LLM |
| `nat-interaction-rate-foraging` | Forager departures track the recent rate of returns with food; response within 2–3 min (Gordon 2008; Prabhakar 2012) | Spawn proportional to the acceptance rate in window W | Automatic contraction cuts ≥50% of calls on infeasible tasks, ≤20% delay on feasible ones | SIM → LLM |
| `nat-stigmergy` | Individuals "work as if alone"; the artifact coordinates (Grassé 1959; Theraulaz & Bonabeau 1999) | Coordination only through shared state (repo, tests, checklist) | −40% coordination tokens on decomposable tasks; loses on coupled tasks | LLM |
| `nat-pheromone-evaporation-aco` | Positive reinforcement + evaporation avoids premature convergence/lock-in (Goss 1989; Dorigo 1996/1997) | Router with weights reinforced by acceptance and half-life h | Finite h readapts ≥3× faster after a change, cost ≤5% at steady state | SIM |
| `nat-quorum-nest-bees` | Piping begins with 10–15 scouts at a site, without consensus (Seeley & Visscher 2003) | Sequential stopping when k canonical answers agree | k=3 → ≥40% fewer calls than N=9 with accuracy ≥ −1 pp | LLM (+SIM) |
| `nat-speed-accuracy-quorum` | Quorum 5.7 (crisis) vs 12.7 (calm); accuracy 65% vs 90%; time 87 vs 565 min (Pratt & Sumpter 2006; Franks 2003) | k and exploration rate tuned to the cost-of-error/cost-of-time ratio | Optimal k grows with C_error/C_time; controller ≤5% from the optimum | SIM → LLM |
| `nat-stop-signal-cross-inhibition` | Stop signals between factions avoid deadlock (Seeley et al. 2012) | Objection by verifiable counterexample reduces the weight of the rival option | −50% deadlocks, −30% rounds, accuracy ≥ −2 pp | LLM |
| `nat-waggle-dance-recruitment` | Waggle runs per trip W = D·R increase with profitability (Seeley et al. 2000) | Continuation budget proportional to verified partial quality | +15% solved at equal budget when the partial signal is informative | LLM |
| `nat-recruitment-benefit-conditions` | Communication helps with few/poor/variable resources; hinders under abundance; size has no effect (Dornhaus 2006) | Sharing findings among parallel agents conditioned on the rarity of solutions | Interaction: −20% cost at low solution density, +5% at high | SIM → LLM |
| `nat-inactive-reserve` | Inactive workers replace removed active ones within ≤1 week; inactive ones are not replaced (Charbonneau 2017) | Cold capacity reserve (quota/concurrency) | r=10–25% reduces p95 by ≥30% under bursts, cost ≤ +10% | SIM |
| `nat-colony-size-scaling` | Metabolism ∝ mass^0.81 (CI 0.55–1.08); more division of labor in larger colonies (Hou 2010; Holbrook 2011) | Specialization only above N_e; cost exponent depends on the coordination mode | N_e ≈ 3–5; b<1 with shared state, b>1 peer-to-peer | LLM |

## Microorganisms and physics of collectives

| Card | Principle (source) | Engineering mechanism | Candidate hypothesis | Where to test |
|---|---|---|---|---|
| `nat-bacterial-quorum-sensing` | Expression changes above an autoinducer threshold; processes that are unproductive alone (Miller & Bassler 2001; Waters & Bassler 2005) | Collective mode only when q independent signals accumulate | −60% spurious investigations, detection loss ≤5% | SIM |
| `nat-physarum-network` | dD/dt = f(\|Q\|) − D; larger I₀ → more redundancy and cost; ~30% of possible links (Tero 2010) | Communication graph reinforced by useful flow and with decay | ≤40% of the tokens of the complete topology, acceptance ≥ −2 pp; I₀ regulates cost×robustness | SIM → LLM |
| `nat-scale-free-correlation` | Correlation ξ ≈ 0.35·L in flocks of 122–4,268 (Cavagna 2010) | Social coupling propagates both correct answers and errors | Coupling without verification propagates correct and wrong seeds equally (ratio < 1.5) | LLM |
| `nat-topological-neighbors` | n_c = 6.5 ± 0.9; stragglers 5% vs 43% (Ballerini 2008); optimum 6–7 independent of N (Young 2013) | Each agent reads k fixed peers | Accuracy saturates at k* ≤ 4 independent of N | LLM (+SIM) |
| `nat-vicsek-phase-transition` | Continuous order/disorder transition, β ≈ 0.45 (Vicsek 1995) | Temperature/diversity as order parameter | Nonlinear drop in order at η_c; maximum accuracy just below η_c | SIM → LLM |
| `nat-informed-leaders` | Larger groups need a smaller proportion of informed individuals (Couzin 2005); uninformed individuals return control to the majority (Couzin 2011) | Few agents with a tool/verifier; neutral aggregators | Saturation with f ≤ 2/12; neutral agents reduce capture by a stubborn agent by ≥30% | LLM |
| `nat-small-groups-correlated-cues` | Wisdom of crowds only if p·r_L > 1/2; otherwise a finite, small N* > 1 (Kao & Couzin 2014) | Expand only if the majority brings correct independent evidence | Interior maximum N* ∈ [3,7] when q·acc < 1/2 | SIM → LLM |

## Human body

| Card | Principle (source) | Engineering mechanism | Candidate hypothesis | Where to test |
|---|---|---|---|---|
| `nat-reflex-vs-cortex` | SLR 20–45 ms, LLR 50–100 ms, voluntary >100 ms (Kurtzer 2015); transcortical layer at ~50 ms already sophisticated (Pruszynski 2011) | 3-tier routing: code → cheap model → high effort/swarm | −50% cost, −60% p50 latency, acceptance ≥ −1 pp | LLM |
| `nat-clonal-expansion-contraction` | ~2×10⁷ specific cells → 10⁶ stable; 5–10% survive (Murali-Krishna 1998; Kaech & Cui 2012) | Clonally expand the useful agent; contract 90–95%; retain memory ≤10% | −40% time to acceptance on recurrences; −30% cost vs permanent swarm | SIM → LLM |
| `nat-danger-theory` | Response driven by damage, not by foreignness (Matzinger 1994/2002 — theoretical proposal) | Escalate on verifiable violation, not on novelty | −70% false alarms with ≥90% detection | SIM |
| `nat-homeostasis-allostasis` | Feedback is inefficient; anticipate, match capacities, share reserves (Sterling 2012) | Cheap difficulty predictor chooses effort/N beforehand | Predictive beats reactive iff AUC ≥ ~0.75 and predictor cost ≤10% | LLM |
| `nat-wound-healing-resolution` | Resolution of inflammation is an active, self-limited program; excess dysregulates (Serhan 2014; Larouche 2018) | Active resolution signal with cancellation of descendants; metric R_i | −70% R_i, −80% orphaned work, no increase in recurrence | SIM → LLM |
| `nat-renal-filtration` | ~180 L/day filtered, 99% reabsorbed, 1–2 L excreted (OpenStax A&P 2e) | Compaction: discard by default + typed retention | ≥90% compression with commitment recall ≥98% | LLM |
| `nat-circadian-cadence` | 43% of protein-coding genes oscillate in some organ; "rush hours" (Zhang 2014); coupled pacemaker (Mohawk 2012) | Maintenance in batched windows + events for urgent cases | −60% cost per useful issue, unchanged latency for urgent cases | SIM |
| `nat-brain-energy-sparse` | 2% of mass, 20% of O₂ (Raichle 2002); ≤15% (Attwell 2001) or <1% (Lennie 2003) of neurons active | Sparse activation k ≪ N of routed specialists | k = 2–3 of 12 ≈ acceptance of k = 12 at ≤25% of the cost | LLM |

## Celestial systems (★ strict analogy, no intention)

| Card | Principle (source) | Engineering mechanism | Candidate hypothesis | Where to test |
|---|---|---|---|---|
| ★ `nat-stellar-thermostat` | Negative specific heat; no equilibrium beyond 0.335 GM²/(−E) (Lynden-Bell & Wood 1968) | Backpressure; self-acceleration alert based on concentration | Admission with backpressure degrades gracefully; central coordinator + no limit grows superlinearly | SIM |
| ★ `nat-orbital-resonance` | Chain of 7 planets with 3-body resonances; TRAPPIST-1h 18.77 d (Luger 2017) | Offsets/jitter and triggering by dependency version | −50% peak concurrency; −50% rework per change | SIM |
| ★ `nat-lagrange-points` | L4/L5 stable only if μ < μ_G ≈ 0.0385 (Gascheau; Sicardy 2010; recalculated) | Boundary contracts with an asymmetric owner + station keeping | Symmetric co-authorship ≥2× divergences vs single owner | LLM |
| ★ `nat-kessler-cascade` | Above a critical density, collisions > decay; LEO grows after ~2055 with no launches (Liou & Johnson 2006) | Job generation/cleanup ratio; dedup, depth, owner | Branching threshold p_c; containment drives the stock to zero | SIM |

## Collective theory

| Card | Principle (source) | Engineering mechanism | Candidate hypothesis | Where to test |
|---|---|---|---|---|
| `nat-condorcet-jury` | p=0.6: n=1→0.600; 3→0.648; 21→0.826; 51→0.926 (binomial; Boland 1989) | Majority voting; comparison of 1 strong vs N weak at equal cost | Observed ±3 pp from the binomial when ρ≈0; voting only wins if p_low > 1/2 | CALC ✓ → LLM |
| `nat-condorcet-correlated` | p=0.6, ρ=0.1 → ceiling 0.736; n_eff ≤ 1/ρ (Ladha 1992; local calculation) | Stopping rule N ≈ 1/ρ̂; replace copies with heterogeneity | Gain saturates at N ≈ 1/ρ̂; (p̂, ρ̂) model predicts within ±3 pp | CALC ✓ → SIM → LLM |
| `nat-diversity-prediction` | Collective error = average error − diversity (Page 2007; identity verified) | Measure competence and diversity separately | Diverse prompts/models reduce collective error only if Δdiversity > Δaverage error | CALC ✓ → LLM |
| `nat-hong-page-critique` | Random teams > top (Hong & Page 2004); the theorem requires identical copies; maximally diverse < random median (Thompson 2014) | Avoid redundant copies; do not maximize diversity blindly | Copies ≈ 1 agent; "max diversity" does not beat random draw | LLM |
| `nat-galton-vox-populi` | Median of 787 = 1,207 vs 1,198 lb (Galton 1907); social influence undermines the effect (Lorenz 2011) | Independent answers before any exposure | Debate reduces dispersion by ≥50% without reducing the error of the median | LLM |

## Cross-cutting gaps
- Numbers not checked in the original text: double-bridge experiment (Goss 1989, scanned PDF), the sⁿ/(sⁿ+θⁿ) form of Bonabeau 1996 (secondary source only), % of inactive workers (Charbonneau 2015), % of informed individuals by N (Couzin 2005, in figures), autoinducer thresholds, Sicardy's μ∞.
- Textbook source, not primary: kidneys (OpenStax).
- Danger theory is a theoretical proposal within its own field.
- No hypothesis was tested with an LLM; "local-validation" covers only mathematics (calc/).
