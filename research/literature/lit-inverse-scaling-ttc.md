---
id: lit-inverse-scaling-ttc
title: 'Inverse Scaling in Test-Time Compute — when thinking more makes things worse'
area: literature
evidence: author-reported
tags: [reasoning-effort, overthinking, test-time-compute, failures, safety]
sources:
  - "Gema, A. P., Hägele, A., Chen, R., Arditi, A., Goldman-Wetzler, J., Fraser-Taliente, K., Sleight, H., Petrini, L., Michael, J., Alex, B., Minervini, P., Chen, Y., Benton, J. & Perez, E. (2025). Inverse Scaling in Test-Time Compute. Transactions on Machine Learning Research (TMLR), 12/2025. arXiv:2507.14417v2 (15 Dec 2025). https://arxiv.org/abs/2507.14417v2 · doi:10.48550/arXiv.2507.14417"
related: [lit-overthinking, lit-s1-budget-forcing, lit-nothinking]
updated: 2026-11-07
primary_opened: true
version: "v2 (15 Dec 2025); v1 19 Jul 2025"
summary: On tasks constructed with distractors and spurious correlations, giving frontier models a larger reasoning budget reduced accuracy — the return on reasoning effort can be negative.
---

## Question
Are there tasks in which increasing the reasoning length of Large Reasoning Models (LRMs) **decreases** accuracy? Which failure modes explain this?

## Method
Tasks in four categories: counting with distractors (Misleading Math/Python, famous paradoxes), regression with spurious features (Grades Regression), deduction with constraint tracking (Zebra puzzles) and AI risk evaluations (Model-Written Evaluations, e.g. Survival Instinct). Three regimes: controlled overthinking (requested budget: 0, 1,024, 2,048, 4,096… tokens; "low/medium/high" for the o series), natural overthinking (no budget; comparison by natural length) and cautioned (Appendix D). Models (Table 1): Claude Sonnet 3.7, Sonnet 4, Opus 4, o3-mini, o4-mini, o3, Qwen3-32B, QwQ-32B, DeepSeek R1; focus on Opus 4, o3, R1.

## Reported result
- Misleading Math (Fig. 3): Opus 4 (controlled) drops from ~100% to ~85–90%; R1 (natural) drops from 70% to 30% with five distractors; o3 more stable.
- Misleading Python (Fig. 4): Opus 4 from near-perfect to ~80%; o3 scales positively in controlled and as an inverted U in natural.
- Grades Regression (Figs. 6–7): Sonnet 3.7, Opus 4 and o3-mini with inverse scaling in zero-shot; Qwen3-32B positive; few-shot (8–16 examples) largely removes the inverse trend.
- Zebra (Fig. 8): stronger inverse scaling in natural overthinking for the three focus models.
- Survival Instinct (Fig. 10): Sonnet 4 drops from 60% to 47% aligned answers with more reasoning; o3 rises from 72% to 76%.
- Standard benchmarks (GSM8K, MultiArith etc.) show no significant inverse scaling.
- Authors' conclusion: "scaling test-time compute naively may amplify flaws in how LRMs approach problems."
- The numerical values above are readings from the text describing the figures; there was no access to per-point numerical tables.

## Cost/compute considered?
Indirectly: the axis is reasoning length (tokens), but the paper measures accuracy vs compute, not monetary cost.

## Threats to validity
"The majority of our tasks are synthetically generated" to isolate failures, so the prevalence on real tasks is unknown; trends on MWE weak/noisy; budgets requested via prompt are not exact technical limits; 3–5 repetitions per condition.

## Relevance to the central question
Contradicts the premise "more reasoning ≥ less reasoning". For Norevia, it shows that the individual quality×effort curve can be **non-monotonic** and dependent on model and task; a controller that only "increases effort when uncertain" can make things worse. It also suggests that model diversity (Claude vs o-series vs R1 have different failures) is a way to decorrelate errors that more reasoning from the same model does not offer.

## Candidate hypotheses
- candidate: there is an interior optimal effort per (model, task type); beyond it, more individual reasoning reduces quality, and the extra resource is better used on external verification or on another model.
- candidate: on tasks with distractors/spurious features, a heterogeneous micro-swarm (models with different failure modes) outperforms increasing the effort of a single model at equal cost.
- candidate: examples (few-shot / case memory) can substitute part of the reasoning effort and remove the inverse scaling — link to AgentNet's bounded memory.

## Verification
Opened on 2026-11-07: https://arxiv.org/abs/2507.14417 (metadata and TMLR 12/2025 journal ref), https://arxiv.org/html/2507.14417v2 (text up to ~100k of 214k characters; appendices not read). Gap: per-point numbers come from figure descriptions, not tables; project at https://safety-research.github.io/inverse-scaling-ttc not opened.
