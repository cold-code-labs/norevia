---
id: nat-dictyostelium-aggregation
title: Social amoebae — cAMP pulses organise aggregation, and cheating must be tolerated or contained
area: nature
realm: unseen
evidence: natural-phenomenon
tags: [aggregation, pulse-signalling, threshold, cheaters, temporary-collective, division-of-labour]
sources:
  - "Gregor, T. et al. (2010). The onset of collective behavior in social amoebae. Science. doi:10.1126/science.1183415"
  - "Strassmann, J. E. et al. (2000). Altruism and social cheating in the social amoeba Dictyostelium discoideum. Nature. doi:10.1038/35050087"
related: [nat-bacterial-quorum-sensing, nat-response-threshold, nat-clonal-expansion-contraction]
updated: 2026-11-08
verification: "Abstracts of both papers read. Classical wave studies of cAMP aggregation (e.g. Tomchik & Devreotes 1981) NOT verified in this round → the word 'waves' in the landing page is not backed by a source on this card; Gregor et al. describe pulses originating from a discrete location. Full texts not read."
summary: When starved, Dictyostelium cells signal with periodic extracellular cAMP and aggregate; individual cells below a cAMP threshold pulse stochastically, which seeds the collective rhythm, and chimaeric aggregates often contain a cheater clone that contributes less to the sterile stalk.
---

## Mechanism
- Periodic synthesis and release of extracellular **cAMP guide aggregation** and commitment to form fruiting bodies (Gregor 2010, abstract). Live imaging showed pulses originating from a discrete location despite constant exchange of cells; isolated single cells and populations switched from quiescence to rhythmic activity depending on extracellular cAMP concentration. **Stochastic pulsing of single cells below the threshold concentration** plays a critical role in the onset of collective behaviour.
- Strassmann 2000: when starved, 10⁴–10⁵ cells aggregate into a slug; the anterior ~20% differentiates into a non-viable stalk that supports the spores. Using microsatellite markers on field clones, **clones readily mix into chimaeras and half of the chimaeric mixtures showed a clear cheater and victim** (abstract) — development is partly competitive.

## Evidence
`natural-phenomenon` (laboratory imaging and field-collected clones; author-reported in abstracts).

## Engineering analogue
**Temporary collectives need an entry rule and a cheater rule.** Individually noisy signalling below a threshold can bootstrap a collective rhythm; once a collective forms, some members can free-ride (contribute less of the shared cost) — so contributions must be observable and checkable (e.g. verified acceptances per agent).

## Testable hypothesis
- **Variable:** in a pooled-agent task with a shared cost, include one agent that under-contributes; compare (A) equal credit vs (B) credit by verified contribution.
- **Metric:** share of work done by honest agents; success rate; cost per success.
- **Prediction:** A degrades as under-contributors grow; B holds. Refuted if verification cost exceeds the loss from cheating.

## Limits of transfer
"Cheating" here is a genetic-conflict result in one species. LLM agents have no clone conflict of interest unless an incentive is built in; treat this as a design check, not evidence that agents cheat.
