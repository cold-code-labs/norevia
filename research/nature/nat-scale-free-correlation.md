---
id: nat-scale-free-correlation
title: Scale-free correlations in starling flocks
area: nature
realm: seen
evidence: natural-phenomenon
tags: [information-propagation, criticality, correlation, error-cascade]
sources:
  - "Cavagna, A., Cimarelli, A., Giardina, I., Parisi, G., Santagati, R., Stefanini, F. & Viale, M. (2010). Scale-free correlations in starling flocks. PNAS 107(26):11865–11870. doi:10.1073/pnas.1005766107 (PMC2900681)"
related: [nat-topological-neighbors, nat-vicsek-phase-transition, nat-condorcet-correlated, lit-correlated-errors, nat-candidates]
updated: 2026-11-07
verification: "Abstract + numbers via PMC page (WebFetch)."
summary: In flocks of 122 to 4,268 starlings, the range of correlation between velocity fluctuations grows in proportion to the size of the flock (ξ ≈ 0.35 L) — the perturbation of one bird reaches the whole group.
---

## Mechanism
- 3D reconstruction of **24 flocking events**, with **122 to 4,268** individuals and linear size from 9.1 to 85.7 m; mean polarization Φ = 0.96 ± 0.03.
- The correlation length of orientation fluctuations scales **linearly with flock size**: ξ = a·L, **a = 0.35** (n = 24, r = 0.98); for speed fluctuations, **a = 0.36** (r = 0.97). That is, **scale-free** correlations: the change of state of one animal affects and is affected by all the others, however large the group.
- This gives each bird an effective perception range much larger than its range of direct interaction. The authors **suggest** that flocks are close to a critical point (their hypothesis, not an established result).

## Evidence
`natural-phenomenon` (measurement) + `author-reported` (criticality interpretation).

## Engineering analogue
In an LLM swarm, long-range correlation is a double-edged sword: it quickly propagates a correct finding (one agent finds the cause and all adjust) **and** quickly propagates an error (conformity cascade in debate). The analogous parameter is how much each agent adjusts to the state of its neighbors. Measuring "correlation length" = how many agents change their answer after one changes.

## Testable hypothesis
- **Variable:** strength of social coupling (agent sees peers' answers: never / after an independent answer / before answering) × controlled injection of a correct or wrong "seed" agent.
- **Metric:** fraction of the swarm that adopts the seed's answer (cascade reach) when it is correct vs wrong; final accuracy.
- **Prediction:** stronger coupling increases cascade reach **symmetrically** for correct and wrong seeds (ratio reach_correct/reach_wrong < 1.5) — that is, coupling without verification does not discriminate truth.
- **Refutation:** if the reach for correct seeds is ≥ 2× that for wrong ones without a verifier, LLMs discriminate by content and the cascade risk is lower than the analogy suggests.

## Limits of transfer
Flight velocity is a continuous, low-dimensional vector; LLM answers are discrete and semantic. Correlation that is useful for escaping a predator is not the same as correlation that is useful for getting an answer right — in the latter case, independence is valuable (see `nat-condorcet-correlated`).
