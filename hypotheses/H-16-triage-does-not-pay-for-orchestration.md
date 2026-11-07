---
id: H-16
title: "Adaptive activation only pays off if triage costs less than the waste it avoids"
area: hypothesis
evidence: hypothesis
status: testing
origin: "guiding document (Adaptive Swarm Activation; \"um simples oi\" [a simple \"hi\"]) + theory (th-model §2.3, §9) + literature (lit-routellm, lit-frugalgpt)"
experiment: "observatory: adaptive controller vs A-low and vs C-elastic on a mixture with a variable fraction of trivial tasks"
tags: [adaptive-swarm-activation, routing, cost]
sources:
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, lit-routellm, lit-frugalgpt, lit-sas-vs-mas-hybrid, lit-debate-routing-matched-ceiling, lit-overthinking, nat-reflex-vs-cortex, H-05, H-06, H-18]
updated: 2026-11-07
summary: "Deciding how much to reason also has a cost: a controller is only worthwhile if its cost per task is lower than the waste it avoids — on trivial tasks, a direct answer beats any orchestration."
---

# H-16 — Adaptive activation only pays off if triage costs less than the waste it avoids

**Status:** `testing` · **Card evidence level:** `hypothesis` · **Origin:** guiding document (Adaptive Swarm Activation; "um simples oi" [a simple "hi"]) + theory (th-model §2.3, §9) + literature (lit-routellm, lit-frugalgpt)

## Statement
For a mixture of tasks, a controller with cost c_ctrl per task improves cost per success over the best fixed configuration only if c_ctrl < Σ_j w_j·[fixed_cost_j − adapted_cost_j] − (acceptance loss from routing errors)·V. On tasks with p(e_low) ≈ 1, any configuration beyond 1 low-effort call is dominated.

## Variables
mixture {w_j}, c_ctrl, routing accuracy, costs per configuration.

## Prediction (quantitative/directional)
- On trivial tasks (easy a*), A-low dominates all architectures in cost per success at equal acceptance.
- The controller's benefit grows with the heterogeneity of the mixture and disappears on homogeneous mixtures.

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
A controller with lower cost per success than the best fixed configuration on a homogeneous mixture; or a multi-agent architecture with lower cost per success than A-low on trivial tasks.

## Proposed experiment
Observatory: vary the fraction of trivial tasks (0%, 50%, 90%); measure total cost including triage.

## Current evidence
Model/argument only. Observatory smoke on a01: A-low was accepted at ~1/14 of the cost of C-decompose (1 run). Pilot (45 runs, 2–3 per cell, tasks a02/a04/a05/b01/b02): 100% acceptance in all architectures; cost per acceptance ~US$ 0.001 (A-low, A-low-loop, C-elastic) vs ~US$ 0.04 (A-high, class a) and ~US$ 0.03 (B-pipeline, class a) — **compatible direction**, but not conclusive (minimal sample, no CI, ceiling effect). Status becomes `testing`. Literature: routers/cascades reduce cost (`lit-routellm`, `lit-frugalgpt`, author-reported).

## Limits
The cost of triage can be amortized (caching, deterministic heuristics), which shifts the boundary.
