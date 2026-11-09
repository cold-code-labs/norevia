---
pivot: foundation
pivot_reason: "General evidence on compute allocation, baselines, verification or correlated errors; no defence-specific efficacy follows."
id: lit-self-consistency
title: Self-consistency — sample several reasoning paths and vote
area: literature
evidence: author-reported
tags: [self-consistency, majority-vote, saturation, uncertainty, baseline]
sources:
  - "Wang, X., Wei, J., Schuurmans, D., Le, Q., Chi, E., Narang, S., Chowdhery, A. & Zhou, D. (2023). Self-Consistency Improves Chain of Thought Reasoning in Language Models. ICLR 2023. arXiv:2203.11171v4. https://arxiv.org/abs/2203.11171v4"
related: [lit-more-agents, lit-more-llm-calls, lit-large-language-monkeys]
updated: 2026-11-07
primary_opened: true
version: "v4 (7 Mar 2023, ICLR camera-ready); v1 21 Mar 2022"
summary: Sampling about 40 reasoning chains and voting on the final answer greatly improves greedy CoT (up to +17.9 points on GSM8K), with fast saturation and an agreement rate that serves as an uncertainty signal.
---

## Question
Does replacing greedy chain-of-thought decoding with sampling of several paths plus majority vote improve reasoning?

## Method
Sample m reasoning paths (m=40 in the main results) with the same few-shot CoT prompt and pick the most frequent final answer. Models: UL2-20B, GPT-3 code-davinci-001/002, LaMDA-137B, PaLM-540B. Arithmetic, commonsense and ARC tasks. Comparisons: sample-and-rank, beam search, prompt ensembles and model ensembles.

## Reported result
- Tables 2–3, greedy CoT → SC with 40 paths, PaLM-540B: GSM8K 56.5→74.4 (+17.9); SVAMP 79.0→86.6; AQuA 35.8→48.3; StrategyQA 75.3→81.6; ARC-c 85.2→88.7.
- code-davinci-002: GSM8K 60.1→78.0 (+17.9); SVAMP +11.0; AQuA +12.2; StrategyQA +6.4; ARC-c +3.9. The abstract's numbers correspond to this model.
- Smaller gain on the smaller model: UL2-20B has GSM8K +3.2.
- Number of paths (Fig. 2; Table 6, UL2-20B, AQuA): 19.7 (1) → 24.9 (5) → 25.3 (10) → 26.7 (20) → 26.9 (40). The authors say that "performance saturates quickly" and suggest starting with 5 or 10 paths (Sec. 5).
- Beam search gets worse with larger width: 23.6 (beam 1) → 10.2 (beam 40) in Table 6.
- Prompt ensemble (Table 7, LaMDA-137B, GSM8K): CoT 17.1; 40 permutations 19.2; SC 27.7. Model ensembles (Table 10) fall below the SC of a single PaLM-540B (74.4).
- Agreement among paths is highly correlated with accuracy on GSM8K (Fig. 5). The authors propose using it as a low-confidence signal.

## Cost/compute considered?
Only as a limitation: the method "incurs more computation cost" (Sec. 5). There is no matched-budget comparison against other uses of the compute.

## Threats to validity
- Requires a final answer in a fixed set, so that voting is possible.
- 2022 models without long reasoning; the gain with current reasoning models is not measured here.
- The per-number-of-paths curve with exact numbers exists only for UL2-20B in Table 6; the others are only in a figure.

## Relevance to the central question
It is the mandatory baseline for any multi-agent system that votes or debates: "N independent samples + vote" with the same number of calls. Agreement among samples is a cheap uncertainty signal that can decide when to expand or terminate, a direct input to Adaptive Swarm Activation.

## Candidate hypotheses
- candidate: most of the aggregation gain comes from the first 5 to 10 samples; expanding beyond that has small marginal return.
- candidate: the agreement rate among the first k samples predicts whether escalating is worthwhile (low agreement signals a hard problem that merits more compute; high agreement allows stopping early).
- candidate: ensembles of different models or prompts do not automatically outperform the SC of a single strong model; diversity only pays off if the errors are decorrelated.

## Verification
Opened on 2026-11-07: https://arxiv.org/abs/2203.11171 (v4 and ICLR 2023 confirmed) and https://ar5iv.labs.arxiv.org/html/2203.11171 (ar5iv rendering of the latest version; no native arXiv HTML for this date). Numbers extracted by an automated reader, without cell-by-cell manual checking against the PDF. About 100k of 104k characters read.
