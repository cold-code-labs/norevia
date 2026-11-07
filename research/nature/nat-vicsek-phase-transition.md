---
id: nat-vicsek-phase-transition
title: Vicsek model — phase transition between disorder and collective motion
area: nature
evidence: author-reported
tags: [phase-transition, noise, consensus, diversity, temperature]
sources:
  - "Vicsek, T., Czirók, A., Ben-Jacob, E., Cohen, I. & Shochet, O. (1995). Novel type of phase transition in a system of self-driven particles. Phys. Rev. Lett. 75(6):1226–1229. doi:10.1103/PhysRevLett.75.1226 (arXiv cond-mat/0611743)"
related: [nat-scale-free-correlation, nat-small-groups-correlated-cues, lit-diverse-debate-hegazy, nat-candidates]
updated: 2026-11-07
verification: "Abstract read (OpenAlex)."
summary: Particles that copy the mean direction of their neighbors with noise η pass from disorder to collective motion when the noise falls below a critical value — a continuous transition with exponent β ≈ 0.45.
---

## Mechanism
- Particles with constant absolute velocity; at each step, each adopts the **mean direction of its neighbors** within a radius, plus a random perturbation η.
- Numerical evidence of a **kinetic phase transition**: from no transport (mean velocity |v_a| = 0) to finite net transport, through spontaneous breaking of rotational symmetry.
- The transition is **continuous**: |v_a| ∝ (η_c − η)^β with **β ≃ 0.45** (abstract). The position of η_c depends on density (detail not checked in the full text).

## Evidence
`author-reported` (numerical model from statistical physics; not a measurement in animals).

## Engineering analogue
"Noise" = diversity/sampling temperature/independence of the agents; "aligning with neighbors" = adjusting one's answer to those of peers. Qualitative prediction: there is a noise regime below which the swarm **always** converges (consensus, including premature consensus) and above which it does not converge — and the passage can be abrupt, not gradual. Design the swarm close to the transition, but on the right side of it.

## Testable hypothesis
- **Variable:** sampling temperature / degree of prompt diversity (η) × interaction density (k neighbors read).
- **Metric:** order parameter = fraction of agents on the modal answer after R rounds; accuracy of the modal answer.
- **Prediction:** the order parameter drops nonlinearly (steep sigmoid) at an η_c that decreases when k decreases; the accuracy of the modal answer is maximal slightly below η_c (consensus still forms, but with more exploration).
- **Refutation:** if the order parameter falls linearly with η (no transition) or if accuracy is monotonic in η (no intermediate optimum).

## Limits of transfer
Vicsek particles have no "right answer": order is not accuracy. LLM answers are discrete and multimodal; transitions may be first-order or nonexistent. Strictly heuristic use for designing parameter sweeps.
