---
id: H-15
title: "Reducing correlation (diversity) yields more than increasing N — if individual quality does not drop"
area: hypothesis
evidence: hypothesis
status: open
origin: "theory (th-model §2) + literature (lit-correlated-errors, lit-diversity-of-thought; counterpoint lit-self-moa)"
experiment: "observatory homogeneous vs heterogeneous B-vote5 (different prompts/approaches/models) vs B-vote with larger N"
tags: [diversity, correlated-errors, majority-vote]
sources:
  - "Ladha, K. K. (1992). The Condorcet Jury Theorem, Free Speech, and Correlated Votes. Am. J. Polit. Sci. 36(3):617ss. doi:10.2307/2111584"
  - "Kim, E., Garg, A., Peng, K. & Garg, N. (2025). Correlated Errors in Large Language Models. arXiv:2506.07962v1"
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, lit-correlated-errors, lit-great-models-think-alike, lit-diversity-of-thought, lit-self-moa, lit-hong-page-diversity, lit-diverse-debate-hegazy, nat-candidates, H-01, H-20]
updated: 2026-11-07
summary: "Five agents that err in different ways are worth more than twenty that err the same way — as long as the diversity does not come at the cost of much worse agents."
---

# H-15 — Reducing correlation (diversity) yields more than increasing N — if individual quality does not drop

**Status:** `open` · **Card evidence level:** `hypothesis` · **Origin:** theory (th-model §2) + literature (lit-correlated-errors, lit-diversity-of-thought; counterpoint lit-self-moa)

## Statement
For fixed p, ∂A_N/∂ρ dominates ∂A_N/∂N outside the ρ ≈ 0 regime: with p = 0.7, reducing ρ from 0.3 to 0.1 at N = 5 gives +5.0 pp (0.744 → 0.794), while going from N = 5 to N = 21 at ρ = 0.3 gives +2.0 pp (0.744 → 0.765). The trade pays off as long as the drop in p of the diverse members is smaller than the gain via ρ.

## Variables
p_i (per member), ρ (homogeneous vs heterogeneous), N.

## Prediction (quantitative/directional)
- A heterogeneous panel of 5 with mean p̂ ≥ p̂_homogeneous − 3 pp outperforms a homogeneous one of 15–21.
- If p̂ drops more than that, the homogeneous one wins (consistent with `lit-self-moa`).
- nat-C05(a) (Lorenz effect): exposing agents to their peers' answers **before** they answer increases ρ̂ and reduces dispersion without reducing error — in the model, this can only lower the vote ceiling.

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
Heterogeneous ρ̂ ≈ homogeneous ρ̂ (diversity does not decorrelate) or the heterogeneous panel loses at equal p̂.

## Proposed experiment
Observatory: measure ρ between homogeneous and heterogeneous pairs; compare votes of the same cost.

## Current evidence
Model. Mixed literature (author-reported): `lit-correlated-errors` (different models still err together), `lit-diversity-of-thought` (diversity of approach helps), `lit-self-moa` (quality > diversity).

## Limits
Assumes ρ and p are separable; in practice diversity and quality are coupled.
