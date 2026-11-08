---
id: nat-root-foraging
title: Root foraging — proliferating where the soil is rich
area: nature
realm: seen
evidence: natural-phenomenon
tags: [local-sensing, plasticity, investment-where-signal, modular-growth, plants]
sources:
  - "Hodge, A. (2004). The plastic plant: root responses to heterogeneous supplies of nutrients. New Phytologist. doi:10.1111/j.1469-8137.2004.01015.x"
related: [nat-physarum-network, nat-interaction-rate-foraging, nat-response-threshold]
updated: 2026-11-08
verification: "Abstract of the review read (OpenAlex). Full text not read. The landing page says roots 'stop growing where they do not [find nutrients]': the abstract does NOT state this → unverified."
summary: Roots that encounter a nutrient-rich patch often proliferate within it and can raise ion-uptake capacity locally; no single predictor of species-level response has proved definitive.
---

## Mechanism
- "When roots encounter a nutrient-rich zone or patch they often proliferate within it"; roots in a patch can also **enhance their physiological ion-uptake capacities** relative to roots of the same plant outside it. These plastic responses are proposed as the major mechanism for coping with heterogeneous soil nutrients. Attempts to predict species responses from specific root length, root demography or biomass allocation have not been definitive (Hodge 2004, abstract).
- Correction to the landing-page wording: keep "proliferate where they find nutrients"; drop "stop growing where they do not" unless a source is added.

## Evidence
`natural-phenomenon` (review of experiments).

## Engineering analogue
**Invest where the signal is:** allocate more workers/budget to a branch only after a local reward signal is seen, in proportion to it, and let the rest stay lean. Low-regret allocation under uncertainty; cf. `nat-physarum-network` (reinforce what carries flow).

## Testable hypothesis
- **Variable:** budget allocation across sub-tasks — uniform vs shifted toward sub-tasks whose early outputs pass checks.
- **Metric:** accepted outputs per unit cost.
- **Prediction:** shifted allocation wins when early checks predict final value; refuted otherwise.

## Limits of transfer
Plants lack a central controller but are one organism; this is modular plasticity, not a swarm. Include only as a local-investment analogy.
