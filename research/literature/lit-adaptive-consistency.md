---
id: lit-adaptive-consistency
title: 'Adaptive-Consistency — number of samples per question decided by agreement'
area: literature
evidence: author-reported
tags: [self-consistency, early-stopping, cost, adaptive-activation, voting]
sources:
  - "Aggarwal, P., Madaan, A., Yang, Y. & Mausam (2023). Let's Sample Step by Step: Adaptive-Consistency for Efficient Reasoning and Coding with LLMs. Proceedings of EMNLP 2023, pp. 12375–12396. doi:10.18653/v1/2023.emnlp-main.761. https://aclanthology.org/2023.emnlp-main.761"
  - "Preprint: arXiv:2305.11860v2 (16 Nov 2023). https://arxiv.org/abs/2305.11860v2"
related: [lit-early-stopping-sc, lit-self-consistency, lit-more-agents]
updated: 2026-11-07
primary_opened: true
version: "v2 (16 Nov 2023); v1 19 May 2023 had 13 datasets and 2 LLMs"
summary: Stopping sampling once the majority answer is already statistically stable reduces self-consistency samples by 3.2× on average, with an accuracy change of −0.07 points across 17 datasets.
---

## Question
Self-consistency uses a fixed number of samples per question. Is it possible to spend less on "easy" questions (fast consensus) and more on hard ones, without losing accuracy?

## Method
Sequential sampling; after each sample, a stopping criterion estimates the probability that the most-voted answer remains the most-voted. Main criterion: Beta(v1+1, v2+1) approximation between the two most frequent answers (Eq. 2, Sec. 3); full Dirichlet is similar in quality but ~4 orders of magnitude slower (Table 2). Threshold C = 0.95 (Sec. 4). Maximum budget: 40 samples (math/commonsense/symbolic); 50/100/1000 for code (APPS/HumanEval-MBPP/CodeContests). Models: GPT-3.5-turbo, Vicuna-13B, code-davinci-002 (+ Incoder-6B, CodeGen-16B for code). 17 datasets.

## Reported result
- Overall average (Table 5): 3.2× fewer generations, Δ accuracy −0.07.
- Per model (Table 1): GPT-3.5-turbo 4.4× (−0.2); Vicuna-13B 1.9× (+0.0); code-davinci-002 3.4× (+0.0).
- Per category (Table 1): Math 3.3× (−0.1); Commonsense 2.9× (−0.2); Symbolic 3.8× (+0.0); Code 2.4× (+0.4).
- Maximum: 7.9× (Boolean Expressions, GPT-3.5-turbo, −0.4 in Table 5 — the text of Sec. 5.3 says "no loss", an inconsistency in the paper).
- At equal average cost, it beats fixed-budget SC at every point tested; ≈+3 points on GSM8K at average cost 10 (Sec. 5.2, Figs. 4/6).
- Accuracy difference not significant (mean p 0.50, 3 seeds; Table 6).

## Cost/compute considered?
Yes, as number of samples (generations). It does not convert to tokens/US$ or latency (sequential sampling increases latency relative to parallel sampling of a fixed N).

## Threats to validity
Voting requires exact-match answers (poor for free-form generation, Sec. 7); "anticipated to fail where Self-Consistency fails" (Limitations) — if the model converges on an error, it stops early on the error; 2023 models; aggregate numbers vary between figure/text (3.3× vs 3.2×; "2 to 4 times").

## Relevance to the central question
Proof of concept of a **per-question budget guided by observed uncertainty**: the collective of samples itself decides when to stop. It is a stopping rule for homogeneous micro-swarms. It does not compare against "one agent with more reasoning", and agreement measures stability, not correctness.

## Candidate hypotheses
- candidate: the optimal number of agents/samples per task is predictable from the agreement of the first k answers; the Beta rule is a mandatory baseline for any Norevia elastic controller.
- candidate: with correlated errors (same model, same prompt), agreement-based stopping saves cost but does not protect against false success — acceptance needs an external verifier.

## Verification
Opened on 2026-11-07: https://arxiv.org/abs/2305.11860 (metadata), https://ar5iv.labs.arxiv.org/html/2305.11860 (text of the latest rendered version), https://aclanthology.org/2023.emnlp-main.761 (venue/DOI). The raw PDF could not be read as text (no local extractor).
