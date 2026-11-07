---
id: lit-early-stopping-sc
title: 'Early-Stopping Self-Consistency (ESC) — stop when a window of samples agrees'
area: literature
evidence: author-reported
tags: [self-consistency, early-stopping, cost, difficulty]
sources:
  - "Li, Y., Yuan, P., Feng, S., Pan, B., Wang, X., Sun, B., Wang, H. & Li, K. (2024). Escape Sky-high Cost: Early-stopping Self-Consistency for Multi-step Reasoning. ICLR 2024. https://proceedings.iclr.cc/paper_files/paper/2024/hash/3fe2a777282299ecb4f9e7ebb531f0ab-Abstract-Conference.html"
  - "arXiv:2401.10480v1 (19 Jan 2024). https://arxiv.org/abs/2401.10480v1 · doi:10.48550/arXiv.2401.10480"
related: [lit-adaptive-consistency, lit-self-consistency]
updated: 2026-11-07
primary_opened: true
version: "v1 (19 Jan 2024), only version"
summary: Stopping sampling when a window of 5–8 answers is unanimous cut 67–80% of samples on easy tasks for GPT-4 without changing accuracy, but only 33.8% on MATH, where the model is less reliable.
---

## Question
Fixed-size self-consistency is expensive; can samples be cut without changing the outcome of the vote?

## Method
Sampling in sequential windows of size w; if all answers in a window are identical (zero entropy), stop; otherwise continue up to L and take a majority vote (Sec. 2.2, Alg. 1). L = 64, w = 8 on MATH; L = 40, w = 5 on the others (Sec. 3.2). Models: GPT-4, GPT-3.5-Turbo, Llama-2 7b. Theoretical upper bound on the probability that the vote changes (one-proportion z-test; ≤2×10⁻³ for w = 8, Sec. 2.3). Control scheme (Sec. 2.4, Alg. 2): an initial window w0 = 5 estimates expected cost and error for (w, L) pairs, and the user chooses according to the budget target.

## Reported result
- Table 1, GPT-4 (mean samples vs L; SC vs ESC accuracy): MATH 42.40 of 64 (−33.8%), 60.32 = 60.32; GSM8K 7.98 of 40 (−80.1%), 89.29 = 89.29; CSQA 9.29 (−78.5%), 87.18 = 87.18; StrategyQA 7.19 (−76.8%), 81.67 → 81.70; Last Letters 6.32 (−67.4%), 95.00 → 94.98. Coin Flip −84.2% (abstract).
- GPT-3.5-Turbo on MATH: 52.37 mean samples — smaller savings.
- ESC×SC agreement: 99.13–99.96% (Table 5).
- Control: Pearson correlation of predicted×actual samples = 1.00; of performance change 0.81–0.86 (Table 3, GSM8K).
- Sec. 3.2: "cost savings are positively correlated with performance".

## Cost/compute considered?
Yes, in number of CoT samples (not in US$ or tokens). Latency not analyzed; sequential windows increase latency relative to N parallel samples.

## Threats to validity
The unanimity criterion requires short, comparable answers; savings depend on the task being easy for the model; models and benchmarks from 2023–2024; does not test open-ended tasks; does not compare against 1 long-reasoning agent.

## Relevance to the central question
Shows empirically the pattern that matters to Norevia: **the savings from stopping early are large where the agent is already competent and small where it is not** — exactly the tasks where more agents could help. The collective stopping rule is cheap and nearly lossless when the model is good.

## Candidate hypotheses
- candidate: early-stopping savings ∝ the agent's baseline accuracy; on tasks where the agent errs a lot, elastic control tends to spend the maximum budget.
- candidate: a small unanimous window (w≈5) is a signal to "contract the swarm" at almost no quality cost on tasks with a short verifiable answer.

## Verification
Opened on 2026-11-07: https://arxiv.org/abs/2401.10480 (metadata), https://arxiv.org/html/2401.10480v1 (text and tables), ICLR 2024 proceedings (venue). Code (github.com/Yiwei98/ESC) not inspected.
