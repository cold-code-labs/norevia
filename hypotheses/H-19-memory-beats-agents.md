---
id: H-19
title: "Memory of validated trajectories yields more per cost than extra agents"
area: hypothesis
evidence: hypothesis
status: open
origin: "literature (lit-agentnet; lit-synthesis candidate 6) + theory (th-model §2: vote ceiling)"
experiment: "observatory: A-low with memory of accepted solutions (dev tasks) vs B-vote5 without memory, on held-out tasks"
tags: [bounded-memory, specialization, cost-per-success]
sources:
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, lit-agentnet, lit-synthesis, sim-clonal, nat-clonal-expansion-contraction, H-01, H-15]
updated: 2026-11-07
summary: "Storing and reusing solutions that passed verification raises each agent's success, which is worth more than adding agents when errors are correlated."
---

# H-19 — Memory of validated trajectories yields more per cost than extra agents

**Status:** `open` · **Card evidence level:** `hypothesis` · **Origin:** literature (lit-agentnet; lit-synthesis candidate 6) + theory (th-model §2: vote ceiling)

## Statement
Since the vote saturates at the ceiling 1 − I_{1/2}(a,b), raising each agent's p (e.g. with memory of accepted trajectories) shifts the ceiling and the gain per cost, while increasing N only approaches the ceiling; with ρ > 0, +Δp in 1 agent beats +ΔN agents at the same cost for a modest Δp.

## Variables
p with/without memory, N, ρ, cost of maintaining the memory (context tokens, curation).

## Prediction (quantitative/directional)
- Model example: p = 0.6, ρ = 0.1 — 1 agent with p = 0.7 (0.70) beats a vote of 5 with p = 0.6 (0.655) at ~1/5 of the generation cost.
- In the observatory: acceptance(A-low + memory) ≥ acceptance(B-vote5) at lower cost, on tasks from the same family as those used to build the memory.

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
Memory with no gain in p̂ on held-out tasks, or B-vote5 with lower cost per acceptance.

## Proposed experiment
Observatory: separate dev tasks (build the memory) from held-out tasks (evaluation); measure p̂ and cost per acceptance.

## Current evidence
Author-reported: in AgentNet, accumulated memory yields 7–10 points, while going from 3 to 9 agents yields 0.8 (`lit-agentnet`). Simulation `sim-clonal` (local-validation in the model; a different design — recurring incidents): per-type memory cuts recovery from 11.8 to 9.8 steps at +3% cost (P4 supported) — indirect support.

## Limits
Unvalidated memory can reinforce errors (see the bounded-memory caveats in the canonical study); curation cost not modeled.
