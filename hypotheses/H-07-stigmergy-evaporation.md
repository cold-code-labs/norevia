---
id: H-07
title: "Stigmergy with evaporation reduces communication and avoids stale signals"
area: hypothesis
evidence: hypothesis
status: preliminary-support
origin: "nature (nat-stigmergy, nat-pheromone-evaporation-aco; Theraulaz & Bonabeau 1999; Ant System) + theory (th-model §5, §8) + literature (lit-agentprune)"
experiment: "sims/sim-stigmergy (proposed: environment that changes at rate h) + observatory with a state board vs direct messages"
tags: [stigmergy, communication, bounded-memory]
sources:
  - "Theraulaz, G. & Bonabeau, E. (1999). A Brief History of Stigmergy. Artificial Life 5(2):97–116. doi:10.1162/106454699568700"
  - "Dorigo, M., Maniezzo, V. & Colorni, A. (1996). Ant system. IEEE Trans. SMC-B 26(1):29–41. doi:10.1109/3477.484436"
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, nat-stigmergy, nat-pheromone-evaporation-aco, sim-stigmergy, nat-candidates, H-25, lit-agentprune, lit-gptswarm, H-11]
updated: 2026-11-07
summary: "Coordinating through a shared board whose signals evaporate trades the quadratic communication of all-to-all for a linear cost, and the right evaporation keeps the group from following old information."
---

# H-07 — Stigmergy with evaporation reduces communication and avoids stale signals

**Status:** `preliminary-support` · **Card evidence level:** `hypothesis` · **Origin:** nature (nat-stigmergy, nat-pheromone-evaporation-aco; Theraulaz & Bonabeau 1999; Ant System) + theory (th-model §5, §8) + literature (lit-agentprune)

## Statement
Indirect coordination through a board (write/read) costs 2N messages per round vs N(N−1) for all-to-all; with the environment changing at rate h, the fraction of stale information in the signal is h/(h+λ), and there is a λ* that minimizes the error (λ* ≈ 0.24 / 0.44 / 0.65 for h = 0.01 / 0.05 / 0.2 in the example).

## Variables
N, topology, λ (evaporation/TTL), h (rate of change of the environment/task state), noise.

## Prediction (quantitative/directional)
- For N ≥ 5, communication tokens fall by ≥ 50% (board vs all-to-all) with equal acceptance (±2 pp).
- Without evaporation (λ → 0) the error from stale information grows with task time; with very high λ, variance dominates — a U-shaped curve of error vs λ.
- The measured λ* grows with h.

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
No U-shaped curve in λ (monotonic error), or board acceptance < all-to-all − 2 pp at N ≥ 5.

## Proposed experiment
Simulation: foraging/search with a moving target; measure error vs λ and h. Observatory: b* tasks with shared state (status file with TTL) vs message exchange.

## Current evidence
Simulation `sim-stigmergy` (local-validation in the model, preregistered): a shared trail with evaporation ε ≈ 0.1 finds targets as fast as all-to-all messages (95 vs 97 steps with 4 agents; 22.5 vs 24 with 16) with zero messages against 1,165–5,778 per episode; U-shaped curve in evaporation (P2) and lock-in without evaporation (P4) supported; P3 (messages faster) not supported — which favors the hypothesis. **Scope: only in the simulated model**, no test on an LLM. Model: formula h/(h+λ) checked by discrete simulation. `lit-agentprune` (author-reported): pruning messages cuts 28–73% of tokens without loss of accuracy.

## Limits
Pheromone is a scalar; LLM task state is structured and needs versioning (see the caveats of the canonical study on bounded memory).
