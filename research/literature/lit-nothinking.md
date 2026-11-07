---
id: lit-nothinking
title: 'Reasoning Models Can Be Effective Without Thinking — NoThinking + parallel scaling'
area: literature
evidence: author-reported
tags: [reasoning-effort, sequential-vs-parallel, test-time-compute, latency, verifier]
sources:
  - "Ma, W., He, J., Snell, C., Griggs, T., Min, S. & Zaharia, M. (2025). Reasoning Models Can Be Effective Without Thinking. arXiv:2504.09858v1 (14 Apr 2025). https://arxiv.org/abs/2504.09858v1 · doi:10.48550/arXiv.2504.09858"
related: [lit-s1-budget-forcing, lit-overthinking, lit-more-agents]
updated: 2026-11-07
primary_opened: true
version: "v1 (14 Apr 2025), only version; venue not identified"
summary: With the same token budget, skipping explicit reasoning and generating several short answers in parallel with a verifier matched or outperformed long reasoning with up to 9× lower latency.
---

## Question
Is the long "Thinking" block of reasoning models necessary? With an equal token budget, should it be spent on one long chain or on several short parallel answers?

## Method
Main model DeepSeek-R1-Distill-Qwen-32B (appendix: 7B, 14B). "NoThinking": prefills the thinking block as empty. Budgets matched via max_tokens (budget forcing; Sec. 3.1). Seven datasets: mathematics (AIME 2024/2025, AMC 2023, OlympiadBench), formal proof (MiniF2F, ProofNet), code (LiveCodeBench). Evaluation by pass@k and, in Sec. 4, parallel scaling: N NoThinking outputs aggregated by a verifier (Lean) or by best-of-N selection (confidence, vote). Latency = maximum tokens generated.

## Reported result
- Abstract/Sec. 3.3: AMC 2023 with 700 tokens, NoThinking 51.3 vs Thinking 28.9.
- Sec. 3.3: "NoThinking eventually matches Thinking at the largest k, while still using 2.0–5.1x fewer tokens." At pass@1 with a high budget (~3,500 tokens), Thinking still wins; LiveCodeBench is an exception (Thinking wins).
- Table 3 (tasks with a verifier, matching Thinking's pass@1): MiniF2F 36.38 vs 34.84 with latency −6.47× and tokens −3.91×; ProofNet 6.90 vs 5.52, latency −7.20×, tokens −4.14× (k = 2).
- Sec. 4.2 (without a verifier): "NoThinking achieves a higher pass@1 score (55.79 vs. 54.1) while reducing latency by a factor of 9" (associated by the text with OlympiadBench).
- Confidence-based selection generally beats majority vote (Table 2). Answer diversity "alone does not fully explain" the gains.

## Cost/compute considered?
Yes: total tokens and (parallel) latency. No US$. The formal verifier (Lean) is treated as perfect and of negligible cost.

## Threats to validity
Only open-weight models from the R1-Distill family; preprint with no peer review identified; very low absolute accuracies on ProofNet; gains with a verifier depend on a perfect verifier; Thinking still wins at pass@1 with a high budget and on code.

## Relevance to the central question
One of the rare works that compares **directly** "one agent with long reasoning" vs "N short attempts + aggregation" at an equal budget. Result: at low budgets and with a verifier, short-parallel wins in quality and latency; at a high budget without a verifier and on code, long-sequential still wins. This is an empirical transition frontier, of the kind Norevia wants to map — already partially done by others.

## Candidate hypotheses
- candidate: the "1 long vs N short" crossover point depends on (a) availability of a cheap verifier and (b) total budget; with a perfect verifier, N short dominate in latency.
- candidate: without a verifier, the gain of N short is limited by the aggregator (vote/confidence) and by the correlation among samples from the same model.
- candidate: latency (parallelism) is a cost axis separate from tokens; a Norevia policy needs to optimize both (see also lit-routellm).

## Verification
Opened on 2026-11-07: https://arxiv.org/abs/2504.09858 (metadata), https://arxiv.org/html/2504.09858v1 (text; quoted excerpts checked verbatim: 51.3 vs 28.9; "2.0–5.1x"; Table 3; "55.79 vs. 54.1"). Gap: publication venue not found; Table 3 headers illegible in the extracted text; last ~19 thousand characters (appendices) not read.
