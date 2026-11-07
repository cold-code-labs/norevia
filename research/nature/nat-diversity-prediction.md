---
id: nat-diversity-prediction
title: Diversity prediction theorem — collective error = average error − diversity
area: nature
evidence: local-validation
tags: [collective-theory, diversity, aggregation, estimation, ensemble]
sources:
  - "Page, S. E. (2007). Making the difference: applying a logic of diversity. Academy of Management Perspectives 21(4):6–20. doi:10.5465/amp.2007.27895335"
  - "Page, S. E. (2007). The Difference: How the Power of Diversity Creates Better Groups, Firms, Schools, and Societies. Princeton University Press. (book; not consulted)"
  - "Local calculation: research/nature/calc/collective-theory.js (numerical verification of the identity)"
related: [nat-hong-page-critique, nat-galton-vox-populi, nat-condorcet-correlated, lit-hong-page-diversity, lit-diversity-of-thought, nat-candidates]
updated: 2026-11-07
verification: "Abstract of Page 2007 (AMP) read. The identity was verified numerically in the local script (3 random cases with a fixed seed; equality to 4 decimal places). The equivalent identity in the ensemble literature (ambiguity decomposition, Krogh & Vedelsby 1995) NOT checked."
summary: For numerical estimates aggregated by the mean, the group's squared error is exactly the individuals' mean squared error minus the variance of the estimates — diversity reduces collective error, by algebraic identity.
---

## Mechanism
- **Identity:** with estimates s₁…s_n, mean c = (1/n)Σsᵢ and truth θ: **(c − θ)² = (1/n)Σ(sᵢ − θ)² − (1/n)Σ(sᵢ − c)²** — collective error = average individual error − prediction diversity.
- **Page (2007, abstract):** in predictive tasks, diversity of predictive models reduces collective error; "It's a mathematical fact that diversity matters just as much as highly accurate models when making collective predictions". In problem solving, the benefits would come from superadditivity (combinations of tools), not from a portfolio effect.
- **Local verification:** 3 random trials (seed 42): collective error = average error − diversity, e.g.: 203.9067 = 284.71 − 80.81.

## Evidence
`local-validation` of the identity (it is algebra) — analytical, not empirical. What the identity does **not** say: it does not imply that increasing diversity reduces collective error **while keeping** the average error — "noisy" diversity also increases the average error. Hence the causal reading ("diversity helps") is interpretation, not theorem.

## Engineering analogue
For numerical outputs or scores (cost estimates, probability of success, verifier scores), aggregate by the mean and **measure separately** the two terms: average individual error (competence) and diversity (disagreement). This gives a cheap diagnostic of when adding agents helps: only if the new agent increases diversity **more** than it increases the average error.

## Testable hypothesis
- **Variable:** composition of the group of estimators (N = 5): (A) 5 copies of the same model/prompt; (B) 5 different prompts/models; (C) B with one member known to be poor.
- **Metric:** the three terms of the identity per numerical-estimation task with known ground truth.
- **Prediction:** B has diversity ≥ 2× that of A with an increase in average error < the additional diversity, hence lower collective error; in C, the diversity gain is cancelled by the increase in average error.
- **Refutation:** if B does not reduce collective error vs A (the diversity obtained is mere noise), prompt heterogeneity is not a useful source of diversity.

## Limits of transfer
Holds for squared loss and aggregation by the mean; it does not apply directly to categorical answers or to code. Measured diversity is not independence of errors.
