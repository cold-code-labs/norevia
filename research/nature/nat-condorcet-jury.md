---
id: nat-condorcet-jury
title: Condorcet's jury theorem — when a majority of mediocre jurors wins
area: nature
evidence: local-validation
tags: [collective-theory, voting, aggregation, when-to-cooperate, 1-vs-n]
sources:
  - "Condorcet, Marquis de (1785). Essai sur l'application de l'analyse à la probabilité des décisions rendues à la pluralité des voix. Paris: Imprimerie Royale. (not consulted directly)"
  - "Boland, P. J. (1989). Majority systems and the Condorcet jury theorem. The Statistician 38(3):181ff. doi:10.2307/2348873"
  - "Grofman, B., Owen, G. & Feld, S. L. (1983). Thirteen theorems in search of the truth. Theory and Decision 15:261–278. doi:10.1007/BF00125672 (bibliography only)"
  - "Local calculation: research/nature/calc/collective-theory.js → calc/collective-theory-output.txt (deterministic)"
related: [nat-condorcet-correlated, nat-small-groups-correlated-cues, sim-correlated-vote, lit-self-consistency, lit-more-agents, nat-candidates, sim-verifier]
updated: 2026-11-07
verification: "Abstract of Boland 1989 read (OpenAlex). Numbers below recalculated locally (exact binomial). The 1785 text and Grofman 1983 not opened."
summary: If n jurors vote independently and each is correct with p > 1/2, the majority is correct with a probability that grows to 1 with n — but slowly: with p = 0.6, ~51 votes are needed to reach ~93%.
---

## Mechanism
- **Statement (Boland 1989, abstract):** if n = 2m + 1 jurors act **independently**, each with probability **p > 1/2** of deciding correctly, the probability that the majority is correct **increases monotonically to 1** as m → ∞. Condorcet argued that there are situations in which it is advisable to entrust a decision to a group of lower individual competence rather than to an individual of higher competence. Boland generalizes to variable competences and dependence between votes.
- **Numbers (exact local calculation, p = 0.6):** n = 1: 0.600; 3: 0.648; 5: 0.683; 7: 0.710; 11: 0.753; 21: 0.826; 51: 0.926; 101: 0.979. With p < 1/2 the majority gets **worse** with n (symmetric).
- Comparison of 1 strong vs N weak: a single juror with p = 0.83 is roughly equivalent to 21 independent jurors with p = 0.6 (0.826) — the aggregation gain is real, but expensive in number of votes.

## Evidence
`local-validation` **of the mathematics only** (exact binomial, script in the repo) — analytical, not empirical. It is not evidence about LLMs; the independence assumption is the part that fails in practice (see `nat-condorcet-correlated`).

## Engineering analogue
Self-consistency/majority voting across samples or agents. The theorem gives the **optimistic ceiling**: even under independence, the marginal gain per additional vote falls quickly (from +4.8 pp for 1→3 to +0.5 pp per vote near n = 51 with p = 0.6). This already suggests micro-swarms (3–7) as the range with the greatest gain per cost and defines the 1-vs-N question: **compare p_high of 1 agent with high effort to A_n of n cheap agents at equal cost**.

## Testable hypothesis
- **Variable:** n ∈ {1, 3, 5, 7, 11} independent samples with low effort vs 1 sample with high effort, at matched cost.
- **Metric:** accuracy per task; p estimated per task; fit to the binomial prediction.
- **Prediction:** on tasks where the measured error correlation is ≈ 0, observed A_n stays within ± 3 pp of the binomial; voting beats the high-effort agent only where p_low > 1/2 per task **and** p_high < A_n(matched cost).
- **Refutation:** if observed A_n falls systematically below the binomial even with measured correlation ≈ 0 (indicating dependence not captured by the metric), or if voting wins on tasks with p_low < 1/2.

## Limits of transfer
Non-binary answers (multiple options) change the mathematics (plurality); p varies by task and is unknown a priori. On tasks with p < 1/2 for the cheap agent, aggregating makes things **worse**. See also the theory agent's results (`research/theory/MODEL-OUTPUT.txt`).
