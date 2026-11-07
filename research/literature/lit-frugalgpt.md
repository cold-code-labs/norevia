---
id: lit-frugalgpt
title: 'FrugalGPT — LLM cascade with a learned acceptance function'
area: literature
evidence: author-reported
tags: [routing, cascade, cost, adaptive-activation, error-diversity]
sources:
  - "Chen, L., Zaharia, M. & Zou, J. (2024). FrugalGPT: How to Use Large Language Models While Reducing Cost and Improving Performance. Transactions on Machine Learning Research (TMLR). OpenReview: https://openreview.net/forum?id=cSimKw5p6R"
  - "Preprint: arXiv:2305.05176v1 (9 May 2023). https://arxiv.org/abs/2305.05176v1 · doi:10.48550/arXiv.2305.05176"
related: [lit-routellm, lit-adaptive-consistency, lit-early-stopping-sc]
updated: 2026-11-07
primary_opened: true
version: "arXiv v1 (9 May 2023), only version; TMLR 2024 version not opened"
summary: A cheap→expensive cascade with a learned verifier matched GPT-4 at up to 98.3% lower cost on one classification dataset, but it requires labeled data from the same distribution.
---

## Question
Is it possible to query LLMs of very different price (up to two orders of magnitude) in sequence and stop at the first one whose answer "seems reliable", reducing cost without losing quality?

## Method
Three strategies discussed (prompt adaptation, approximation, cascade); the one evaluated is the **cascade**: an ordered list of APIs (length 3); after each answer, a scoring function (DistilBERT fine-tuned for regression, predicting whether the answer is correct given question+answer) is compared against a threshold; if it passes, stop; otherwise call the next model (Sec. 3–4). The list and thresholds are chosen by optimization under an expected-budget constraint (a mixed-integer problem, approximated by pruning and interpolation). 12 APIs from 5 providers, March 2023 prices (Table 1). Datasets: HEADLINES (10,000), OVERRULING (2,400), COQA (7,982) (Table 2), random train/test split.

## Reported result
- Table 3 (same accuracy as the best individual model): HEADLINES cost 33.1→0.6 (−98.3%, vs GPT-4); OVERRULING 9.7→2.6 (−73.3%, vs GPT-4); COQA 72.5→29.6 (−59.2%, vs GPT-3).
- Abstract: "up to 98% cost reduction" or "+4%" accuracy over GPT-4 at the same cost; the caption of Fig. 5 says "up to 5%" and the text of Sec. 4 says "50% to 98%" — internal inconsistencies of the paper itself.
- HEADLINES example (Sec. 4): accept GPT-J if score > 0.96; otherwise J1-L if score > 0.37; otherwise GPT-4. At US$ 6.5 (1/5 of the GPT-4 cost): −80% cost and +1.5% accuracy.
- Mechanism of the gain (Fig. 4, "MPI"): in ~6% of HEADLINES cases and ~13% of COQA, a cheaper model is correct where GPT-4 is wrong — error diversity. The authors say MPI is an upper bound, "may not always be attainable".

## Cost/compute considered?
Yes, it is the central object (US$ per API, input/output tokens and per request). It does not include latency or the cost of training the scorer, which is treated as a one-time upfront cost (Sec. 5).

## Threats to validity
Short classification/QA tasks with a verifiable answer; 2023 prices are obsolete; the scorer needs labels "from the same or similar distribution" (Sec. 5); internally inconsistent numbers (4% vs 5%; 50% vs 59.2%); it does not detect when all the cheap models err in agreement ("open problem", Sec. 5). Only the arXiv v1 version was opened; the TMLR version may have different numbers.

## Relevance to the central question
Direct evidence that **activating more capability only when a cheap verifier rejects** reduces cost substantially on tasks where most queries are easy. It is the "Exodus 18" analogue (selective escalation) already implemented — Norevia cannot claim novelty for confidence-based cascades. It also shows that combining different models can beat the best individual one through uncorrelated errors.

## Candidate hypotheses
- candidate: the savings of a cascade are proportional to the fraction of "easy" queries detectable by a cheap verifier; with a uniformly high difficulty distribution, the savings tend to zero.
- candidate: the quality gain above the best single model is bounded by the fraction of cases in which cheap models are right and the expensive one is wrong (MPI) — i.e., by error decorrelation.
- candidate: the cost of calibrating the verifier (in-distribution labels) is the term that decides whether the cascade pays off at small volumes.

## Verification
Opened on 2026-11-07: https://arxiv.org/abs/2305.05176 (metadata), https://ar5iv.labs.arxiv.org/html/2305.05176 (text, rendering of v1), https://mlanthology.org/tmlr/2024/chen2024tmlr-frugalgpt (venue). Gap: TMLR/OpenReview PDF not opened; the numbers above are from v1.
