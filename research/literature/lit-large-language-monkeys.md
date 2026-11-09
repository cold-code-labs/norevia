---
pivot: foundation
pivot_reason: "General evidence on compute allocation, baselines, verification or correlated errors; no defence-specific efficacy follows."
id: lit-large-language-monkeys
title: Large Language Monkeys — repeated sampling and the verification bottleneck
area: literature
evidence: author-reported
tags: [repeated-sampling, coverage, verification, cost, compute-optimal]
sources:
  - "Brown, B., Juravsky, J., Ehrlich, R., Clark, R., Le, Q. V., Ré, C. & Mirhoseini, A. (2024). Large Language Monkeys: Scaling Inference Compute with Repeated Sampling. arXiv:2407.21787v3. https://arxiv.org/abs/2407.21787v3"
related: [lit-self-consistency, lit-snell-test-time-compute, lit-more-agents]
updated: 2026-11-07
primary_opened: true
version: "v3 (30 Dec 2024); v1 31 Jul 2024; v2 16 Sep 2024"
summary: Coverage (at least one correct sample) grows log-linearly across four orders of magnitude of samples, but without an automatic verifier selection plateaus at around 100 samples.
---

## Question
Is scaling the number of independent samples a useful axis of inference compute? How do "coverage" and final accuracy behave at large k?

## Method
Independent samples, same prompt, variation only through temperature (Sec. 5). Tasks: GSM8K and MATH (128 problems each), MiniF2F-MATH (130), CodeContests (140) and SWE-bench Lite (250 attempts per issue). Models: Llama-3 8B/70B, Gemma, Pythia, DeepSeek-Coder-V2-Instruct, among others. Coverage = pass@k. Selection without a verifier: majority vote, best-of-N with a reward model, and weighted vote.

## Reported result
- SWE-bench Lite, DeepSeek-Coder-V2-Instruct: 15.9% with 1 sample → 56% with 250. The single-attempt state of the art was 43% (Abstract; Sec. 2.1; Fig. 2).
- Cost (Table 1, Moatless Tools framework): DeepSeek with 5 attempts at US$ 0.0072 each solves 29.62% (US$ 10.8 total). GPT-4o with 1 attempt solves 24.00% (US$ 39). Claude 3.5 Sonnet with 1 attempt solves 26.70% (US$ 51).
- Empirical law: log(c) ≈ a·k^b, i.e., c ≈ exp(a·k^b) (Sec. 3.1, Eqs. 2–3). The authors say the fit is less exact than training laws.
- CodeContests, Gemma-2B: pass@1 0.02% → pass@10k 7.1%. MATH, Pythia-160M: 0.27% → 57%.
- Selection bottleneck (Sec. 4.1, Fig. 7): on MATH with Llama-3-8B-Instruct, coverage goes from 82.9% (100 samples) to 98.44% (10,000). Majority vote and reward model stay at 40.50% → 41.41% over the same range; all selection methods plateau at around 100 samples.
- Equal FLOPs (Sec. 2.3, Fig. 4): Llama-3-8B beats Llama-3-70B in coverage on MiniF2F, GSM8K and MATH. On CodeContests, the 70B is almost always more cost-effective.
- Real verifiers fail: 11.3% of SWE-bench Lite problems have flaky tests (Sec. 4.2.1). In 35 of 122 CodeContests problems with a Python 3 solution, the reference solutions fail their own tests (Sec. 4.2.2).

## Cost/compute considered?
Yes. Dollar cost on SWE-bench (Table 1) and a FLOPs comparison across model sizes (Fig. 4). The authors say FLOPs are a rough proxy; batching and shared prefixes change the real cost (Sec. 2.3 and 5).

## Threats to validity
- Small problem samples (128–140 per benchmark).
- Coverage presupposes an oracle; without a verifier, the coverage gain does not turn into accuracy.
- 2024 API prices; the cost comparison does not transfer to today.
- Fully independent attempts: does not measure collaboration or execution feedback.

## Relevance to the central question
Separates two factors that Norevia needs to model: generating candidates (cheap and scalable) and selecting the correct one (bottleneck). More agents only help when a reliable verifier exists. This links "verifiable acceptance" to the value of expanding the swarm.

## Candidate hypotheses
- candidate: the marginal value of more agents or samples is bounded by the verifier's precision; with mechanical acceptance, the curve is log-linear, without it, it plateaus near 100.
- candidate: at equal budget, a smaller model with several samples beats a larger model with one on tasks with a verifier and a low-entropy solution, but not on deep-search tasks such as CodeContests.
- candidate: investing in verification yields more than investing in more generators after a modest N.

## Verification
Opened on 2026-11-07: https://arxiv.org/abs/2407.21787 (v3 confirmed; no venue declared) and https://arxiv.org/html/2407.21787v3. Numbers extracted by an automatic reader, without manual cell-by-cell checking. Fitted values of a and b per task not transcribed (they are in App. C.1; gap).
