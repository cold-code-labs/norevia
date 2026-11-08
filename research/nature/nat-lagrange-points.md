---
id: nat-lagrange-points
title: Lagrange points — stability conditioned on the mass ratio (analogy)
area: nature
realm: beyond
evidence: natural-phenomenon
tags: [celestial-analogy, contracts, boundaries, station-keeping, asymmetry]
sources:
  - "Sicardy, B. (2010). Stability of the triangular Lagrange points beyond Gascheau's value. Celest. Mech. Dyn. Astron. 107:145–155. doi:10.1007/s10569-010-9259-5"
  - "NASA — Basics of Space Flight, Chapter 5: Planetary Orbits (cited in the earlier study, section 17; not reopened)"
  - "Local calculation: research/nature/calc/collective-theory.js (Gascheau/Routh section)"
related: [nat-orbital-resonance, nat-candidates]
updated: 2026-11-07
verification: "Text of Sicardy 2010 extracted locally from PDF (author's personal page at LESIA/Obs. Paris); Gascheau's formula checked and value recalculated locally. Value of μ∞ (end of the cascade) not extracted (gap)."
summary: L4/L5 are linearly stable only if the secondary mass is less than ~3.85% of the total (Gascheau/Routh value); L1–L3 are unstable and require continual corrections — boundary stability depends on asymmetry and maintenance.
---

## Mechanism
- In the restricted three-body problem, **L1, L2, L3 are unstable**; missions near them require trajectory corrections (*station keeping*). **L4/L5** can be stable under appropriate conditions (earlier study, section 17).
- **Condition (Sicardy 2010, text):** Gascheau's value is the smallest solution of **27μ(1 − μ) = 1**, that is, **μ_G = (1 − √(23/27))/2**. Recalculated locally: **μ_G ≈ 0.038521** (calc/collective-theory-output.txt). Below it, L4/L5 are linearly stable; above it, linearly unstable. Sicardy shows that, beyond μ_G, there still exist stable periodic orbits around L4/L5 in a **Feigenbaum cascade** of period doublings that ends in chaos at a limiting value μ∞ (numerical value not extracted from the PDF → `gap`).
- No Lagrange point is a place where forces "vanish"; it is an equilibrium in the rotating frame.

## Evidence
`natural-phenomenon` (celestial mechanics); the transposition is **strictly analogical**.

## Engineering analogue
An interface between two specialists (handoff/contract) is an "equilibrium point" that: (i) if between symmetric, powerful peers, tends to be **unstable** and requires regular corrections (contract review, boundary tests); (ii) is more stable when there is **clear asymmetry** (one dominant owner of the result, the other a contributor). Operational lesson: handoff contracts need explicit station keeping, with a budgeted cost.

## Testable hypothesis
- **Variable:** ownership structure in a task with 2 agents — (A) symmetric co-authorship (both can change the specification); (B) single owner + contributor with a fixed contract; (C) B + periodic revalidation of the contract (station keeping).
- **Metric:** version/specification divergences at the handoff; rework; acceptance.
- **Prediction:** A has ≥ 2× more divergences than B; C reduces B's residual divergences by ≥ 50% with a revalidation cost ≤ 10% of the total.
- **Refutation:** if A does not diverge more than B, asymmetry does not matter — and the analogy is merely decorative.

## Limits of transfer
The threshold μ_G is exact for a specific mathematical model; there is no "mass ratio" for agents. Used only as a reminder that boundary equilibria can be intrinsically unstable and need active maintenance.
