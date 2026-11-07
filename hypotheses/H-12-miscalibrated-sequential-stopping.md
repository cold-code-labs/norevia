---
id: H-12
title: "Sequential stopping calibrated for independence underestimates the error under correlation"
area: hypothesis
evidence: hypothesis
status: open
origin: "theory (th-model §7.2; Wald) + literature (lit-adaptive-consistency, lit-early-stopping-sc)"
experiment: "sims (already reproducible in model.mjs: sprt_correlation) + observatory with stopping by vote margin"
tags: [sprt, optimal-stopping, self-consistency, correlated-errors]
sources:
  - "Wald, A. (1945). Sequential Tests of Statistical Hypotheses. Ann. Math. Statist. 16(2):117–186. doi:10.1214/aoms/1177731118"
  - "Wald, A. & Wolfowitz, J. (1948). Optimum Character of the Sequential Probability Ratio Test. Ann. Math. Statist. 19(3):326–339. doi:10.1214/aoms/1177730197"
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, lit-adaptive-consistency, lit-early-stopping-sc, H-05, H-08, H-01]
updated: 2026-11-07
summary: "Stopping sampling when the vote margin looks sufficient works if errors are independent; with correlated errors the confidence is illusory and the real error is several times the promised one."
---

# H-12 — Sequential stopping calibrated for independence underestimates the error under correlation

**Status:** `open` · **Card evidence level:** `hypothesis` · **Origin:** theory (th-model §7.2; Wald) + literature (lit-adaptive-consistency, lit-early-stopping-sc)

## Statement
An SPRT with margin m* = ⌈ln((1−α)/α)/ln(p0/(1−p0))⌉ applied to votes with correlation ρ has realized error E_P[1/(1 + (P/(1−P))^{m*})] > α, and the advantage of sequential stopping over a fixed vote of the same cost shrinks with ρ.

## Variables
p, ρ, α, p0, vote cap.

## Prediction (quantitative/directional)
- p = p0 = 0.7, α = 0.05 (m* = 4): realized error 0.03 / 0.09 / 0.14 / 0.20 / 0.24 for ρ = 0 / 0.05 / 0.1 / 0.2 / 0.3.
- Advantage over a fixed vote with the same mean no. of votes: 3× less error with ρ = 0; almost none (0.239 vs 0.245) with ρ = 0.3.
- Inflating the margin using the measured ρ restores the target error at a higher cost (proposed correction).

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
Realized error ≤ nominal α + 2 pp on tasks with ρ̂ ≥ 0.1.

## Proposed experiment
Observatory: sequential A-low samples with a margin rule; compare the error with hidden tests; estimate ρ per task.

## Current evidence
Model (exact formula checked by Monte Carlo, 40,000 tasks). The literature (author-reported) shows sample savings with a small average loss — the model predicts that the loss concentrates on high-ρ tasks/benchmarks.

## Limits
Binary answers; LLMs with many possible answers require a multi-hypothesis SPRT.
