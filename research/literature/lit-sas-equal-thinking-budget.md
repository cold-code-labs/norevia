---
id: lit-sas-equal-thinking-budget
title: Single agent beats MAS on multi-hop reasoning with an equal thinking-token budget
area: literature
evidence: author-reported
tags: [single-vs-multi, thinking-budget, matched-compute, context, data-processing-inequality]
sources:
  - "Tran, D. & Kiela, D. (2026). Single-Agent LLMs Outperform Multi-Agent Systems on Multi-Hop Reasoning Under Equal Thinking Token Budgets. arXiv:2604.02460v2. doi:10.48550/arXiv.2604.02460. https://arxiv.org/abs/2604.02460v2"
related: [lit-scaling-agent-systems, lit-sas-vs-mas-hybrid, lit-snell-test-time-compute]
updated: 2026-11-07
primary_opened: true
version: "v2 (11 Apr 2026); v1 2 Apr 2026"
summary: With the same reasoning-token budget, a single agent matches or outperforms five MAS architectures on multi-hop from 500 tokens upward; MAS only competes when the single agent's use of context is degraded.
---

## Question
Do the reported advantages of MAS in multi-hop reasoning come from the architecture or from unaccounted inference compute?

## Method
Theoretical argument via the Data Processing Inequality: if M is a function of the context C, then I(Y;C) ≥ I(Y;M) and Pe(C) ≤ Pe(M). With a complete and well-used context, a single agent is at least as good as any MAS built on the same context (Sec. 3). Experiment with thinking-token budgets from 100 to 10,000. Models: Qwen3-30B-A3B, DeepSeek-R1-Distill-Llama-70B and Gemini 2.5 Flash/Pro. Benchmarks: FRAMES and MuSiQue 4-hop. Architectures: SAS, SAS-L (prompted to think longer), Sequential, Subtask, Parallel-roles, Debate and Ensemble. Context-degradation experiment (masking, substitution, deletion, distractors) with a fixed budget of 1,000 tokens (Sec. 5.3).

## Reported result
- Table 1, average over models and datasets: at the 100-token budget, SAS 0.290 trails most MAS (Debate 0.370; Sequential 0.364). From 500 tokens onward, SAS has the highest average: 1k: SAS 0.418 vs Debate 0.388, Sequential 0.379; 10k: SAS 0.426 vs Parallel-roles 0.423, Debate and Ensemble 0.420.
- DeepSeek-R1-Distill-Llama-70B, FRAMES (Table 5): SAS 0.456 vs Sequential 0.397 at 10k.
- Gemini 2.5 Pro, FRAMES at 1k (Table 1): SAS 0.680, Sequential 0.670, Debate 0.638, Ensemble 0.430.
- Unused budget: on Qwen3/FRAMES with 10k requested, SAS uses on average 1,307 tokens, while Ensemble uses 5,571 and Parallel-roles 4,850. Comparisons by nominal budget underestimate MAS compute.
- Context degradation (Qwen3/MuSiQue, Fig. 3, qualitative only): SAS leads under mild degradation (α=0.3); Sequential wins under strong degradation (α=0.7) by masking or substitution. With distractors, SAS stays ahead throughout.
- Error analysis (Table 2, MuSiQue at 1k): in the cases where MAS is right and SAS is wrong, the gold answer appears in SAS's reasoning in only 12.5% (Gemini Flash) and 18.3% (Qwen3).
- Artifacts: the Gemini API's thinking-token accounting is approximate (App. C, G); paraphrases of the benchmarks change the results (App. A).

## Cost/compute considered?
Yes, it is the focus: matched thinking-token budget and measurement of actual usage. Caveat: the budgets are ceilings, not forced usage.

## Threats to validity
- Only two datasets, both multi-hop and text-only. Does not cover agentic tasks with tools, code or parallel decomposition.
- The context-degradation results appear only in a figure.
- Approximate Gemini token accounting.
- Recent preprint with no declared venue.

## Relevance to the central question
Strong counterpoint for Norevia: in reasoning over a shared context, cooperating adds no information, it only reorganizes compute. MAS only helps when the single agent cannot use the context well (long, noisy or degraded context) or when MAS spends more compute. This gives an explicit condition for when to cooperate.

## Candidate hypotheses
- candidate: with an equal token budget and well-used context, the single agent dominates; MAS only adds value when the single agent's effective use of context drops.
- candidate: the MAS advantage appears at very low per-agent budgets, below the minimum for useful reasoning, and vanishes at a moderate budget.
- candidate: swarm benchmarks and comparisons need to measure tokens actually consumed, not nominal budgets, or the MAS advantage becomes inflated.

## Verification
Opened on 2026-11-07: https://arxiv.org/abs/2604.02460 (v2, arXiv DOI) and https://arxiv.org/html/2604.02460v2 (about 100k of 123k characters read; part of appendices F–H was not read). Numbers extracted by an automated reader, without manual checking. Author affiliation not verified (gap).
