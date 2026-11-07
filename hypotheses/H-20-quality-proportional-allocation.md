---
id: H-20
title: "Allocating attempts in proportion to verified partial quality beats uniform sampling"
area: hypothesis
evidence: hypothesis
status: open
origin: "nature (nat-candidates C05b; nat-waggle-dance-recruitment; nat-recruitment-benefit-conditions) + theory (th-model §3: P varies by task)"
experiment: "observatory: uniform best-of-N vs refinement of the candidates with the largest fraction of visible tests passing (exploration floor)"
tags: [recruitment, best-of-n, budget-allocation]
sources:
  - "Passino, K. M. & Seeley, T. D. (2006). Modeling and analysis of nest-site selection by honeybee swarms: the speed and accuracy trade-off. Behav. Ecol. Sociobiol. 59(3):427–442. doi:10.1007/s00265-005-0067-y"
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, nat-candidates, nat-waggle-dance-recruitment, nat-recruitment-benefit-conditions, lit-snell-test-time-compute, lit-large-language-monkeys, H-02, H-05]
updated: 2026-11-07
summary: "Like honeybees that dance more for better sources, spending more attempts on the candidates that already pass more tests should solve more tasks with the same budget — but only when there is a reliable partial signal."
---

# H-20 — Allocating attempts in proportion to verified partial quality beats uniform sampling

**Status:** `open` · **Card evidence level:** `hypothesis` · **Origin:** nature (nat-candidates C05b; nat-waggle-dance-recruitment; nat-recruitment-benefit-conditions) + theory (th-model §3: P varies by task)

## Statement
When there is a partial signal (fraction of visible tests passing) correlated with final correctness, allocating the attempt budget in proportion to that signal (with a minimum exploration floor) increases pass@budget relative to N uniform samples; without a reliable partial signal, the advantage disappears.

## Variables
budget B, correlation partial signal × correctness, exploration floor, density of solutions for the task.

## Prediction (quantitative/directional)
- Directional: pass@B(proportional) > pass@B(uniform) when the correlation partial signal × final acceptance > 0.3.
- On tasks with abundant solutions (high p), the advantage disappears — like the benefit of communicating food sources, which disappears when food is abundant (nat-recruitment-benefit-conditions).

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
No gain with an informative partial signal, or a gain with a non-informative partial signal (would indicate another mechanism).

## Proposed experiment
Observatory: b* tasks with several visible tests; two allocators with the same token budget.

## Current evidence
None locally. Natural phenomenon described in the nat-* cards (analogy, not proof for LLMs). No closed-form derivation in this model.

## Limits
Not formally derived in th-model; registered from nature.
