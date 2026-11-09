---
pivot: foundation
pivot_reason: "General evidence on compute allocation, baselines, verification or correlated errors; no defence-specific efficacy follows."
id: lit-great-models-think-alike
title: "Great Models Think Alike and this Undermines AI Oversight (Goel et al., 2025)"
area: literature
evidence: author-reported
tags: [error-correlation, similarity, capa, llm-as-judge, weak-to-strong, verification]
sources:
  - "Goel, S., Struber, J., Auzina, I. A., Chandra, K. K., Kumaraguru, P., Kiela, D., Prabhu, A., Bethge, M. & Geiping, J. (2025). Great Models Think Alike and this Undermines AI Oversight. arXiv:2502.04313v2 (12 Jun 2025). https://arxiv.org/abs/2502.04313v2 — HTML: https://arxiv.org/html/2502.04313v2"
related: [lit-correlated-errors, lit-hong-page-diversity, lit-synthesis]
updated: 2026-11-07
primary_opened: true
version: "v2 (2025-06-12); v1 2025-02-06"
summary: Proposes the CAPA similarity metric based on overlapping errors and shows that LLM judges favor models similar to themselves, that the weak-to-strong gain comes from complementary knowledge, and that errors become more similar as capability grows.
---

## Question
How can the functional similarity between LMs be measured while discounting chance given their accuracies, and what effect does this similarity have on AI oversight (LLM-as-judge and weak-to-strong training)?

## Method
- **CAPA** (κp; Sec. 2.2, Eqs. 2–4): observed agreement = mean, per question, of Σ_o p1(o)·p2(o) over the options; expected agreement combines each model's mean probability on the correct option with a uniform distribution of the remainder over the wrong ones; κp = (c_obs − c_exp)/(1 − c_exp), in [−1, 1]; 0 = as similar as independent models of the same accuracy. For binary classification it reduces to *error consistency*.
- LLM-as-judge (Sec. 3): 9 judges × 39 evaluated models, filtered MMLU-Pro (8,707 questions, 14 domains); check on AlpacaEval (App. B.4).
- Weak-to-strong (Sec. 4): 4 weak models (1–3B) × 3 strong (7–9B) = 12 pairs, 15 binary tasks from Burns et al. (2024), 180 training runs.
- Trend with capability (Sec. 5): 130 models from OpenLLM Leaderboard 2 on MMLU-Pro and BBH.

## Reported result
- Judge affinity bias: the judge's score correlates with CAPA, mean r ≈ 0.84 (p < 0.01; cross-family pairs). Partial correlation controlling for accuracy remains significant: from ≈0.35 (Llama-3.3-70B, p<0.05) to 0.65 (Llama-3.1-8B and gemma-2-9b, p<0.01). Effect stronger in judges < ~32B (Sec. 3.2, Table 2, Fig. 3).
- Weak-to-strong: similarity correlates negatively with the gain (r = −0.85; partial controlling for the accuracy gap r = −0.35, p<0.01). Table 3 (mean of 180 runs): initial strong student 75.1%; weak supervisor +4.1 pp; weak-to-strong student +7.4; elicitation ceiling +11.2; elicitation + complementary knowledge +14.1. On questions where the weak supervisor was wrong and the elicited strong model was right, mean accuracy 42.2% (Fig. 5) (Sec. 4).
- Similarity grows with capability: strong positive correlation between capability and mean similarity (Fig. 6), maintained per category of MMLU-Pro and BBH (App. D.4); difficulty is a mild confounder; instruction tuning reinforces the trend (App. D.2). The extracted text does not give the numerical value of r/slope for Fig. 6 (gap).

## Cost/compute considered?
Not directly. The focus is the quality of oversight, not inference cost.

## Threats to validity
- Causality not established: it does not show that reducing similarity improves oversight without losing capability (Sec. 7).
- Restricted to multiple choice; similarity on free text is left to future work.
- Judges evaluated in multiple-choice format, not on the open-ended tasks typical of agents.
- Appendix A.7 (limitations of CAPA) was not read (text truncated in extraction).

## Relevance to the central question
Two direct consequences for swarms: (1) **verification by similar peers is biased** — a validator from the same family tends to approve the errors it would itself make; (2) **the gain from cooperation depends on complementary knowledge**, not on the number of agents — the weak-to-strong gain drops when the models are similar. Together with lit-correlated-errors, it indicates that the convergence trend of frontier models reduces the “diversity dividend” available to homogeneous micro-swarms.

## Candidate hypotheses
- candidate: the value of a validator in the micro-swarm is proportional to (1 − CAPA) between validator and executor; validators with high CAPA increase false success.
- candidate: measuring CAPA (or agreement-when-wrong) on a calibration set is a cheap predictor of when adding a 2nd agent pays off.
- candidate: with frontier models increasingly similar, the gain from N homogeneous agents tends to fall across model generations, while the gain from mechanical verifiers (tests, execution) remains.

## Verification
- Opened on 2026-11-07: https://arxiv.org/abs/2502.04313 (v2, 12 Jun 2025; “60 pages, 20 figures”; no venue on the abs page) and https://arxiv.org/html/2502.04313v2 (first ~100k of ~228k characters; late appendices not read).
- Gaps: numerical value of the trend in Fig. 6; content of App. A.7; whether there was a conference publication (ICML 2025?) not confirmed — not claimed here.
