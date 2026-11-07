---
id: H-22
title: "Reading k fixed peers is enough in macro-swarms — because errors are correlated"
area: hypothesis
evidence: hypothesis
status: open
origin: "nature (nat-candidates C07; nat-topological-neighbors — starlings, Ballerini et al. 2008; Young et al. 2013) + theory (th-model §11)"
experiment: "observatory: aggregation with N ∈ {6, 12, 24} and reading k ∈ {2, 4, 6, N−1} peers; sims with controlled ρ"
tags: [topology, communication, macro-swarm, correlated-errors]
sources:
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, nat-candidates, nat-topological-neighbors, nat-physarum-network, H-07, H-11, H-01]
updated: 2026-11-07
summary: "In large groups, each agent can read only a few colleagues: the model predicts this is enough when errors are correlated (there is little to gain by reading more), but not when they are independent."
---

# H-22 — Reading k fixed peers is enough in macro-swarms — because errors are correlated

**Status:** `open` · **Card evidence level:** `hypothesis` · **Origin:** nature (nat-candidates C07; nat-topological-neighbors — starlings, Ballerini et al. 2008; Young et al. 2013) + theory (th-model §11)

## Statement
If each agent decides by the majority of itself + k peers, the smallest k that stays within 3 pp of the full read (k*) saturates at a small value independent of N when ρ ≳ 0.3, and grows with N when ρ ≈ 0. The read cost falls from N(N−1) to N·k*.

## Variables
N, k, p, ρ.

## Prediction (quantitative/directional)
- p = 0.7, ρ = 0.3: k* = 2, 2, 4, 4 for N = 7, 13, 25, 51.
- p = 0.6, ρ = 0: k* = 4, 10, 20, 38 (grows with N).
- Disagreement with nat-C07 ("k* ≤ 4 independent of N") predicted for ρ̂ ≈ 0.

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
k* growing with N with ρ̂ ≥ 0.3; or k* constant and small with ρ̂ ≈ 0 (then the mechanism is not correlation).

## Proposed experiment
Observatory/sims: measure ρ̂ from pairs and the accuracy by (N, k).

## Current evidence
Model only. Natural phenomenon reported in starlings (≈ 6–7 topological neighbors; optimum independent of N, according to the nat-* cards), which is an analogy, not proof.

## Limits
Simple majority; does not model propagation over multiple rounds (information cascades).
