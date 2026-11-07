---
id: H-11
title: "Coordination cost follows the Universal Scalability Law, peaking at N_max"
area: hypothesis
evidence: hypothesis
status: open
origin: "theory (th-model §5; Gunther USL) + literature (saturation in lit-macnet, lit-swarmsys)"
experiment: "observatory: sweep N ∈ {1,2,3,5,8} on a decomposable task with star / board / all-to-all topologies; fit USL"
tags: [coordination, usl, topology, macro-swarm]
sources:
  - "Gunther, N. J. (1993). A Simple Capacity Model of Massively Parallel Transaction Systems. CMG National Conference (gap: full text not opened)"
  - "Gunther, N. J. (2008). A General Theory of Computational Scalability Based on Rational Functions. arXiv:0808.1431v2"
  - "Amdahl, G. M. (1967). AFIPS '67 (Spring), p. 483ss. doi:10.1145/1465482.1465560"
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, lit-scaling-agent-systems, lit-macnet, lit-swarmsys, lit-agentnet, lit-gptswarm, lit-agentprune, nat-colony-size-scaling, H-07, H-04]
updated: 2026-11-07
summary: "Adding agents yields less and less and, beyond a point, makes things worse: contention (shared bottlenecks) and coherence (each one must reconcile with everyone) produce a computable peak."
---

# H-11 — Coordination cost follows the Universal Scalability Law, peaking at N_max

**Status:** `open` · **Card evidence level:** `hypothesis` · **Origin:** theory (th-model §5; Gunther USL) + literature (saturation in lit-macnet, lit-swarmsys)

## Statement
The useful output (accepted tasks per unit of time, or completed subtasks) of a swarm follows X(N) = γN/[1 + σ(N−1) + κN(N−1)] with κ > 0; N_max = √((1−σ)/κ); κ(all-to-all) > κ(star) ≥ κ(board).

## Variables
N, σ (single orchestrator/verifier, queues, rate limits), κ (pairwise reconciliation), topology.

## Prediction (quantitative/directional)
- The USL fit has lower error than Amdahl (κ = 0) under cross-validation.
- N_max(all-to-all) < N_max(star); illustrative example (σ, κ) = (0.05; 0.01) → N_max ≈ 9.7.
- Saturation near 14–16 agents reported in the literature would correspond to κ ≈ 0.004–0.005 if σ ≈ 0 (to be checked with data).

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
κ̂ with a 95% CI including 0 for the full topology; or output linear in N up to 8.

## Proposed experiment
Observatory: a task with many independent parts; measure throughput and coordination tokens by N and topology; nonlinear fit.

## Current evidence
Model (classical USL; N_max checked numerically). Saturation reported by `lit-macnet` (~16 nodes) and `lit-swarmsys` (~14) — author-reported. Kim et al. report turns T = 2.72·(n+0.5)^1.724 (between star ∝ n and full ∝ n²) and 67.7 successes/1K tokens for the single agent vs 13.6–42.4 for MAS. `nat-colony-size-scaling` (natural phenomenon): colony metabolism scales sublinearly — analogy, not evidence.

## Limits
USL was formulated for computing systems; applying it to LLM agents is an engineering analogy.
