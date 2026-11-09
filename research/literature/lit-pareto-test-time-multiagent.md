---
pivot: foundation
pivot_reason: "General evidence on compute allocation, baselines, verification or correlated errors; no defence-specific efficacy follows."
id: lit-pareto-test-time-multiagent
title: "Multi-Agent Reasoning Improves Compute Efficiency (Wunderlich et al., ACL 2026 SRW) — Pareto frontier with paired compute"
area: literature
evidence: author-reported
tags: [test-time-compute, pareto, mixture-of-agents, debate, self-consistency, difficulty, routing]
sources:
  - "Wunderlich, F. V., Kaesberg, L. B., Wahle, J. P., Ruas, T. & Gipp, B. (2026). Multi-Agent Reasoning Improves Compute Efficiency: Pareto-Optimal Test-Time Scaling. Proceedings of the 64th Annual Meeting of the ACL (Volume 4: Student Research Workshop), pp. 1–14, San Diego. doi:10.18653/v1/2026.acl-srw.1. https://aclanthology.org/2026.acl-srw.1/"
  - "Declared code: https://github.com/Multi-Agent-LLMs/lm-evaluation-harness (not inspected)"
related: [lit-mixture-of-agents, lit-self-moa, lit-debate-or-vote, lit-stop-overvaluing-mad]
updated: 2026-11-07
primary_opened: true
version: "ACL 2026 SRW (July 2026), PDF from the ACL Anthology"
summary: With paired compute (FLOPs + memory transfer), single-model MoA and debate outperform self-consistency by 2.7 and 1.3 pp on MMLU-Pro; the gain from extra compute is larger on hard tasks, and a larger model with CoT beats a heavily scaled smaller one.
---

## Question
Under an equal compute budget, are multi-agent systems (debate, MoA) more efficient than single-agent methods (self-consistency, self-refinement)? How should they be parameterized?

## Method
- 4 pipelines: self-consistency (SC), self-refinement, debate (variant with majority vote), MoA in a **single-proposer configuration** (same LLM in all roles — i.e., close to Self-MoA).
- Llama 3.1 70B (main) and 8B; MMLU-Pro (sample of 1,000 questions) and BBH for robustness; zero-shot, T=0.7, top-p 0.95.
- 34 configurations, >100 evaluations; cost estimated theoretically as time per task accounting for FLOPs **and** memory transfer (Table 4, Appendix B).
- Accuracy × compute Pareto frontier; analysis by difficulty (CoT accuracy rate over 20 samples: easy >75%, medium 25–75%, hard <25%).

## Reported result
- MMLU-Pro, up to ~20× the compute of CoT (Section 4.1): CoT 64.3%; best SC 68.7% (10 samples); best debate 70.0% (4 agents, 2 rounds); best MoA 71.4% (5 models, 4 layers). At comparable compute, debate +1.3 pp and MoA +2.7 pp over SC (the Introduction text says +1.4 for debate).
- Self-refinement falls **below CoT** despite more compute.
- Saturation: SC saturates at ~10 samples and debate at ~4 agents; MoA improves almost linearly up to 5 models/4 layers.
- Debate (Fig. 3): accuracy rises up to 4 agents and falls with more; more rounds hurt with 2 agents and do not help with more — "prioritize agents over rounds"; the best debate always has 2 rounds.
- MoA (Fig. 4): Pareto optimum when number of proposers = number of layers + 1 (3/2, 4/3, 5/4).
- Difficulty (Table 1): gain of 15–20× CoT over CoT — easy +2.2 (94.4→96.6), medium +8.5 (53.0→61.5), hard +9.0 (8.4→17.4).
- Model size (Section 4.4): no 8B configuration exceeds 53% on MMLU-Pro, below the 70B CoT (64.3%); with the same compute as CoT-70B, the best 8B is ~13% lower.
- Roles (Table 2): MoA 5×4 — 70B/70B 71.4; 70B proposers + 8B aggregator 69.6; 8B proposers + 70B aggregator 52.9; 8B/8B 51.2. Proposers matter more than the aggregator. Mixing 8B and 70B as proposers hurts (3×70B+2×8B = 67.5% vs 3×70B alone 70.1%).
- Conclusion: ~5× CoT captures most of the gain; below ~3× CoT, SC is the viable option.

## Cost/compute considered?
Yes — it is the core of the paper: compute paired in theoretical time (FLOPs + memory), not in number of calls. It does not measure actual API cost or measured latency.

## Threats to validity
- 95% CI of ±2.8–3.0 pp per point (n=1,000; Limitations section) — larger than the 1.3 and 2.7 pp differences between methods; the authors appeal to the consistency of patterns.
- Only non-reasoning models (Llama 3.1); declared limitation.
- Theoretical compute may diverge from actual runtime (batching, frameworks).
- Student workshop (SRW), not the main track.
- Possible effect of heavier quantization on the 8B (declared).

## Relevance to the central question
**Important counterpoint** to lit-debate-or-vote and lit-stop-overvaluing-mad: with more finely paired compute and well-parameterized structures, multi-agent (especially single-model MoA) lies on the Pareto frontier — but the gain over SC is small (1–3 pp, within the CI) and **model size dominates** (a scaled 8B does not reach 70B with CoT). It also gives direct evidence for Adaptive Swarm Activation: easy tasks gain +2.2 pp with 15–20× compute; hard ones, +9.0.

## Candidate hypotheses
- candidate: the choice of base model is the 1st-order lever; multi-agent topology is 2nd-order (≤3 pp).
- candidate: the marginal gain of extra compute grows with task difficulty — a difficulty router saves most of the cost on easy tasks.
- candidate: topologies without context accumulation (MoA) scale better than topologies with accumulated memory (debate).
- candidate: optimal parallelism/depth ratio ≈ (layers + 1) proposers.

## Verification
- Opened on 2026-11-07: https://aclanthology.org/2026.acl-srw.1/ (metadata, DOI); PDF https://aclanthology.org/2026.acl-srw.1.pdf downloaded and extracted locally (Sections 1–5, Tables 1–2, Limitations).
- Gap: there is no arXiv version opened by us (a third-party site cited arXiv 2605.01566 — **not verified**); Figs. 2–7 read only via the text; code not inspected.
