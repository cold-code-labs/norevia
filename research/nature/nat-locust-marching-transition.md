---
id: nat-locust-marching-transition
title: Marching locusts — an abrupt disorder-to-order transition at a critical density
area: nature
realm: seen
evidence: natural-phenomenon
tags: [phase-transition, critical-density, collective-motion, direction-switching, locust]
sources:
  - "Buhl, J. et al. (2006). From disorder to order in marching locusts. Science. doi:10.1126/science.1125142"
related: [nat-vicsek-phase-transition, nat-scale-free-correlation, nat-bacterial-quorum-sensing, nat-kessler-cascade]
updated: 2026-11-08
verification: "Abstract read (OpenAlex). Full text not read; the critical density value and the experimental set-up NOT checked → gap."
summary: Locust nymphs in lab arenas switch from disordered movement to highly aligned marching over a narrow range of densities, and at field-typical densities groups can change direction without any external perturbation.
---

## Mechanism
- Models from theoretical physics predicted that as density rises, mass-migrating groups undergo a **rapid transition from disordered movement to highly aligned collective motion**. Buhl et al. **confirmed the rapid transition and identified a critical density** for the onset of coordinated marching in locust nymphs (abstract).
- They also found a **dynamic instability** at densities typical of the field: groups can switch direction without external perturbation, potentially facilitating the rapid transfer of directional information.

## Evidence
`natural-phenomenon` (laboratory arena experiments checked against a model; author-reported). Complements `nat-vicsek-phase-transition` (model).

## Engineering analogue
**Watch for density-driven phase changes.** Below a critical group size or interaction density, adding agents adds noise; above it behaviour becomes coordinated (and may flip together). Measure order (agreement across agents) against N to locate where adding agents starts to pay — or to correlate errors (cf. `nat-condorcet-correlated`).

## Testable hypothesis
- **Variable:** N agents with local-only visibility of peers' decisions.
- **Metric:** agreement rate vs N; accuracy vs N.
- **Prediction:** agreement jumps over a narrow N range; accuracy gains and correlated failure both emerge there. Refuted if agreement rises smoothly.

## Limits of transfer
A physical-density transition in animals with sensory contact; agents have no density unless a topology defines "neighbours".
