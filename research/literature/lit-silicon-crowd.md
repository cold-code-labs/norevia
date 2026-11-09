---
pivot: archive
pivot_reason: "Generic aggregation or forecasting is peripheral to collective defence; retain as historical comparison."
id: lit-silicon-crowd
title: "Wisdom of the Silicon Crowd: an ensemble of 12 LLMs rivals a human crowd in forecasting (Schoenegger et al., 2024)"
area: literature
evidence: author-reported
tags: [wisdom-of-crowds, ensemble, forecasting, aggregation, diversity, acquiescence-bias]
sources:
  - "Schoenegger, P., Tuminauskaite, I., Park, P. S., Valdece Sousa Bastos, R. & Tetlock, P. E. (2024). Wisdom of the silicon crowd: LLM ensemble prediction capabilities rival human crowd accuracy. Science Advances 10(45). doi:10.1126/sciadv.adp1528"
  - "Preprint: Schoenegger, P., Tuminauskaite, I., Park, P. S. & Tetlock, P. E. arXiv:2402.19379v6 (22 Jul 2024). https://arxiv.org/abs/2402.19379v6 — HTML: https://arxiv.org/html/2402.19379v6"
related: [lit-correlated-errors, lit-hong-page-diversity, lit-synthesis]
updated: 2026-11-07
primary_opened: true
version: "arXiv v6 (2024-07-22); Science Advances 10(45) version not opened"
summary: The median of 12 different LLMs statistically tied with the median of 925 humans on 31 binary forecasting questions (Brier 0.20 vs 0.19), but with acquiescence bias and a small sample.
---

## Question
Does aggregating ("wisdom of crowds") the forecasts of several heterogeneous LLMs reach the accuracy of a human crowd in a forecasting tournament? And do LLMs improve when they see the human forecast?

## Method
- Study 1 (Sec. 2.1): 12 different LLMs (Table 1) forecast 31 binary questions from a 3-month tournament with 925 human forecasters; forecasts collected via web interfaces with default settings; aggregation by the median; Brier metric; preregistered difference test and non-preregistered equivalence test.
- Study 2 (Sec. 3.2): GPT-4 and Claude 2 receive the human median and update their forecasts.

## Reported result
- Brier of the LLM crowd M = 0.20 (SD 0.12) vs human crowd M = 0.19 (SD 0.19); t(60) = 0.19, p = 0.850 (Sec. 3.1).
- Against the no-information benchmark (50% on everything, Brier 0.25): t(30) = −2.35, p = 0.026 (BH-adjusted 0.039).
- Equivalence (bounds d = 0.5 ≈ 0.081 Brier, not preregistered): lower t(60)=2.16, p=0.017; upper t(60)=−1.78, p=0.040.
- Differences between models: F(12, 354) = 2.64, p = 0.002. Only 3 of the 12 models outperformed the median of the models (Sec. 4).
- Acquiescence bias: mean forecast 57.35% (SD 20.93), median 60%, although only 14 of 31 (~45%) questions resolved “yes”.
- Study 2: Brier GPT-4 0.17 → 0.14; Claude 2 0.22 → 0.15. The simple human+machine average was better than the updated forecasts (GPT-4: 0.13, t(92)=2.583, p=0.011; Claude 2: 0.14, t(92)=3.530, p=0.001). The abstract mentions an improvement of 17–28%; the rounded Brier scores imply ~18% and ~32% — the range is not derived in the body (inconsistency to record, not corrected here).

## Cost/compute considered?
Only qualitatively: the Discussion (Sec. 4) says that the ensemble is “substantially cheaper and faster” than collecting human forecasts. No cost figures or comparison with a single high-reasoning LLM.

## Threats to validity
- Only 31 questions from one tournament; low statistical power; equivalence with wide bounds and not preregistered.
- Collection via web UI, models changing during the study, 109 missing forecasts.
- Does not compare the ensemble with the best individual model under the same budget; the question “ensemble vs one strong model” remains open.
- Poor calibration and overconfidence of the aggregate.
- The published version (Science Advances, with an additional co-author) may differ from v6.

## Relevance to the central question
Evidence that aggregating heterogeneous models produces a “crowd”-level result, but **not** that it outperforms a single strong model at the same cost — the paper does not test this. It also shows a shared bias (acquiescence) that aggregation does not remove: systematic error common to all members survives the median, consistent with lit-correlated-errors. And Study 2 suggests that combining sources with weakly correlated errors (human + machine) beats letting one agent “absorb” the other source.

## Candidate hypotheses
- candidate: aggregation by median/voting corrects variance error, but not shared bias; the gain from N agents is limited by the fraction of error that is common bias.
- candidate: averaging independent sources (external aggregation) outperforms “debate/updating” in which one agent sees the other's answer, when the sources have weakly correlated errors.

## Verification
- Opened on 2026-11-07: https://arxiv.org/abs/2402.19379 (v1–v6; v6 = 22 Jul 2024; no journal-ref on the abs page), https://arxiv.org/html/2402.19379v6 (numbers above), https://researchonline.lse.ac.uk/id/eprint/125626 (Science Advances 10(45) citation, doi:10.1126/sciadv.adp1528).
- Gap: the Science Advances article (doi:10.1126/sciadv.adp1528) was not opened; numbers come from arXiv v6.
