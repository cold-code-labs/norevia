---
id: lit-s1-budget-forcing
title: 's1: Simple test-time scaling — budget forcing of sequential reasoning'
area: literature
evidence: author-reported
tags: [reasoning-effort, test-time-compute, budget-forcing, sequential-vs-parallel]
sources:
  - "Muennighoff, N., Yang, Z., Shi, W., Li, X. L., Fei-Fei, L., Hajishirzi, H., Zettlemoyer, L., Liang, P., Candès, E. & Hashimoto, T. (2025). s1: Simple test-time scaling. Proceedings of EMNLP 2025, pp. 20275–20321. doi:10.18653/v1/2025.emnlp-main.1025. https://aclanthology.org/2025.emnlp-main.1025"
  - "Preprint: arXiv:2501.19393v3 (1 Mar 2025). https://arxiv.org/abs/2501.19393v3"
related: [lit-overthinking, lit-nothinking, lit-inverse-scaling-ttc]
updated: 2026-11-07
primary_opened: true
version: "arXiv v3 (1 Mar 2025); v1 31 Jan 2025; EMNLP version not opened as PDF"
summary: Forcing the model to think longer (by appending "Wait") raised AIME24 from 50% to 57% in a 32B model, but the gain flattens after ~6 extensions and can fall into loops.
---

## Question
What is the minimal recipe for obtaining test-time compute scaling (more thinking → more accuracy) and controlling the reasoning budget?

## Method
SFT of Qwen2.5-32B-Instruct on s1K (1,000 questions with reasoning traces, chosen for difficulty, diversity and quality): "26 minutes on 16 NVIDIA H100 GPUs" (Sec. 4.1). **Budget forcing**: to shorten, it forces the end-of-thinking delimiter; to lengthen, it suppresses the end and appends "Wait". Metrics (Sec. 3.2): Control (fraction of runs within budget), Scaling (average accuracy×tokens slope), Performance (maximum). Sequential (budget forcing) vs parallel (majority vote with 2–64 samples from the base model) comparison.

## Reported result
- Table 1 (AIME24 / MATH500 / GPQA Diamond): s1-32B with BF 56.7 / 93.0 / 59.6; without BF 50.0 / 92.6 / 56.6.
- Abstract: extrapolation with BF raises AIME24 "from 50% to 57%". Table 4: appending "Wait" while ignoring the end 2× gives 53.3 vs 50.0.
- Table 3 (AIME24): BF Control 100%, Scaling 15, Performance 56.7; token-conditional 40%/−24/40.0; step-conditional 60%/3/36.7; rejection sampling 100%/−35/40.0.
- Fig. 4: sequential scaling "does eventually flatten out at six times"; parallel majority vote of the base model "cannot catch up" with s1-32B (Sec. 4.2). Fig. 7: REBASE (PRM-guided search, 16 trajectories) scales better than majority vote and, in this setting, better than sequential; in the sequential setting at 512 steps, 12 of 30 questions exceeded the context window.

## Cost/compute considered?
Yes, in thinking tokens (x-axis of the curves). Training cost reported (7 H100 GPU-h). There is no monetary inference cost or latency.

## Threats to validity
AIME24 has only 30 questions (each question = 3.3 points); the parallel vs sequential comparison uses different models (base for voting vs s1 for BF); a single model/family; context limit and repetitive loops when suppressing the end "too often" (Sec. 6.2).

## Relevance to the central question
It demonstrates that **reasoning effort is a controllable, continuous knob** (Control 100%) and that it has diminishing returns with a ceiling. It also provides a rare data point comparing sequential (1 agent thinking longer) vs parallel (N samples voting) — with a result that depends on the aggregation method: simple voting lost; search with a process verifier won. The useful conclusion is not "sequential wins" but "it depends on the aggregator and on the context ceiling".

## Candidate hypotheses
- candidate: the gain from more individual reasoning tokens saturates (≈6 extensions in s1); beyond the saturation point, additional resources yield more in parallel samples with a verifier than in more sequential thinking.
- candidate: the sequential↔parallel crossover point depends on the quality of the aggregator (vote < PRM/verifier), not only on the budget.

## Verification
Opened on 2026-11-07: https://arxiv.org/abs/2501.19393 (metadata), https://arxiv.org/html/2501.19393v3 (text up to ~100 thousand characters; final appendices not read), https://aclanthology.org/2025.emnlp-main.1025 (venue/DOI). Gap: the exact number of "Wait"s for the 57% point is not explicit in the text read.
