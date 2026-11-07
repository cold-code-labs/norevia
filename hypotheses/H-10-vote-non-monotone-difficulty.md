---
id: H-10
title: "With a mixture of difficulties, vote accuracy can rise and then fall with N"
area: hypothesis
evidence: hypothesis
status: open
origin: "literature (lit-more-llm-calls, Chen et al. 2024) + theory (th-model §2.4) + nature (nat-candidates C02; nat-small-groups-correlated-cues — Kao & Couzin 2014: a finite, small group size maximizes accuracy when part of the information is shared)"
experiment: "observatory B-vote with N ∈ {1,3,5,9,15} on a set with easy and hard tasks; sims"
tags: [majority-vote, difficulty, scaling]
sources:
  - "Chen, L. et al. (2024). Are More LLM Calls All You Need? arXiv:2403.02419v2"
  - "Kao, A. B. & Couzin, I. D. (2014). Decision accuracy in complex environments is often maximized by small group sizes. Proc. R. Soc. B 281(1784):20133305. doi:10.1098/rspb.2013.3305"
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, lit-more-llm-calls, lit-snell-test-time-compute, nat-small-groups-correlated-cues, nat-informed-leaders, nat-candidates, H-01]
updated: 2026-11-07
summary: "When some of the tasks mislead most agents, more votes make those tasks worse, and total accuracy can rise and then fall with the number of agents."
---

# H-10 — With a mixture of difficulties, vote accuracy can rise and then fall with N

**Status:** `open` · **Card evidence level:** `hypothesis` · **Origin:** literature (lit-more-llm-calls, Chen et al. 2024) + theory (th-model §2.4) + nature (nat-candidates C02; nat-small-groups-correlated-cues — Kao & Couzin 2014: a finite, small group size maximizes accuracy when part of the information is shared)

## Statement
In a set with a fraction w_h of items with p < ½, A(N) = Σ w_j A_N(p_j) has a finite interior maximum N* when w_h is large enough; on the items with p < ½, A_N decreases with N.

## Variables
mixture {w_j, p_j}, ρ_j, N.

## Prediction (quantitative/directional)
- 80% p = 0.8 + 20% p = 0.3 → maximum at N = 15; 50% p = 0.75 + 50% p = 0.35 → N = 5; 30% p = 0.9 + 70% p = 0.4 → N = 1.
- The observed N* is predictable from p_j estimated with few samples per item (cf. `lit-more-llm-calls`).
- Form of nat-C02 (Kao & Couzin): with a fraction q of agents with independent evidence of accuracy a, accuracy is monotonic in N if q·a > 1/2 and has a small interior maximum (3–7) if q·a < 1/2 — same mechanism (the majority, lacking its own evidence, errs together).

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
Accuracy monotonic in N even with ≥ 20% of items with p̂ < 0.5; or items with p̂ < 0.5 improving with N.

## Proposed experiment
Observatory: estimate p per task with 10 A-low samples; form mixtures; measure A(N).

## Current evidence
Model; report by Chen et al. (2024) — `lit-more-llm-calls` (author-reported).

## Limits
Binary; with many possible answers, p < ½ does not imply that the error is the majority.
