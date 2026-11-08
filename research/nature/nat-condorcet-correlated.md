---
id: nat-condorcet-correlated
title: Condorcet with correlated votes — accuracy ceiling and "effective n"
area: nature
realm: seen
evidence: local-validation
tags: [collective-theory, correlation, ceiling, when-to-stop-expanding, diversity]
sources:
  - "Ladha, K. K. (1992). The Condorcet jury theorem, free speech, and correlated votes. American Journal of Political Science 36(3):617ff. doi:10.2307/2111584"
  - "Boland, P. J. (1989). Majority systems and the Condorcet jury theorem. The Statistician 38(3):181ff. doi:10.2307/2348873"
  - "Local calculation: research/nature/calc/collective-theory.js → calc/collective-theory-output.txt (exact beta-binomial + numerical integration)"
related: [nat-condorcet-jury, nat-small-groups-correlated-cues, nat-scale-free-correlation, lit-correlated-errors, lit-great-models-think-alike, sim-correlated-vote, nat-candidates]
updated: 2026-11-07
verification: "Abstracts of Ladha 1992 and Boland 1989 read (OpenAlex; Ladha's truncated). Numbers below recalculated locally with a correlation model chosen by us (beta-binomial), not Ladha's."
summary: With positively correlated votes, the majority does not converge to 1: with p = 0.6 and correlation 0.1, not even infinitely many voters exceed ~74% — and the variance of the mean behaves as if there were at most 1/ρ voters.
---

## Mechanism
- **Ladha (1992, abstract):** the theorem assumes **independent** votes and a common objective; Ladha generalizes to **correlated votes**: for large groups, Condorcet's result holds under fairly general conditions; **for small groups, the conditions are severe** (abstract truncated; exact conditions not checked).
- **Local calculation (beta-binomial model, p = 0.6, intra-class correlation ρ):**
  - ρ = 0.05: n = 5: 0.667; 21: 0.745; 101: 0.795; **limit n → ∞: 0.814**.
  - ρ = 0.1: n = 5: 0.655; 21: 0.704; 101: 0.728; **limit: 0.736**.
  - ρ = 0.3: n = 5: 0.626; 21: 0.638; 101: 0.642; **limit: 0.643**.
  - That is, there is a **ceiling** < 1 that depends on ρ; with ρ = 0.3, 100 voters gain only ~4 pp over 1.
- **"Effective n" (statistical identity for the variance of the mean of equicorrelated variables; a derivation, not a citation):** n_eff = n / (1 + (n − 1)ρ), with ceiling **1/ρ**. E.g.: ρ = 0.1 → n = 10 is worth 5.3; n = 1000 is worth 9.9. ρ = 0.3 → ceiling 3.3.

## Evidence
`local-validation` of the mathematics (correlation model chosen by us) — analytical, not empirical. Ladha's theorem is `author-reported`. It is not empirical evidence about LLMs — for that, see `lit-correlated-errors`.

## Engineering analogue
For N copies of the same model, ρ between errors is probably high (copies "think alike"). The ceiling and the effective n give an **expansion stopping rule**: if estimated ρ ≈ 0.3, there is no reason for more than ~3 voters; increasing real diversity (different models/evidence) to reduce ρ is worth more than increasing N. Complements `sim-correlated-vote` (Gaussian copula) with another correlation model — if the conclusions coincide, they gain robustness to the choice of model.

## Testable hypothesis
- **Variable:** N ∈ {1, 3, 5, 9, 15} copies of the same model vs N heterogeneous agents (distinct models/prompts/evidence); ρ measured between pairs of errors on a calibration set.
- **Metric:** voting accuracy; estimated ρ; fit of the curve to a beta-binomial model with estimated (p, ρ).
- **Prediction:** (a) the voting gain saturates near N ≈ 1/ρ̂ (± 50%); (b) the curve predicted by (p̂, ρ̂) matches the observed accuracy within ± 3 pp for N ≤ 15; (c) heterogeneous agents have lower ρ̂ and a higher ceiling.
- **Refutation:** if accuracy keeps rising well beyond N ≈ 1/ρ̂, or if the 2-parameter model is off by > 5 pp (LLM correlation is not well described by a single ρ — e.g. it depends on difficulty).

## Limits of transfer
Real correlation varies with the task (errors concentrated on hard items); a single ρ is a simplification. Beta-binomial is one model choice among several (Gaussian copula, mixture by difficulty); the numbers illustrate the shape, they are not estimates for LLMs.
