---
pivot: foundation
pivot_reason: "General evidence on compute allocation, baselines, verification or correlated errors; no defence-specific efficacy follows."
id: lit-more-llm-calls
title: Are More LLM Calls All You Need? — non-monotonic scaling of compound systems
area: literature
evidence: author-reported
tags: [scaling-law, non-monotonicity, difficulty, majority-vote, optimal-number-of-calls]
sources:
  - "Chen, L., Davis, J. Q., Hanin, B., Bailis, P., Stoica, I., Zaharia, M. & Zou, J. (2024). Are More LLM Calls All You Need? Towards Scaling Laws of Compound Inference Systems. arXiv:2403.02419v2. https://arxiv.org/abs/2403.02419v2"
related: [lit-more-agents, lit-self-consistency, lit-snell-test-time-compute]
updated: 2026-11-07
primary_opened: true
version: "v2 (4 Jun 2024); v1 4 Mar 2024"
summary: More calls and voting help easy queries and hurt hard ones, so total accuracy can rise and then fall; the optimal number of calls can be predicted from a few samples.
---

## Question
How does the performance of compound "voting" systems scale with the number K of LLM calls? Is there a predictable optimal K?

## Method
Two systems: Vote (K answers and majority vote) and Filter-Vote (an LLM filter discards candidates before the vote). Model: GPT-3.5-turbo-0125, temperature 0.1. Datasets: MMLU Physics (151), TruthfulQA (817), GPQA diamond (198) and AVERITEC (500). There were 400 generations per question, resampled with replacement for each K and averaged over 1,000 runs (App. D). Theory: difficulty d(x) = max_{a≠y} P[a] − P[y]; the question is "hard" if d(x) > 0, i.e., the most likely wrong answer is more frequent than the correct one.

## Reported result
- Non-monotonic scaling (Fig. 1, Sec. 5): on MMLU Physics, Vote rises and then falls with K, while Filter-Vote falls and then rises. On AVERITEC, both rise and then fall between K=2 and K=1,000 (Fig. 4a).
- Mechanism: voting drives the accuracy of each question to 1 (easy) or to 0 (hard). The aggregate depends on the mixture α of easy questions.
- Theorem 2 (synthetic two-level case, p1 > 1/2 easy, p2 < 1/2 hard): if p1 + p2 > 1 and α < 1 − 1/t, the curve is an "inverted U"; if p1 + p2 < 1 and α > 1 − 1/t, it is a "U".
- Theorem 4: there is a closed-form formula for K*. Examples from Table 2: (α=0.4; p1=0.85; p2=0.4) gives K*=3; (α=0.6; p1=0.65; p2=0.4) gives K*=30. The analytical K* matches the empirical optimum in the 15 synthetic scenarios.
- Fittable model: G(K,x) = exp(−c1·K − c2·√K + c3) for hard questions and 1 − exp(−c1·K − c2·√K + c3) for easy ones. Fitted with K=1–5 and used to predict K=1–100 in the synthetic case, the MSE lies between about 1e-6 and 1e-4 (Fig. 6). On AVERITEC there is "high correlation", with no numerical error reported.

## Cost/compute considered?
No. The authors state that cost and latency are not analyzed (Sec. 6). "Compute" is measured only by the number of calls.

## Threats to validity
- One model, low temperature (0.1) and objective tasks.
- Only two compound designs (Vote and Filter-Vote).
- Exact theory only for |A|=2; assumes per-question accuracy converging to 0 or 1.
- Estimating difficulty without querying the LM remains open (App. B).
- The actual K peak on the datasets appears only in a figure.

## Relevance to the central question
It is the cleanest demonstration that more agents can make things worse. Voting amplifies bias when the dominant error is systematic (errors correlated across samples). It provides an analytical model of the optimal K as a function of the difficulty mixture, which is a primitive form of the "marginal gain function" that Norevia is looking for.

## Candidate hypotheses
- candidate: the gain from expanding saturates or inverts when the dominant error is correlated across agents; voting amplifies the majority error mode.
- candidate: the optimal N depends on the fraction of easy tasks in the batch; a per-item policy (routing only the easy-but-noisy ones to the vote) dominates a global N.
- candidate: a few calls (K ≤ 5) suffice to estimate a batch's gain curve, making autonomous tuning of N feasible at small cost.

## Verification
Opened on 2026-11-07: https://arxiv.org/abs/2403.02419 (v2; no venue on arXiv) and https://arxiv.org/html/2403.02419v2. Numbers extracted by an automated reader, without manual checking. Conference publication not verified (gap). K peaks on the real datasets are not in the text (gap).
