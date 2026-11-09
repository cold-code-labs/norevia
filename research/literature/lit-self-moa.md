---
pivot: archive
pivot_reason: "Generic aggregation or forecasting is peripheral to collective defence; retain as historical comparison."
id: lit-self-moa
title: "Self-MoA (Li et al., TMLR 2026) — aggregating samples from the best model beats mixing models"
area: literature
evidence: author-reported
tags: [mixture-of-agents, diversity, quality, ensemble, error-correlation]
sources:
  - "Li, W., Lin, Y., Xia, M. & Jin, C. (2026). Rethinking Mixture-of-Agents: Is Mixing Different Large Language Models Beneficial? Transactions on Machine Learning Research. https://openreview.net/forum?id=K6WwK8URlV (TMLR BibTeX record: https://jmlr.org/tmlr/papers/bib/K6WwK8URlV.bib)"
  - "arXiv:2502.00674v1 (2 Feb 2025), only version on arXiv. https://arxiv.org/abs/2502.00674v1"
related: [lit-mixture-of-agents, lit-stop-overvaluing-mad, lit-pareto-test-time-multiagent]
updated: 2026-11-07
primary_opened: true
version: "arXiv v1 (2025-02-02); TMLR 2026 (via jmlr.org BibTeX)"
summary: Aggregating 6 samples from the best model (Self-MoA) outperforms mixing 6 different models (+6.6 pp on AlpacaEval 2.0); performance depends more on the average quality of the proposers than on diversity.
---

## Question
Does the Mixture-of-Agents gain come from diversity among different models, or is it enough to aggregate several samples from the best model?

## Method
- Self-MoA: same 2 layers as MoA, but all proposers are samples from the same model (the best one); compared with Mixed-MoA with the same no. of proposers (6) and the same aggregator.
- AlpacaEval 2.0 with the 6 models of the original MoA; MMLU, CRUX, MATH with Qwen2-7B-Instruct (i), DeepSeek-Coder-V2-Lite-Instruct (d), Qwen2-Math-7B-Instruct (m); 13 Mixed-MoA combinations tested.
- Quality × diversity analysis (Section 4): >70 proposer mixtures per dataset, temperatures 0.5–1.2; quality = mean accuracy of the proposers; diversity = Vendi Score; normalized linear regression.
- Self-MoA-Seq (Section 5): sequential aggregation with a sliding window to scale beyond the aggregator's context.

## Reported result
- AlpacaEval 2.0 (Table 1, LC win rate): Mixed-MoA 59.1 vs Self-MoA (WizardLM-2-8x22B ×6) **65.7**; best single model 53.1.
- MMLU / CRUX / MATH (Table 3, Qwen2-7B aggregator): Self-MoA (best model per task ×6) 69.01 / 50.75 / 68.42; with per-task aggregator 69.01 / 52.62 / 69.80; best Mixed-MoA per task 68.21 (MMLU) / 47.00 (CRUX) / 67.62 (MATH). Self-MoA beats the 13 mixed configurations on all tasks.
- Mean on the mixed task (Table 6): Self-MoA TaskBest 63.81 vs best Mixed-MoA 60.04 (the abstract's "3.8% improvement" is in points).
- Regression (Table 4; normalized coefficients, p < 0.001): quality α vs diversity β — MMLU 2.558 vs 1.841 (R² 0.771); CRUX 4.548 vs 1.421 (R² 0.685); MATH 4.719 vs 2.839 (R² 0.760). Quality weighs more than diversity in all three.
- When mixing helps (Section 4.2, Table 7): with models of similar quality that are diverse, small gains (+0.17 and +0.35 pp); on MMLU, mixed Qwen+Llama (70.73) outperforms Self-MoA of Qwen (69.01), but loses to Self-MoA of Llama (71.27).
- Self-MoA-Seq is "comparable to, or slightly better than" Self-MoA (Fig. 3, no numbers in the text); there is no universally optimal configuration for the no. of samples.

## Cost/compute considered?
Partial. The no. of proposers is fixed (6) in both arms and the no. of forward passes is equal (7 for 2-layer MoA and Self-MoA; 13 for 3-layer MoA; Tables 8 and 10) — compute approximately matched in calls, not in tokens. No cost in US$ or latency.

## Threats to validity
- Aggregator limited by context (Gemma 2 forced the use of 4 samples in Table 2).
- 7–8B models on the verifiable tasks; AlpacaEval is judged by an LLM.
- Small text/table inconsistencies (e.g., "2–3 points" vs +1.8 in one row; R² ">0.9 with K=2" vs 0.881 in Table 5).
- arXiv has only v1; the TMLR version may differ — not opened (OpenReview required browser verification).

## Relevance to the central question
It contradicts the naive reading "model diversity is what makes the swarm work": **mixing weaker models dilutes the average quality** and costs more than the diversity gain. For Norevia, the candidate rule of thumb is: first scale samples from the best available model; only mix models when they are of comparable quality and have weakly correlated errors. Tension with lit-stop-overvaluing-mad, which sees heterogeneity as an "antidote" in debate — to be resolved experimentally.

## Candidate hypotheses
- candidate: the performance of an ensemble ≈ f(average quality of the members) + g(diversity), with the quality weight 1.4–3.2× larger than the diversity weight.
- candidate: adding a weaker member is only worthwhile if it reduces error correlation enough to compensate for the drop in average quality.
- candidate: the gain saturates and there is no universally optimal no. of samples — adaptive per-task control is needed.

## Verification
- Opened on 2026-11-07: https://arxiv.org/abs/2502.00674 (single v1); https://arxiv.org/html/2502.00674v1 (tables and text); https://jmlr.org/tmlr/papers/bib/K6WwK8URlV.bib (venue TMLR, year 2026).
- Gap: OpenReview page (forum K6WwK8URlV) did not open (browser verification); final TMLR version not checked. A neurips.cc 2024 listing with the same title appeared in the search and was not verified.
