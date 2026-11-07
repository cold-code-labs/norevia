---
id: lit-sas-vs-mas-hybrid
title: Single-agent or Multi-agent Systems? Why Not Both? — the MAS advantage shrinks with better models; routing and cascade
area: literature
evidence: author-reported
tags: [single-vs-multi, cascade, routing, cost, frontier-models]
sources:
  - "Gao, M., Li, Y., Liu, B., Yu, Y., Wang, P., Lin, C.-Y. & Lai, F. (2025). Single-agent or Multi-agent Systems? Why Not Both? arXiv:2505.18286v1. https://arxiv.org/abs/2505.18286v1"
related: [lit-scaling-agent-systems, lit-sas-equal-thinking-budget]
updated: 2026-11-07
primary_opened: true
version: "v1 (23 May 2025), only version on arXiv"
summary: With stronger models, the accuracy advantage of published MAS over a single agent drops to a few points, while the token cost is from 2× to more than 200× higher; a verified SAS→MAS cascade recovers part of the gain at lower cost.
---

## Question
Does the advantage of multi-agent systems (MAS) over a single agent (SAS) persist with more capable LLMs? How can the two be combined to balance cost and accuracy?

## Method
Re-evaluation of published MAS (MetaGPT, Self-Collaboration, MathDebate and others) against SAS on code, mathematics and fact verification. Models evaluated (App. B.1): Gemini-2.0-Flash (default), Gemini-2.5-Pro-Preview, GPT-3.5-Turbo, GPT-4o and LLaMA-3.1 8B/70B. Cost in prefill and decode tokens. Proposals: (a) identify the most error-prone agent via self-declared confidence and upgrade its model; (b) routing by an LLM difficulty evaluator; (c) a cascade in which the SAS runs first and escalates to the MAS if the output fails a cheap check.

## Reported result
- Shrinking advantage (Sec. 3.2, Table 2), in the original with ChatGPT → with Gemini-2.0-Flash: MetaGPT/HumanEval +10.7 → +3.0; Self-Collaboration/MBPP +16.0 → +1.2; MathDebate/GSM8K +9 → +0.8. The models differ between columns, so this is not a controlled comparison.
- Table 4: SAS vs MAS with GSM8K 94.0 vs 93.6; AIME 25.0 vs 38.3; DS1000 62.9 vs 62.3; BigCodeBench 47.4 vs 46.0.
- About 80% of examples are ties, with both correct or both wrong (Fig. 2, Obs. 1).
- Cost (Table 3): MAS/SAS prefill ratio between 1.20× (HoVer) and 220.22× (AIME); decode between 2.10× and 21.64×. The text gives ranges different from the table ("4–220×", "2–12×").
- Difficulty-based routing on GSM8K+AIME: about 2% more accuracy at about 50% of the MAS cost (Fig. 4b). Cascade on GSM8K: 1,056 tokens vs 8,837 for the MAS, about 88% fewer (Table 4). The abstract states a "1.1–12%" gain and "up to 20%" cost reduction; I could not map these values to specific cells, and the body also mentions up to 88.1%.

## Cost/compute considered?
Yes, in tokens; not in dollars nor under a matched budget. The cascade formula is cost = (1−p)·C_MAS + C_SAS.

## Threats to validity
- The "before/after" comparison mixes different models.
- Abstract numbers inconsistent with the body (cost and reduction ranges).
- The cascade counts a success if either SAS or MAS is correct (App. B.4), which inflates accuracy, and requires cheap verification of outputs.
- Self-Collaboration was reduced from 3 to 2 agents, and the authors did not reproduce the original results.
- Frontier reasoning models (o3) cited but not evaluated.

## Relevance to the central question
Direct evidence that the MAS gain depends on base capability: with a strong model, the MAS ties in most cases and costs much more. The SAS→MAS cascade with verifiable acceptance is a prototype of the "on-demand micro-swarm" that Norevia proposes; that is, the idea of conditional escalation has already been tested by others.

## Candidate hypotheses
- candidate: the MAS gain over the SAS decreases as base-model capability increases; the relative cost does not decrease.
- candidate: "try cheap first and escalate only on verifiable failure" dominates "always MAS" in cost per correct answer when a cheap verifier exists.
- candidate: the cases that only the MAS gets right concentrate on hard problems (e.g., AIME); a difficulty predictor can capture almost all of the gain.

## Verification
Opened on 2026-11-07: https://arxiv.org/abs/2505.18286 (v1 only; no venue declared) and https://arxiv.org/html/2505.18286v1 (about 100k of 148k characters read). Numbers extracted by an automated reader, without manual checking. The exact origin of "1.1–12%" and "up to 20%" was not located (gap).
