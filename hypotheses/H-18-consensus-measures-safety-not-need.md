---
id: H-18
title: "Consensus signals indicate when to stop, not when to expand"
area: hypothesis
evidence: hypothesis
status: open
origin: "literature (lit-debate-routing-matched-ceiling; lit-synthesis candidate 4) + theory (th-model §10.4)"
experiment: "observatory: compare controllers with stimulus = disagreement vs stimulus = visible-test/verifier failure; measure the fraction of unanimous errors"
tags: [adaptive-swarm-activation, routing, correlated-errors, activation-signal]
sources:
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, lit-debate-routing-matched-ceiling, lit-early-stopping-sc, lit-adaptive-consistency, lit-synthesis, H-06, H-12, H-16]
updated: 2026-11-07
summary: "When agents err together, unanimity does not prove success: disagreement signals help save (stop early), but not to discover when more effort is needed — that requires an external signal, such as tests."
---

# H-18 — Consensus signals indicate when to stop, not when to expand

**Status:** `open` · **Card evidence level:** `hypothesis` · **Origin:** literature (lit-debate-routing-matched-ceiling; lit-synthesis candidate 4) + theory (th-model §10.4)

## Statement
The fraction of majority errors in which the N votes are unanimous and wrong is E[(1−P)^N]/(1 − A_N), increasing in ρ; therefore a controller whose stimulus is disagreement misses that fraction of the expansion needs, while an external stimulus (test/verifier failure) does not depend on ρ.

## Variables
N, p, ρ, stimulus type.

## Prediction (quantitative/directional)
- N = 3, p = 0.7: unanimous errors = 12.5% (ρ = 0), 35.5% (ρ = 0.3), 61% (ρ = 0.6).
- A disagreement-based controller recovers < 40% of the gain of an oracle router when ρ̂ ≥ 0.3; a test/verifier-based controller recovers more.
- Agreement between wrong samples of the same model predicted ≈ 0.11 in the Llama-3-8B/MATH case (via K_eff ≈ 9.4, th-model §10.3).

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
A disagreement-based controller recovering ≥ 60% of the oracle gain on tasks with ρ̂ ≥ 0.3; or a fraction of unanimous errors unrelated to ρ̂.

## Proposed experiment
Observatory: on each task, 3–5 A-low samples; mark unanimous errors; compare two expansion rules (disagreement vs visible tests) in cost per acceptance.

## Current evidence
Model; author-reported: 66% of the cases in which debate helps have a unanimous, wrong vote, and vote entropy recovers only 11–19% of the oracle gain (lit-debate-routing-matched-ceiling). In the model, 66% requires ρ ≈ 0.55–0.7 (N = 3) — an order-of-magnitude check, different conditioning.

## Limits
Binary; plurality with dispersed errors reduces unanimous-wrong cases.
