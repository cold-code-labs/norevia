---
id: nat-ecoli-run-and-tumble
title: E. coli run-and-tumble — climbing a gradient with a few seconds of memory
area: nature
realm: unseen
evidence: natural-phenomenon
tags: [chemotaxis, local-gradient, short-memory, biased-random-walk, adaptation]
sources:
  - "Berg, H. C. et al. (1972). Chemotaxis in Escherichia coli analysed by three-dimensional tracking. Nature. doi:10.1038/239500a0"
  - "Brown, D. A. et al. (1974). Temporal stimulation of chemotaxis in Escherichia coli. PNAS. doi:10.1073/pnas.71.4.1388"
  - "Segall, J. E. et al. (1986). Temporal comparisons in bacterial chemotaxis. PNAS. doi:10.1073/pnas.83.23.8987"
related: [nat-pheromone-evaporation-aco, nat-homeostasis-allostasis, nat-vicsek-phase-transition]
updated: 2026-11-08
verification: "Abstracts of Brown & Berg 1974 and Segall 1986 read. The 1972 Nature abstract was NOT retrievable (no abstract in OpenAlex/Europe PMC); it is cited as the tracking-microscope origin only, none of its content is quoted. Run/tumble nomenclature is textbook knowledge, not re-checked."
summary: E. coli suppresses spontaneous direction changes while the attractant level is rising and compares concentration over only the last ~4 seconds; a biased random walk with almost no memory is enough to climb a gradient.
---

## Mechanism
- Positive temporal gradients **suppress the directional changes that occur spontaneously** in the absence of a stimulus; negative gradients have little effect; suppression is proportional to the rate of change of the fraction of chemoreceptor bound (Brown & Berg 1974, abstract). A simulation indicated that any "memory" has a decay time of at most a few seconds.
- Tethered-cell experiments confirm that wild-type cells make **short-term temporal comparisons extending 4 s into the past**: the last second weighted positively, the previous 3 s negatively, and the cell responds to the difference. Methylation/demethylation mutants lose this comparison (Segall 1986, abstract).

## Evidence
`natural-phenomenon` (single-cell tracking and tethered-cell experiments).

## Engineering analogue
**Search with a local gradient and a tiny memory.** An agent explores by default and keeps its heading while the last few evaluations improve, changing course when they stop improving — no global map. Useful as the cheapest exploration policy to benchmark against planned search.

## Testable hypothesis
- **Variable:** retry policy on a flaky multi-step task — (A) fixed plan with re-plan on failure; (B) keep strategy while the last w results improve, switch when not (w = 3–4).
- **Metric:** steps to success; tokens.
- **Prediction:** B is competitive on smooth landscapes (progress measurable per step) and loses where progress is not locally measurable. Refuted if B ≥ 20% worse on smooth tasks.

## Limits of transfer
A single cell, not a collective; its relevance is as the minimal local-gradient search. Needs a measurable per-step signal, which many agent tasks lack.
