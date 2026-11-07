---
id: H-03
title: "On coupled tasks, 1 high-effort agent beats decomposition"
area: hypothesis
evidence: hypothesis
status: testing
origin: "theory (th-model §6, §4) + literature (lit-sas-equal-thinking-budget, lit-scaling-agent-systems; lit-synthesis candidate 3) + guiding document (\"bugs interdependentes\" [interdependent bugs])"
experiment: "observatory A-high vs C-decompose on b* tasks with coupled bugs (vary χ)"
tags: [decomposability, reasoning-effort, interdependent-bugs]
sources:
  - "Kim, Y. et al. (2025). Towards a Science of Scaling Agent Systems. arXiv:2512.08296v3"
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, lit-sas-equal-thinking-budget, lit-scaling-agent-systems, lit-rethinking-bounds-discussion, lit-mast, lit-synthesis, H-04, H-09]
updated: 2026-11-07
summary: "When subproblems depend on one another above a threshold that falls with the number of parts, splitting across agents loses information at the interfaces and 1 agent with high reasoning effort wins."
---

# H-03 — On coupled tasks, 1 high-effort agent beats decomposition

**Status:** `testing` · **Card evidence level:** `hypothesis` · **Origin:** theory (th-model §6, §4) + literature (lit-sas-equal-thinking-budget, lit-scaling-agent-systems; lit-synthesis candidate 3) + guiding document ("bugs interdependentes" [interdependent bugs])

## Statement
For a task with k subproblems and a fraction χ of coupled pairs, decomposition across k agents beats 1 agent with the same budget only if χ < χ* = [(k−1)ln(1−ι) + k ln(q_solo/q_split) − ln q_int] / [C(k,2) ln(1−μ)] ≈ 2ι/(kμ). For χ > χ*, A-high wins in acceptance and in cost per success.

## Variables
k, χ, ι (context interference in the solo agent), μ (loss per interface), q_int, budget E.

## Prediction (quantitative/directional)
- With ι = 0.08, μ = 0.15: χ* ≈ 0.45 (k = 2), 0.25 (k = 3), 0.14 (k = 4), ≈ 0.01 (k = 6) — χ* falls ∝ 1/k.
- On tasks with interdependent bugs (high χ), acceptance(A-high) − acceptance(C-decompose) > 0 and grows with k.
- Handoffs and rework (interface failures, MAST specification/coordination categories) concentrate in C-decompose on the coupled tasks.

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
C-decompose with acceptance ≥ A-high (95% CI) on tasks with χ ≥ 0.5 and k ≥ 3; or no trend with χ.

## Proposed experiment
Observatory: pairs of tasks with the same k and controlled χ (independent bugs vs bugs whose fix depends on shared invariants); A-high vs C-decompose vs A-mid; ≥ 10 repetitions. Estimate ι and μ by ablation (solo with 1 vs k parts; split with/without an interface contract).

## Current evidence
Observatory: smoke (4 runs) and pilot (45 runs; 100% acceptance in all architectures, including b01/b02 — ceiling effect, no coupled tasks hard enough) — no conclusion. Literature (author-reported): `lit-sas-equal-thinking-budget` and `lit-scaling-agent-systems` report a single agent matching/outperforming MAS on sequential/multi-hop tasks at equal budget (single agent wins from ~500 thinking tokens; −70% for MAS on sequential planning in PlanCraft, according to Kim et al.).

## Limits
Independent multiplicative losses; does not model interface repair or higher-order coupling.
