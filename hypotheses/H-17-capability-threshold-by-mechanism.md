---
id: H-17
title: "The capability threshold above which cooperating stops paying off depends on the aggregation mechanism"
area: hypothesis
evidence: hypothesis
status: open
origin: "literature (lit-scaling-agent-systems: diminishing returns above ~45%; lit-synthesis candidate 1) + theory (th-model §10.1)"
experiment: "observatory: stratify tasks by the single agent's p̂; measure the gain of A-low-loop/C-elastic (selection by tests) and of B-vote3 vs p̂"
tags: [capability-threshold, collective-efficiency-law, kim-baseline]
sources:
  - "Kim, Y. et al. (2025). Towards a Science of Scaling Agent Systems. arXiv:2512.08296v3"
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, lit-scaling-agent-systems, lit-sas-vs-mas-hybrid, lit-more-agents, lit-synthesis, H-01, H-02]
updated: 2026-11-07
summary: "The ~45% single-agent success threshold reported by Kim et al. may not be a constant: the model predicts the gain from cooperating peaks near 50% when cooperation is \"more attempts + verification\" and near 79% when it is a vote."
---

# H-17 — The capability threshold above which cooperating stops paying off depends on the aggregation mechanism

**Status:** `open` · **Card evidence level:** `hypothesis` · **Origin:** literature (lit-scaling-agent-systems: diminishing returns above ~45%; lit-synthesis candidate 1) + theory (th-model §10.1)

## Statement
The absolute gain from adding the 2nd verified agent is g(p) = ps(1−f) − p²s(s−f) (peak at p* = (1−f)/(2(s−f))); that of the 3rd voter is (2p−1)p(1−p) (peak at (3+√3)/6 ≈ 0.79). Hence, the capability threshold beyond which cooperating yields less and less depends on the mechanism; the gain relative to the single agent falls monotonically with p in both.

## Variables
single agent's p̂ per task, mechanism (verified selection vs vote), s, f, ρ.

## Prediction (quantitative/directional)
- Verified selection: maximum absolute gain for p̂ ∈ [0.4; 0.6] (p* = 0.50 with a perfect verifier; 0.56 with s = 0.9, f = 0.05).
- Vote 1 → 3: maximum gain for p̂ ∈ [0.7; 0.85].
- Relative gain (over the single agent) decreasing in p̂ for both mechanisms.
- Refinement of the baseline: including the mechanism as a moderator improves the prediction of the gain compared with using P_SA alone (compare out-of-sample R² with the form of Kim et al.).

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
Peaks of the two mechanisms indistinguishable (difference < 0.1 in p̂, 95% CI), or absolute gain monotonic in p̂.

## Proposed experiment
Observatory: tasks with varied p̂ (10 A-low runs per task); compare the gain from selection by tests and from voting per p̂ band. Design implication: the pilot had 100% acceptance in all architectures (p̂ ≈ 1), a region where the model predicts a gain ≈ 0 for any swarm; tasks with p̂(A-low) between 0.2 and 0.8 are needed.

## Current evidence
Model only (peak checked numerically). The ~45% figure is a report by Kim et al. (lit-scaling-agent-systems) on real MAS architectures, not on this isolated mechanism; we claim no novelty about the existence of the threshold.

## Limits
Kim et al. measure complete architectures (with communication and orchestration), not pure mechanisms; the comparison is directional.
