---
id: H-09
title: "The knee of the success × effort curve decides between concentrating and splitting the budget"
area: hypothesis
evidence: hypothesis
status: open
origin: "theory (th-model §4) + literature (lit-nothinking vs lit-sas-equal-thinking-budget)"
experiment: "observatory A-low/A-mid/A-high per task class (fit p(e)) + comparison 1×E vs N×E/N"
tags: [reasoning-effort, equal-budget, collective-efficiency-law]
sources:
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, sim-correlated-vote, lit-nothinking, lit-sas-equal-thinking-budget, lit-snell-test-time-compute, lit-s1-budget-forcing, lit-inverse-scaling-ttc, H-03]
updated: 2026-11-07
summary: "If the task requires a minimum of chained reasoning, concentrating the budget in 1 agent wins; if returns to effort are diminishing, several cheap attempts win — and the tipping point can be computed from the success × effort curve."
---

# H-09 — The knee of the success × effort curve decides between concentrating and splitting the budget

**Status:** `open` · **Card evidence level:** `hypothesis` · **Origin:** theory (th-model §4) + literature (lit-nothinking vs lit-sas-equal-thinking-budget)

## Statement
With Hill capability p(e) = p_hi (e/h)^β/(1 + (e/h)^β), at equal budget, N agents with effort e_N = E/N − c0(N−1)/(N c1) beat 1 agent with effort E (with a verifier) approximately when e_N > e_knee = h(β−1)^{1/β} (always, if β ≤ 1).

## Variables
h, β (fitted per task class), E, N, c0 (overhead per call), ρ.

## Prediction (quantitative/directional)
- In the model, the criterion gets the winner right in 94% of the grid (β ∈ {0.5..3}, h ∈ {1,4,16}, N ∈ {2,4,8}).
- On LLMs: the criterion gets the winner right in ≥ 80% of the task classes.
- Tasks with β̂ > 1 and high h (chained reasoning) favor A-high; tasks with β̂ ≤ 1 favor cheap parallel sampling.

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
Criterion hit rate ≤ 60%; or non-monotonic p(e) (negative returns, `lit-inverse-scaling-ttc`) in most classes, which invalidates the premise.

## Proposed experiment
Observatory: for each class, measure acceptance at 3–4 effort levels (A-low, A-mid, A-high), fit (h, β), predict and test 1×E vs N×E/N (B-vote/best-of-N with the same budget).

## Current evidence
Model (numerical grid). `sim-correlated-vote` (in the model, another p(e) family): the region where the vote wins at equal budget shrinks when returns to effort are less diminishing — consistent direction. Literature with opposite results by task (`lit-nothinking`, `lit-sas-equal-thinking-budget`).

## Limits
Heuristic criterion (not a theorem); per-call overhead and saturation p_hi < 1 shift the boundary.
