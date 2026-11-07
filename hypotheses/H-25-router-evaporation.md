---
id: H-25
title: "A router reinforced by acceptances needs decay: without it, readaptation grows with the history"
area: hypothesis
evidence: hypothesis
status: open
origin: "nature (nat-candidates C10; nat-pheromone-evaporation-aco; nat-physarum-network) + theory (th-model §8, §11)"
experiment: "sims (router across configurations with an abrupt distribution change) + observatory switching the task mixture mid-flow"
tags: [routing, stigmergy, lock-in, bounded-memory]
sources:
  - "Dorigo, M., Maniezzo, V. & Colorni, A. (1996). Ant system. IEEE Trans. SMC-B 26(1):29–41. doi:10.1109/3477.484436"
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, nat-candidates, nat-pheromone-evaporation-aco, nat-physarum-network, sim-stigmergy, H-07, H-16]
updated: 2026-11-07
summary: "A router that only accumulates successes gets stuck in the past: after a change, it takes a time proportional to its whole history to readapt; with decay, it takes a fixed time, at the price of some noise."
---

# H-25 — A router reinforced by acceptances needs decay: without it, readaptation grows with the history

**Status:** `open` · **Card evidence level:** `hypothesis` · **Origin:** nature (nat-candidates C10; nat-pheromone-evaporation-aco; nat-physarum-network) + theory (th-model §8, §11)

## Statement
If the router's weights are cumulative means of acceptances, after an abrupt change the past weighs less than 10% only after 9·T0 tasks (T0 = history). With an EWMA of rate λ, after ln 0.1/ln(1−λ) tasks, independent of T0. The price is stationary noise ∝ λ/(2−λ); there is a λ* that balances the two (like the λ* in §8).

## Variables
λ (or half-life), T0, rate of change of the distribution, noise of the acceptance signal.

## Prediction (quantitative/directional)
- T0 = 500: t90 = 4,500 (no decay) vs 229 / 45 / 22 / 10 with λ = 0.01 / 0.05 / 0.1 / 0.2 — ratio from 20× to 436× (nat-C10 asks for ≥ 3×).
- Stationary loss (no change) grows with λ; with λ ≤ 0.05, ≤ 5% (nat-C10 criterion) if the acceptance noise is moderate.

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
Readaptation without decay independent of the history T0; or any λ > 0 costing > 5% in the stationary regime.

## Proposed experiment
Simulation of a bandit-like router with an abrupt change; observatory switching the mixture (easy → coupled) mid-batch.

## Current evidence
Model only (formulas checked). sim-stigmergy (local-validation in the model) reports, on an analogous search problem, that without evaporation the trail grows without bound and later episodes get slower (P4 supported) — indirect support.

## Limits
A single abrupt change; gradual changes favor a smaller λ.
