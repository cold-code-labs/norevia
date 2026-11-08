---
id: nat-myxococcus-group-predation
title: Myxococcus xanthus — group predation whose payoff rises with cell density
area: nature
realm: unseen
evidence: natural-phenomenon
tags: [group-predation, density-dependence, cooperative-digestion, rippling, many-small-agents]
sources:
  - "Rosenberg, E. et al. (1977). Cell density-dependent growth of Myxococcus xanthus on casein. J. Bacteriol.. doi:10.1128/jb.129.2.770-777.1977"
  - "Berleman, J. E. et al. (2006). Rippling is a predatory behavior in Myxococcus xanthus. J. Bacteriol.. doi:10.1128/jb.00559-06"
  - "Berleman, J. E. et al. (2009). Deciphering the hunting strategy of a bacterial wolfpack. FEMS Microbiol. Rev.. doi:10.1111/j.1574-6976.2009.00185.x"
related: [nat-bacterial-quorum-sensing, nat-colony-size-scaling, nat-recruitment-benefit-conditions]
updated: 2026-11-08
verification: "Abstracts of all three read (OpenAlex / Europe PMC). Full texts not read; the 1977 figures quoted below are from the abstract."
summary: Myxococcus xanthus grows on protein only when cells are dense enough to hydrolyse it cooperatively, and groups of cells ripple and prey on other microbes — a task no single cell can complete.
---

## Mechanism
- On casein, M. xanthus showed **cooperative growth**: above 10⁴ cells/ml, growth rate rose with cell number; between 10⁴ and 10⁷ cells/ml mean doubling time fell from 15.2 to 8 h (strain YS) and 26 to 8.5 h (strain TNS). Extracellular proteinase activity was proportional to cell number; at low density the hydrolysed casein in the medium was too low to support growth (Rosenberg 1977, abstract).
- **Rippling** — macroscopic travelling waves of gliding cells — is a feeding behaviour that occurs on direct contact with prey or large macromolecules, inducible by several prey types (Berleman 2006, abstract).
- Berleman & Kirby (2009) review the predatory life cycle: Myxobacteria are mostly predators living on macromolecules released by lysis of other microbes, with group-gliding packs, rippling and fruiting bodies (abstract).

## Evidence
`natural-phenomenon` (laboratory studies and a review).

## Engineering analogue
**Pay-off that only exists above a minimum group size.** For a task whose resource can only be "digested" collectively (needs several perspectives or tools in parallel), one agent has zero yield below critical mass; above it, cost per unit falls. This is the density-dependent counterpart of `nat-bacterial-quorum-sensing`, with an economic rather than gene-expression readout.

## Testable hypothesis
- **Variable:** group size k ∈ {1, 2, 3, 5} on tasks that need ≥ 2 independent skills vs tasks that need one.
- **Metric:** acceptance and cost per success.
- **Prediction:** single agent ≈ 0 on the multi-skill tasks and k ≥ 2 pays; on single-skill tasks k > 1 only adds cost. Refuted if one high-effort agent matches k = 2–3 on the multi-skill tasks.

## Limits of transfer
The 1977 result is a growth-rate effect in liquid culture, not a hunting team; "wolfpack" is a metaphor in the literature. No claim of intent or roles follows.
