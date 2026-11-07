---
id: H-14
title: "Repair with a computable cap R* beats unlimited attempts or large fixed caps"
area: hypothesis
evidence: hypothesis
status: open
origin: "theory (th-model §7.5) + Norevia mission (bounded repair with return to rest) + literature (lit-selfheal)"
experiment: "observatory A-low-loop with variable cap R ∈ {1,2,4,8}; measure q_j per attempt"
tags: [bounded-healing, repair, optimal-stopping, persistent-responsibility]
sources:
  - "Chow, Y. S. & Robbins, H. (1963). On optimal stopping rules. Z. Wahrscheinlichkeitstheorie 2(1):33–49. doi:10.1007/BF00535296"
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, lit-selfheal, lit-mast, lit-s1-budget-forcing, nat-wound-healing-resolution, H-05]
updated: 2026-11-07
summary: "Repair attempts yield less and less; stopping when the chance of the next attempt does not pay for its cost and regression risk gives a computable cap that avoids endless loops."
---

# H-14 — Repair with a computable cap R* beats unlimited attempts or large fixed caps

**Status:** `open` · **Card evidence level:** `hypothesis` · **Origin:** theory (th-model §7.5) + Norevia mission (bounded repair with return to rest) + literature (lit-selfheal)

## Statement
If the probability that the j-th repair attempt fixes the problem decays geometrically (q_j = q1 δ^{j−1}) and each attempt costs c and regresses with prob. g (loss L_reg), the one-step policy ("keep trying while V q_j > c + g L_reg") is optimal and gives R*; caps above R* increase cost and regressions without a relevant acceptance gain.

## Variables
q1, δ, c, g, L_reg, V.

## Prediction (quantitative/directional)
- δ̂ < 1 (diminishing returns) in LLM repair attempts.
- V = 10, c = 1, g = 0.05, L_reg = 10: q1 = 0.6 → R* = 2 (δ = 0.4), 4 (δ = 0.7), 14 (δ = 0.9).
- Acceptance(R = 8) − acceptance(R = R*) < 3 pp, with cost ≥ 1.5×, when δ̂ ≤ 0.7.

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
δ̂ ≥ 1 (attempts do not lose effectiveness) or an acceptance gain > 5 pp above R*.

## Proposed experiment
Observatory: A-low-loop with cap R and a record of each attempt (test before/after, regressions).

## Current evidence
Model only (R* checked against exhaustive search). `lit-selfheal` reports that the critic adds few cases (author-reported).

## Limits
q_j may not be geometric (e.g. a jump after a change of strategy/diagnosis).
