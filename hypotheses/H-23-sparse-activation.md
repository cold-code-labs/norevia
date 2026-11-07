---
id: H-23
title: "Sparse activation (2–3 of 12) matches dense activation only if the router is almost always right"
area: hypothesis
evidence: hypothesis
status: open
origin: "nature (nat-candidates C08; nat-brain-energy-sparse — energy budget and sparse coding) + theory (th-model §11)"
experiment: "observatory: 12 specialists (distinct prompts/tools) with a cheap router vs dense activation, same verifier"
tags: [sparse-activation, routing, macro-swarm, cost]
sources:
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, nat-candidates, nat-brain-energy-sparse, lit-routellm, H-16, H-06]
updated: 2026-11-07
summary: "Like the brain, which activates only a small fraction of its neurons, a large swarm can activate 2–3 specialists per task at 1/4 of the cost — but only if whoever picks the specialists rarely gets it wrong."
---

# H-23 — Sparse activation (2–3 of 12) matches dense activation only if the router is almost always right

**Status:** `open` · **Card evidence level:** `hypothesis` · **Origin:** nature (nat-candidates C08; nat-brain-energy-sparse — energy budget and sparse coding) + theory (th-model §11)

## Statement
With N specialists of which m are competent on the task (success pc) and a verifier, activating k ≪ N chosen by a router (each slot hits a competent one with prob. r) reaches acceptance ≈ Σ_j Bin(j; k, r)·[1 − (1−pc)^{min(j,m)}] against 1 − (1−pc)^m for dense, at k/N of the cost. The difference is dominated by r.

## Variables
N, m, pc, k, r (router quality), router cost.

## Prediction (quantitative/directional)
- N = 12, m = 3, pc = 0.6: k = 3 → 0.90 (r = 0.9), 0.80 (r = 0.7), 0.66 (r = 0.5) vs dense 0.936; cost 25%.
- k = 4 with r = 0.9 stays 0.6 pp from dense at 33% of the cost.
- The nat-C08 criterion (≥ dense − 2 pp at ≤ 25% of the cost) is only attainable if r ≥ ~0.94 with k = 3.

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
Sparse with acceptance ≥ dense − 2 pp with a measured router r < 0.8; or acceptance growing ~linearly up to k = 12.

## Proposed experiment
Observatory: measure r (did the router pick a specialist that, alone, would solve it?) and acceptance by k.

## Current evidence
Model only (formula checked by MC). The natural phenomenon (cortical sparsity) is an analogy.

## Limits
Assumes disjoint competences and a perfect verifier; partially competent specialists soften the dependence on r.
