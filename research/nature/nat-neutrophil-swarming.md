---
id: nat-neutrophil-swarming
title: Neutrophil swarming — recruitment by signal relay, ended by self-limiting feedback
area: nature
realm: unseen
evidence: natural-phenomenon
tags: [relay, recruitment, negative-feedback, local-signal, self-limiting]
sources:
  - "Lämmermann, T. et al. (2013). Neutrophil swarms require LTB4 and integrins at sites of cell death in vivo. Nature. doi:10.1038/nature12175"
  - "Kienle, K. et al. (2021). Neutrophils self-limit swarming to contain bacterial growth in vivo. Science. doi:10.1126/science.abe7729"
related: [nat-bacterial-quorum-sensing, nat-wound-healing-resolution, nat-informed-leaders, nat-kessler-cascade]
updated: 2026-11-08
verification: "Abstracts of both papers read (Europe PMC / OpenAlex). Full text not read; quantitative parameters (radius, timing, receptor identities beyond those named) NOT checked → gap."
summary: Neutrophils in damaged tissue amplify a local death signal by releasing leukotriene B4 (LTB4) themselves, which widens the zone of directed recruitment; a negative feedback (receptor desensitisation to their own attractants) later stops the migration.
---

## Mechanism
- Using two-photon intravital microscopy in mouse sterile injury and infection, Lämmermann et al. report a critical role for **intercellular signal relay among neutrophils mediated by LTB4**, which acutely amplifies local cell-death signals and **enhances the radius of directed neutrophil recruitment** (abstract).
- Integrins were dispensable for long-distance migration but needed to keep dense clusters together and to form a "wound seal"; the seal's borders stop growing as monocytes and macrophages arrive late (abstract).
- Kienle et al. (2021): neutrophils **self-limit** swarming; GPCR desensitisation acts as **negative feedback** that stops migration when cells sense high concentrations of the attractants they secrete themselves, which initially amplify swarming. Interfering with it lets neutrophils scan larger areas but, unexpectedly, did not improve bacterial clearance because containment by clusters became worse (abstract).

## Evidence
`natural-phenomenon` (in vivo mouse experiments, author-reported in abstracts; not independently reproduced here).

## Engineering analogue
**Recruit by relay, then stop by self-limit:** a worker that finds a problem emits a cheap signal that raises the odds nearby workers join; each joiner re-emits, so the recruitment radius grows with the problem. A built-in desensitisation (diminishing response to saturated signals) caps the pile-up. Compare with `nat-bacterial-quorum-sensing` (density threshold) and `nat-wound-healing-resolution` (active stop).

## Testable hypothesis
- **Variable:** helper recruitment — (A) broadcast to all idle agents; (B) relay: only agents that received a request may re-emit it, with response gain falling as the signal saturates.
- **Metric:** agents engaged per problem; time to first fix; duplicate work.
- **Prediction:** B engages fewer agents than A for small problems without raising time to first fix; refuted if the relay misses problems beyond the first hop.

## Limits of transfer
Chemical relay is physical and local; agent messaging is not diffusive unless we impose a topology. The Kienle result also warns that more scanning is not better: tuning matters, and the effect on clearance was an unexpected cost, not a gain.
