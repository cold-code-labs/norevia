---
id: H-21
title: "Launching attempts in proportion to recent acceptances makes the swarm contract on its own on infeasible tasks"
area: hypothesis
evidence: hypothesis
status: open
origin: "nature (nat-candidates C06; nat-interaction-rate-foraging — harvester ants, Gordon et al. 2008; Prabhakar et al. 2012) + theory (th-model §11)"
experiment: "sims (flow of feasible/infeasible subtasks, rule x_{t+1} = ε + g·acceptances) + observatory on a task flow with an infeasible part"
tags: [elastic-swarm, recruitment, contraction, false-success]
sources:
  - "Harris, T. E. (1963). The Theory of Branching Processes. Springer. doi:10.1007/978-3-642-51866-9"
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, nat-candidates, nat-interaction-rate-foraging, nat-clonal-expansion-contraction, sim-elastic, sim-clonal, H-05, H-13, H-24]
updated: 2026-11-07
summary: "Like ants that go out to forage in proportion to the nestmates returning with food, launching new attempts in proportion to recent acceptances makes the swarm grow where there is success and shrink where there is none — without estimating difficulty beforehand."
---

# H-21 — Launching attempts in proportion to recent acceptances makes the swarm contract on its own on infeasible tasks

**Status:** `open` · **Card evidence level:** `hypothesis` · **Origin:** nature (nat-candidates C06; nat-interaction-rate-foraging — harvester ants, Gordon et al. 2008; Prabhakar et al. 2012) + theory (th-model §11)

## Statement
In a workflow in which each round launches x_t attempts and the next one launches x_{t+1} = ε + g·(acceptances in the round), the mean follows x_{t+1} = ε + g·a·x_t with a = ps + (1−p)f. The swarm contracts to ε/(1 − g·a) if g·a < 1 and expands up to the cap if g·a ≥ 1. Expanding on feasible tasks and contracting on infeasible ones requires 1/(p·s) < g < 1/f; false acceptance f limits the usable gain.

## Variables
g (recruitment gain), ε (exploration floor), p, s, f, cap, observation window.

## Prediction (quantitative/directional)
- Infeasible (p = 0, f = 0.05, ε = 0.2): ~0.21–0.25 calls/round for g ∈ {1, 2, 4}, against N calls for a fixed swarm (≥ 50% fewer calls, nat-C06 criterion).
- Feasible with p = 0.7: g = 1 does not expand (0.57/round); g ≥ 2 expands up to the cap.
- With high f (e.g. 0.25) and g = 4, infeasible tasks stop contracting (g·f ≥ 1): waste explodes.

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
No contraction on infeasible tasks with g·f < 1, or a delay > 20% on feasible ones against the best fixed N (nat-C06 criterion).

## Proposed experiment
Simulation: mixed feasible/infeasible flow, sweep g, ε and f. Observatory: batch of tasks with a fraction having no acceptable solution (impossible tests), measure wasted calls and time to the 1st acceptance.

## Current evidence
Model only (mean dynamics checked in model.test.mjs). Natural phenomenon in the nat-* cards (analogy). sim-elastic and sim-clonal test related elastic rules, not this one.

## Limits
Mean dynamics (no fluctuations); in short flows, the variance of x_t can extinguish recruitment too early (risk of a low floor ε).
