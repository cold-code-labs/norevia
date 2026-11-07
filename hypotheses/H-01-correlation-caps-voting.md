---
id: H-01
title: "Error correlation caps the gain from majority voting"
area: hypothesis
evidence: hypothesis
status: preliminary-support
origin: "theory (th-model §2, §10.2) + literature (Condorcet/Ladha; lit-correlated-errors; lit-synthesis candidate 1) + nature (nat-candidates C01; nat-condorcet-correlated; calculation in research/nature/calc)"
experiment: "sims/sim-correlated-vote (done, in the model) + observatory B-vote3/B-vote5 with repetitions of A-low per task to estimate ρ"
tags: [majority-vote, correlated-errors, condorcet]
sources:
  - "Condorcet (1785). Essai sur l'application de l'analyse à la probabilité des décisions rendues à la pluralité des voix. Paris: Imprimerie Royale."
  - "Ladha, K. K. (1992). The Condorcet Jury Theorem, Free Speech, and Correlated Votes. Am. J. Polit. Sci. 36(3):617ss. doi:10.2307/2111584"
  - "Berg, S. (1993). Condorcet's jury theorem, dependency among jurors. Soc. Choice Welf. 10(1). doi:10.1007/BF00187435"
  - "Kim, E., Garg, A., Peng, K. & Garg, N. (2025). Correlated Errors in Large Language Models. arXiv:2506.07962v1"
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, sim-correlated-vote, lit-correlated-errors, lit-self-consistency, lit-more-agents, lit-great-models-think-alike, lit-synthesis, nat-candidates, nat-condorcet-correlated, nat-small-groups-correlated-cues, H-10, H-15, H-17, H-22]
updated: 2026-11-07
summary: "With correlated errors (ρ > 0), adding identical voters converges to a ceiling below 100%; above a small correlation, 1 high-effort agent beats any N."
---

# H-01 — Error correlation caps the gain from majority voting

**Status:** `preliminary-support` · **Card evidence level:** `hypothesis` · **Origin:** theory (th-model §2, §10.2) + literature (Condorcet/Ladha; lit-correlated-errors; lit-synthesis candidate 1) + nature (nat-candidates C01; nat-condorcet-correlated; calculation in research/nature/calc)

## Statement
For identical agents with mean success p > ½ and intra-class correlation ρ > 0 between successes on the same task, majority-vote accuracy A_N grows with N but saturates at A_∞ = 1 − I_{1/2}(a, b) (a = p(1−ρ)/ρ, b = (1−p)(1−ρ)/ρ) — or at the probit ceiling Φ(z_p/√ρ), depending on the dependence model —, and the utility-optimal N falls with ρ.

## Variables
p (success of 1 call), ρ (correlation of successes between runs of the same task), N, V/c (value of a success / cost per agent).

## Prediction (quantitative/directional)
- A_N measured for N ∈ {15, 21, 31} stays below the ceiling predicted by the measured ρ + 3 pp (95% CI).
- p = 0.7: the gain from N = 5 → 21 falls from +13.7 pp (ρ = 0) to +6.9 (ρ = 0.1) and +2.0 (ρ = 0.3); A_101 lies < 1 pp from the ceiling for ρ ≥ 0.1.
- Solo → micro threshold: a vote of 3 only pays off if V/c > 2/E[(2P−1)P(1−P)] (p = 0.7: 23.8 with ρ = 0; 59.4 with ρ = 0.3).
- N* (V = 100, c = 1, p = 0.7) = 9 / 5 / 3 for ρ = 0 / 0.1 / 0.3.
- Competing predictions (nat-C01 vs th-model §11): the nat-C01 rule says N ≤ ⌈1/ρ̂⌉ obtains ≥ 90% of the possible gain; the beta model says it obtains only 50–79% (p = 0.7, ρ = 0.1: N = 11 → 69%; 90% requires N = 43). The experiment decides between the two.

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
Vote accuracy systematically above the predicted ceiling (> 3 pp, 95% CI excluding it) in ≥ 2 task classes; or measured ρ ≈ 0 and early saturation nonetheless (would indicate another mechanism, e.g. difficulty heterogeneity — H-10).

## Proposed experiment
Observatory: for each task, ≥ 10 independent runs of A-low (estimate p and ρ from pairs) and B-vote3/B-vote5 (compare with the predicted A_N). Simulation: `sims/sim-correlated-vote` (already run).

## Current evidence
Model: ceiling and marginal gain checked (model.test.mjs). Simulation `sim-correlated-vote` (local-validation **in the model**, preregistered): P1–P4 supported — ρ ≥ 0.075 already prevents 64 agents with p = 0.6 from reaching 1 agent with p = 0.8. Literature (`lit-correlated-errors`, author-reported): when two LLMs are wrong, they choose the same wrong answer ≈ 60% of the time (HELM; chance ≈ 1/3), and the correlation grows with accuracy — in the model, K_eff ≈ 1.7, close to the binary worst case (th-model §10.2). The independent calculation by the nature agent (`research/nature/calc/collective-theory.js`) reproduces the same beta-binomial ceiling (p = 0.6, ρ = 0.1 → 0.736). **No local LLM measurement** — hence "preliminary".

## Limits
Binary answer (worst case). Dispersed errors favor plurality: ceiling 1 − I_{1/(1+K_eff)}(a,b) (th-model §10.2); on MATH (Monkeys) the vote at ~41% implies K_eff ≈ 9.4.
