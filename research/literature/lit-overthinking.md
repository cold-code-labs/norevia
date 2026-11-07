---
id: lit-overthinking
title: 'Do NOT Think That Much for 2+3=? — overthinking in long reasoning models'
area: literature
evidence: author-reported
tags: [reasoning-effort, overthinking, cost, difficulty, efficiency]
sources:
  - "Chen, X., Xu, J., Liang, T., He, Z., Pang, J., Yu, D., Song, L., Liu, Q., Zhou, M., Zhang, Z., Wang, R., Tu, Z., Mi, H. & Yu, D. (2025). Do NOT Think That Much for 2+3=? On the Overthinking of Long Reasoning Models. Proceedings of the 42nd ICML, PMLR 267:9487–9499. https://proceedings.mlr.press/v267/chen25bx.html"
  - "Preprint: arXiv:2412.21187v2 (1 Feb 2025), title 'On the Overthinking of o1-Like LLMs'. https://arxiv.org/abs/2412.21187v2 · doi:10.48550/arXiv.2412.21187"
related: [lit-s1-budget-forcing, lit-nothinking, lit-inverse-scaling-ttc]
updated: 2026-11-07
primary_opened: true
version: "arXiv v2 (1 Feb 2025); v1 30 Dec 2024; ICML version not opened as PDF"
summary: Long reasoning models get it right in the first solution in more than 92% of cases and spend the rest on redundant checks; self-training cut ~45% of tokens on MATH500 at −0.2 points of accuracy.
---

## Question
Do o1-type models allocate too much compute to simple problems? How can this waste be measured and reduced without losing accuracy?

## Method
Analysis of the "solution rounds" within the reasoning chain of QwQ-32B-Preview and DeepSeek-R1 (conventional baselines: Llama-3.3-70B-Instruct, Qwen2.5-Math-72B-Instruct) on ASDIV, GSM8K, MATH500, GPQA, AIME24 (Sec. 2). Two metrics: outcome efficiency ξO (tokens up to the first correct answer / total tokens) and process efficiency ξP (tokens of solutions with a distinct strategy / total). Mitigation (Sec. 3): self-training on PRM12K with SFT/DPO/RPO/SimPO, using shortened responses (First-Correct Solution, FCS; FCS+Reflection; greedily diverse solutions).

## Reported result
- "2+3": QwQ generates 13 solutions, 901 tokens; the first one (39 tokens) is already correct → ξO = 4.3% (Fig. 1–2). On average, o1-like models use "1,953% more tokens" than conventional ones for the same answer.
- "In more than 92% of cases, the initial round of solutions produces the correct answer" (Sec. 2.2); the first round is usually <60% of the tokens.
- Table 1, ξO/ξP: MATH500 QwQ 52.3%/71.2%, R1 51.0%/66.2%; GSM8K QwQ 50.7%/67.6%. Conventional: ξO 75.4–96.3%.
- MATH500 Level 1: ξO < 50% for both (Sec. 2.4) — the relative waste is greater on the easiest problems.
- Table 4 (QwQ, MATH500 baseline 93.0%, 2407.9 tokens): SimPO+FCS+Reflection 92.8%, 1330.7 tokens (≈−44.7%); SimPO+FCS 91.0%, 1016.0 (≈−57.8%). GSM8K 94.8→96.0%, 772.8→416.6 tokens; GPQA 59.6→59.1%, 3228→2086; AIME24 46.7→43.3%, 9481→5155.
- Inconsistency: the introduction attributes −48.6% to MATH500, but in Table 4 that value belongs to ASDIV.

## Cost/compute considered?
Yes, in generated tokens (a proxy for compute/latency). No US$; the cost of self-training is not accounted against the savings.

## Threats to validity
Reasoning models from late 2024/early 2025; mathematics benchmarks with checkable answers; the ξO metric depends on detecting the "first correct answer" within the trace (automatic annotation); the drop on AIME24 (−3.4 points) shows that cutting tokens costs more on hard problems. External summaries cite ">85%" (ICML slides) vs ">92%" (arXiv v2) — use the number from the version opened.

## Relevance to the central question
Direct evidence that **more individual reasoning has near-zero marginal return on easy tasks**: most of the extra tokens are redundant self-verification. Reinforces that a controller should cut effort on simple queries ("a 'hi' should not pay for orchestration"). It also suggests that successive reflections within the same model are correlated checks (the 2nd–Nth "reviewer" is the same model).

## Candidate hypotheses
- candidate: the marginal return of reasoning tokens drops after the first complete solution; from then on, an external check (another agent or a test) has better expected value than more reflection by the same model.
- candidate: the relative waste (1−ξO) is maximal on the easiest tasks — the gain of an effort router is greatest on workloads dominated by simple queries.

## Verification
Opened on 2026-11-07: https://arxiv.org/abs/2412.21187 (metadata), https://arxiv.org/html/2412.21187v2 (text, Tables 1 and 4), https://proceedings.mlr.press/v267/chen25bx.html (venue). Gap: PDF of the ICML version not compared with v2.
