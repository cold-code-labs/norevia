---
id: H-27
title: "Cross-inhibition by a verifiable counterexample breaks impasses between equally supported options"
area: hypothesis
evidence: hypothesis
status: open
origin: "nature (nat-stop-signal-cross-inhibition — Seeley et al. 2012) + theory (th-model §11)"
experiment: "observatory: aggregation by rounds of support vs support + elimination by an executable counterexample (a failing test)"
tags: [aggregation, impasse, verification, debate]
sources:
  - "Seeley, T. D. et al. (2012). Stop Signals Provide Cross Inhibition in Collective Decision-Making by Honeybee Swarms. Science 335(6064):108–111. doi:10.1126/science.1210361"
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, nat-stop-signal-cross-inhibition, nat-candidates, lit-debate-or-vote, H-08, H-02]
updated: 2026-11-07
summary: "Honeybees give \"stop signals\" to those dancing for rival sites and so avoid ties; in an agent swarm, a verifiable counterexample that eliminates an option shortens impasses between equally supported answers."
---

# H-27 — Cross-inhibition by a verifiable counterexample breaks impasses between equally supported options

**Status:** `open` · **Card evidence level:** `hypothesis` · **Origin:** nature (nat-stop-signal-cross-inhibition — Seeley et al. 2012) + theory (th-model §11)

## Statement
Between two options with equal support, the vote margin follows a symmetric walk and takes E[T] = m² rounds to reach the decision margin m. If, each round, a verifiable counterexample eliminates the wrong option with prob. v, E[T] = E[min(T_walk, Geom(v))], with a lower impasse rate (no decision after R rounds); non-verifiable counterexamples (opinion) do not have this effect.

## Variables
m (decision margin), v (rate of verifiable counterexamples), R (round cap).

## Prediction (quantitative/directional)
- m = 3: 9 → 6.7 (v = 0.05) → 3.8 (v = 0.2) rounds; m = 5: 25 → 12.3 → 4.7.
- Inhibition by an executable counterexample reduces impasses without reducing accuracy; inhibition by a non-verifiable argument can reduce accuracy (herding, cf. the strong-recruitment regime of sim-quorum).

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
No reduction in rounds/impasse with v̂ > 0.05; or an accuracy drop > 2 pp with verifiable inhibition.

## Proposed experiment
Observatory: tasks with two plausible fixes; aggregation with/without a "generate a test that knocks down the other one" step.

## Current evidence
Model only (E[T] = m² checked by MC). Reported natural phenomenon (Seeley et al. 2012), analogy.

## Limits
Two options and symmetric support; with several options, inhibition can eliminate the correct one if the counterexample is false (f > 0).
