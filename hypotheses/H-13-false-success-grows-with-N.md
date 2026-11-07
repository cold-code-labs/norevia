---
id: H-13
title: "With an imperfect verifier, false success grows with N and the precision of the accepted does not improve"
area: hypothesis
evidence: hypothesis
status: preliminary-support
origin: "theory (th-model §3) + literature (Stroebl et al.; lit-mast FM-3.x)"
experiment: "observatory best-of-N with visible tests as verifier and hidden tests as acceptance; sims/sim-verifier (done)"
tags: [false-success, verification, best-of-n, verifiable-acceptance]
sources:
  - "Stroebl, B., Kapoor, S. & Narayanan, A. The Limits of Inference Scaling Through Resampling. arXiv:2411.17501v3"
  - "Brown, B. et al. (2024). Large Language Monkeys. arXiv:2407.21787v3"
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, sim-verifier, lit-large-language-monkeys, lit-mast, H-02, H-05]
updated: 2026-11-07
summary: "Each extra attempt is a new chance for the verifier to approve something wrong: false success rises with the number of attempts, concentrated on the hardest tasks."
---

# H-13 — With an imperfect verifier, false success grows with N and the precision of the accepted does not improve

**Status:** `preliminary-support` · **Card evidence level:** `hypothesis` · **Origin:** theory (th-model §3) + literature (Stroebl et al.; lit-mast FM-3.x)

## Statement
In best-of-N, P_false(N) = (1−π)(1 − r^N) grows with N; the precision of the accepted is π (iid) and falls with N when there is heterogeneity/correlation (ρ > 0), because nearly unsolvable tasks consume attempts until a false acceptance.

## Variables
p, s, f, ρ, N.

## Prediction (quantitative/directional)
- Precision of the accepted(N = 8) ≥ precision of the accepted(N = 64) with ρ > 0 (p = 0.1, f = 0.01, ρ = 0.3: P_true 0.50 vs P_false 0.27 at N = 64).
- False successes concentrate on the tasks with the lowest p̂.
- Abstaining and escalating preserves verifiable acceptance better than "fallback to the vote".

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
Precision of the accepted increasing in N (95% CI) with a fixed verifier.

## Proposed experiment
Observatory: N ∈ {1,2,4,8,16}; mark acceptance by the verifier (visible) vs actual acceptance (hidden); stratify by difficulty.

## Current evidence
Simulation `sim-verifier` (local-validation in the model, preregistered): P2 supported — FS monotonic in N and the closed-form formula within the CI at 55/56 points; `bon-fallback` masks failures. No LLM measurement.

## Limits
Assumes a stationary verifier; LLM-judge verifiers may have a candidate-dependent f.
