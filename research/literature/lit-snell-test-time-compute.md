---
pivot: foundation
pivot_reason: "General evidence on compute allocation, baselines, verification or correlated errors; no defence-specific efficacy follows."
id: lit-snell-test-time-compute
title: Snell et al. — compute-optimal allocation of test-time compute by difficulty
area: literature
evidence: author-reported
tags: [test-time-compute, compute-optimal, difficulty, verifier, sequential-vs-parallel]
sources:
  - "Snell, C., Lee, J., Xu, K. & Kumar, A. (2024). Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters. arXiv:2408.03314v1. https://arxiv.org/abs/2408.03314v1"
related: [lit-large-language-monkeys, lit-self-consistency, lit-more-llm-calls]
updated: 2026-11-07
primary_opened: true
version: "v1 (6 Aug 2024), only version on arXiv"
summary: The best way to spend inference compute depends on the difficulty of each prompt; allocating by difficulty matches best-of-N with up to about 4× less compute, but on hard problems a larger model is worth more.
---

## Question
Given an inference compute budget, how should it be allocated per prompt (search with a verifier or sequential revisions)? When does this substitute for a larger model?

## Method
Base: PaLM 2-S* on MATH (12k/500 split from Lightman et al.). Two mechanisms: (a) search against a PRM (weighted best-of-N, beam search, lookahead); (b) a revision model that refines answers sequentially. Difficulty is measured in 5 quantiles of pass@1, with 2048 samples per question: "oracle" uses the ground truth, "predicted" uses the mean PRM score (Sec. 3.2). Budgets of up to 256 generations. FLOPs-matched comparison against a model about 14× larger (Sec. 7).

## Reported result
- Search with PRM (Sec. 5.3, Fig. 3–4): at low budget, beam search outperforms best-of-N; at high budget, the advantage shrinks and often reverses. On the easy levels (1–2), beam search gets worse with more budget due to verifier over-optimization. On levels 3–4, beam wins. On level 5, no method makes much progress.
- Compute-optimal strategy with search: nearly matches best-of-N with PRM using up to 4× less compute (e.g., 16 vs 64 generations; Fig. 4).
- Revisions (Sec. 6): naive revisions turn about 38% of correct answers into incorrect ones. Sequential revisions narrowly outperform parallel sampling. Easy questions do best with all compute sequential; hard ones, with a mixture (Fig. 7). The compute-optimal version outperforms parallel best-of-N with up to 4× less compute (e.g., 64 vs 256; Fig. 8).
- Equal FLOPs vs a model about 14× larger (Sec. 7, Fig. 9), with R = D_inference / D_pretraining in {0.16, 0.79, 22}: test-time compute wins on easy and medium questions and with low R. Pretraining the larger model is better on hard questions (bins 4–5) and with high R.
- The abstract says "more than 4×"; from reading the v1 HTML, the body speaks of "up to 4×" and the discussion of 2–4×.

## Cost/compute considered?
Yes, centrally: approximate FLOPs (6·N·D in pretraining and 2·N·D in inference) and budget in number of generations. Authors' caveat: difficulty estimation costs compute that is not included in the accounting (Sec. 3.2, App. C).

## Threats to validity
- One base model (PaLM 2-S*) and one benchmark (MATH).
- Verifier and revision model are fine-tuned; the authors note that these capabilities did not exist off the shelf in the proprietary LLMs of the time.
- The cost of difficulty estimation was omitted, precisely the "routing" part that matters for Norevia.
- 2024 models, before models with native reasoning.

## Relevance to the central question
It is the closest reference to an "effort allocation policy" conditioned on difficulty, but within one agent (parallel vs sequential, search vs revision), not across cooperating agents. It also shows that the difficulty router must be cheap for the gain not to vanish.

## Candidate hypotheses
- candidate: the optimal configuration (1 sequential agent, N parallel, verifier) changes with difficulty; a fixed policy is dominated by one conditioned on difficulty.
- candidate: on easy tasks, more parallel compute is wasteful and can worsen results due to verifier over-optimization.
- candidate: above a difficulty threshold, no inference arrangement compensates for insufficient base capability; the model must be scaled.
- candidate: the net gain of an adaptive policy is the gross gain minus the cost of estimating difficulty; if this cost is not small, the policy loses.

## Verification
Opened on 2026-11-07: https://arxiv.org/abs/2408.03314 (v1 only; no venue declared on arXiv) and https://arxiv.org/html/2408.03314v1 (about 100k of 111k characters read; the end, with appendices, was not read). Numbers extracted by an automated reader, without manual checking. I did not verify whether it was published at a conference (gap).
