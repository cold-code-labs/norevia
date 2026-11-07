---
id: H-04
title: "A micro-swarm (2–3) wins on decomposable, low-coupling tasks"
area: hypothesis
evidence: hypothesis
status: testing
origin: "theory (th-model §6, §9) + guiding document (micro-swarms) + literature (lit-scaling-agent-systems; lit-synthesis candidate 3) + nature (nat-small-groups-correlated-cues: Kao & Couzin 2014, small groups maximize accuracy with correlated cues)"
experiment: "observatory C-decompose (N = k) and B-pipeline (executor + verifier) vs A-high and vs N > k on independent b* tasks"
tags: [micro-swarm, decomposability, elastic-swarm]
sources:
  - "Gunther, N. J. (2008). A General Theory of Computational Scalability Based on Rational Functions. arXiv:0808.1431v2"
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, lit-scaling-agent-systems, lit-agentnet, lit-swarmsys, lit-macnet, lit-synthesis, nat-small-groups-correlated-cues, H-03, H-11]
updated: 2026-11-07
summary: "On tasks with 2–3 nearly independent parts, splitting across 2–3 agents (or executor + verifier) matches or beats 1 high-effort agent at lower or equal cost, and growing beyond that adds nothing."
---

# H-04 — A micro-swarm (2–3) wins on decomposable, low-coupling tasks

**Status:** `testing` · **Card evidence level:** `hypothesis` · **Origin:** theory (th-model §6, §9) + guiding document (micro-swarms) + literature (lit-scaling-agent-systems; lit-synthesis candidate 3) + nature (nat-small-groups-correlated-cues: Kao & Couzin 2014, small groups maximize accuracy with correlated cues)

## Statement
For k ∈ {2, 3} and χ < χ*, a micro-swarm of k agents (or executor + verifier) has cost per success ≤ that of A-high and acceptance ≥; expanding to N > k (macro) does not increase acceptance and increases cost (coordination, §5).

## Variables
k, χ, N, σ/κ (coordination), c(e).

## Prediction (quantitative/directional)
- On decomposable tasks (χ ≈ 0, k = 2–3): cost per success(micro) ≤ cost per success(A-high) and acceptance(micro) ≥ acceptance(A-high) − 2 pp.
- Acceptance(N = 2k) − acceptance(N = k) ≤ 1 pp, with cost ≥ 1.5×.
- The gain of micro over solo grows with ι (context interference), i.e., with the size of each part.

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
A-high with lower cost per success **and** higher acceptance (95% CI) on the decomposable tasks; or macro (N > k) improving acceptance by > 3 pp.

## Proposed experiment
Observatory: tasks b01/b02 (multi-module kits) and variants with k = 2, 3, 4 independent parts; architectures A-high, A-mid, C-decompose, B-pipeline; ≥ 10 repetitions.

## Current evidence
Observatory in smoke: on b01, A-low and C-decompose were accepted (1 run each; C-decompose cost ~2.7×) — **not conclusive**. Literature: `lit-agentnet` (small and diminishing gain with more agents), `lit-swarmsys`/`lit-macnet` (saturation) — author-reported. Kim et al. (`lit-scaling-agent-systems`) report +80.8% on a decomposable task with central orchestration, which also contains error amplification (4.4× vs 17.2× in independent agents) — compatible with the "low χ" side of the model; it is the baseline to beat. Observatory pilot (results/observatory/runs-pilot.jsonl, 45 runs, 2–3 per cell): 100% acceptance in all 9 architectures (ceiling effect: tasks too easy to discriminate) — no effect on status.

## Limits
If the task is easy (p(e_low) ≈ 1), no swarm pays off (see H-16).
