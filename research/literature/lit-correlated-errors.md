---
id: lit-correlated-errors
title: "Correlated Errors in Large Language Models (Kim, Garg, Peng & Garg, ICML 2025)"
area: literature
evidence: author-reported
tags: [error-correlation, monoculture, diversity, llm-as-judge, wisdom-of-crowds]
sources:
  - "Kim, E., Garg, A., Peng, K. & Garg, N. (2025). Correlated Errors in Large Language Models. ICML 2025 (accepted, per arXiv comment). arXiv:2506.07962v1 (9 Jun 2025). https://arxiv.org/abs/2506.07962v1 — HTML: https://arxiv.org/html/2506.07962v1"
related: [lit-great-models-think-alike, lit-hong-page-diversity, lit-silicon-crowd, lit-synthesis]
updated: 2026-11-07
primary_opened: true
version: "v1 (2025-06-09; only version listed)"
summary: Across more than 350 LLMs, when two models are wrong they pick the same wrong answer far above chance (≈60% on HELM), and more accurate models err more similarly — combining different models does not guarantee independent errors.
---

## Question
Are the errors of distinct LLMs independent (the premise of any gain from aggregation/voting) or correlated? Which factors (provider, architecture, size, accuracy) explain the correlation, and what are the consequences for LLM-as-judge and for markets (hiring) where many use LLMs?

## Method
- Three datasets (Sec. 3.1; App. A): HuggingFace Open LLM Leaderboard — 349 models (filtered from 2,041) on 12,032 multiple-choice MMLU questions; HELM — 71 models on 14,042 questions; résumé screening task — 20 LLMs, 1,800 résumé-job pairs (450 hand-labeled).
- Main metric: agreement rate **conditional on both being wrong** (same wrong alternative), compared with the baseline of random choice among wrong alternatives.
- Regression of agreement on same provider, same base architecture, size and accuracy (Table 1).
- Downstream studies: LLM-as-judge (Sec. 4) and hiring/matching simulation with algorithmic monoculture theory (Sec. 5).

## Reported result
- Agreement when both are wrong: mean ≈0.6 on HELM (random baseline ≈1/3) and 0.423 on HuggingFace (baseline 0.127) (Sec. 1, 3.2). 100% of pairs (HF) and 97.5% (HELM) are above baseline. Extreme pair on HELM: google/text-unicorn@001 × writer/palmyra-x-v3 agree on 0.9987 of the questions on which both are wrong (Sec. 3.2).
- Same provider: +0.066 (HF) and +0.022 (HELM), significant; not significant on résumés (p=0.092). Same base architecture: +0.076 (HF) (Table 1).
- **Accuracy ↑ ⇒ error correlation ↑**: positive coefficients in all three datasets; accuracy interaction term significant (HF 0.023; HELM 0.026; Resumes 0.043). R² = 0.340 (HF), 0.613 (HELM), 0.415 (Resumes) (Table 1; App. C). Larger models and models of similar size are also more correlated (Sec. 3.2).
- LLM-as-judge: judges inflate the accuracy of less accurate models (rewarding shared errors) and underestimate more accurate models; inflation is greater for the same provider/architecture (Sec. 4, Fig. 2).
- Hiring (Sec. 5): with p=0.25 and 20 firms, ~20% of candidates are systematically excluded when firms use random LLMs, versus ~0 with uniformly random preferences (Fig. 3). A single shared LLM gives firms the worst welfare (Fig. 4).
- Authors' phrase (Sec. 2): using multiple different models "is not a panacea".

## Cost/compute considered?
No. The paper does not measure inference cost nor directly test ensembles/voting; it measures only the correlation structure of the errors.

## Threats to validity
- The metric treats all wrong answers as equivalent and ignores probabilities (declared limitation, Sec. 6).
- Only multiple choice and single résumé scores; résumé-job fit labels are subjective.
- Leaderboards mix fine-tunes of the same base model (inflating correlation “by construction” on HF).
- Market simulation with 60 candidates and 30 firms.
- There is no aggregation experiment: the link “correlation ⇒ smaller voting gain” is inference, not a test.

## Relevance to the central question
Supplies the variable missing from many “more agents” works: the gain from voting on/aggregating N answers depends on the independence of errors. This paper shows empirically that, among LLMs, errors are strongly correlated and that the correlation **grows with capability** — precisely the models one would choose for a high-quality swarm. Hence, ensembles of strong models from distinct providers may yield less than independent-jury theory (Condorcet) suggests. For Norevia: provider diversity is a weak lever (+0.02 to +0.07 agreement for same provider), and the baseline correlation (0.42–0.6) dominates.

## Candidate hypotheses
- candidate: the marginal gain from adding the k-th voting agent saturates earlier the higher the agreement-when-wrong (ρ) between agents; ρ measured on a calibration sample predicts the saturation point.
- candidate: on multiple-choice/closed-answer tasks, a single strong model with high reasoning beats an ensemble of heterogeneous strong models when ρ > ~0.5 (threshold to be estimated in the Observatory).
- candidate: verification by an LLM judge from the same provider/family as the executor produces more false success (MAST FM-3.3) than a judge from a different family or a mechanical verifier.

## Verification
- Opened on 2026-11-07: https://arxiv.org/abs/2506.07962 (metadata, v1, “Accepted to ICML 2025”) and https://arxiv.org/html/2506.07962v1 (up to ~100k of 117k characters; the final excerpt — late appendices — was not read).
- Numbers above checked against the v1 HTML via extraction; there was no local reproduction.
- Gap: PMLR page (ICML 2025) not opened; not confirmed whether the proceedings version differs from v1.
