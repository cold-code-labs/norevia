---
id: nat-recruitment-benefit-conditions
title: When communicating pays off — the benefit of recruitment depends on ecology
area: nature
evidence: author-reported
tags: [when-to-cooperate, communication, coordination-cost, resource-distribution]
sources:
  - "Dornhaus, A., Klügl, F., Oechslein, C., Puppe, F. & Chittka, L. (2006). Benefits of recruitment in honey bees: effects of ecology and colony size in an individual-based model. Behavioral Ecology 17(3):336–344. doi:10.1093/beheco/arj036"
related: [nat-waggle-dance-recruitment, nat-stigmergy, nat-colony-size-scaling, lit-sas-vs-mas-hybrid, lit-scaling-agent-systems, nat-candidates]
updated: 2026-11-07
verification: "Abstract read (OpenAlex). Parameter values and curves not checked."
summary: In a model of honey bee foraging, communicating food locations helps when sources are few, poor and variable — and can even hinder when food is abundant; colony size had no effect.
---

## Mechanism
- Individual-based model of honey bee foraging, varying the spatial distribution of non-depleting patches and colony size (abstract).
- The benefit of recruitment depended strongly on the **quality, density and variability** of the patches: communication was especially beneficial when patches were **poor, few and variable**.
- Sensitivity analysis: with **high resource density**, recruitment could become **detrimental**, especially if foraging duration was short, the tendency to explore was high, or recruits were slow to find the communicated site.
- **Colony size had no significant effect** on the benefit of recruitment.

## Evidence
`author-reported` (model; the authors link it to seasonal experimental results, not checked here).

## Engineering analogue
"Recruiting" = an agent sharing its lead (hypothesized cause, suspicious file) and redirecting the others. The model's prediction, translated: **sharing helps when solutions are rare and heterogeneous** (a hard bug with a single hidden cause) and **hinders when solutions are abundant** (an easy task, any path works) — because the cost of transmitting/following the lead exceeds the gain. The cost of "finding the communicated site" ≈ the context cost for the receiver to reconstruct the lead.

## Testable hypothesis
- **Variable:** (i) sharing of intermediate findings among K parallel agents (on/off); (ii) solution density of the task (fraction of paths leading to an accepted solution, estimated by prior sampling).
- **Metric:** cost per accepted task; time to acceptance.
- **Prediction:** significant interaction: sharing reduces cost by ≥ 20% on tasks with low solution density and increases cost (≥ 5%) on tasks with high density. The effect of K (size) on the benefit is small compared with the effect of density.
- **Refutation:** if the benefit of sharing does not vary with solution density, or if it is dominated by K.

## Limits of transfer
It is a model, not an experiment; the "resource density" of a software task is not directly observable and needs a proxy. The model's resources are non-depleting; in software, two agents following the same lead can duplicate work.
