---
id: nat-stellar-thermostat
title: Stellar hydrostatic equilibrium and negative specific heat (physical analogy)
area: nature
realm: beyond
evidence: natural-phenomenon
tags: [celestial-analogy, admission-control, capacity, negative-feedback, instability]
sources:
  - "Lynden-Bell, D. & Wood, R. (1968). The gravo-thermal catastrophe in isothermal spheres and the onset of red-giant structure for stellar systems. MNRAS 138(4):495–525. doi:10.1093/mnras/138.4.495"
  - "Kippenhahn, R., Weigert, A. & Weiss, A. (2012). Stellar Structure and Evolution. Springer (Astronomy and Astrophysics Library). doi:10.1007/978-3-642-30304-3 (bibliography only)"
  - "NASA — Life Cycles of Sun-like and Massive Stars (cited in the earlier study, section 15; not reopened)"
related: [nat-homeostasis-allostasis, nat-inactive-reserve, nat-kessler-cascade, nat-candidates]
updated: 2026-11-07
verification: "Abstract of Lynden-Bell & Wood 1968 read (OpenAlex). Kippenhahn: metadata only. The main-sequence 'thermostat' argument is a standard textbook deduction NOT checked in an open text in this round (gap)."
summary: Self-gravitating systems have negative specific heat — losing energy heats them up; in a star this stabilizes burning, but in concentrated clusters it leads to a self-accelerating instability. A physical analogy, with no intention.
---

## Mechanism
- **Hydrostatic equilibrium:** in a star in equilibrium, the pressure gradient balances gravity (earlier study, section 15, NASA source).
- **Negative specific heat (Lynden-Bell & Wood 1968, abstract):** self-gravitating systems have **negative specific heats**; if heat flows between two of them, the hotter one loses heat and **becomes hotter still**, the colder one gains heat and becomes colder — evolution moves away from equilibrium. For an isothermal sphere of energy E < 0 and mass M in a spherical box, **no equilibrium states exist** if the radius of the box exceeds **0.335 GM²/(−E)** (Antonov's discovery). Extended systems naturally develop a core–halo structure.
- **Stellar thermostat (standard deduction, verification `gap`):** in a main-sequence star, excess energy production expands and cools the core, reducing the fusion rate — negative feedback that stabilizes the "load". The same negative specific heat, in another configuration (a highly concentrated cluster), produces the **gravothermal catastrophe** (positive feedback).
- **No intention:** these are physical equilibria and instabilities, not planning.

## Evidence
`natural-phenomenon` (theoretical physics of self-gravitating systems). The transposition is **strictly analogical**.

## Engineering analogue
Two design lessons for admission control: (1) **negative feedback capacity → load**: when load rises, the system reduces admission/concurrency before degrading (backpressure); (2) **instability alert based on concentration**: when a central component concentrates load and "transfers heat" to the others (e.g. a coordinator that receives everything and generates more work the more it receives), the dynamics can self-accelerate. There is no quantitative correspondence between gravity and queues.

## Testable hypothesis
- **Variable:** admission — (A) no limit (every request starts agents); (B) backpressure with a concurrency limit tuned by the observed queue; and topology — (i) central coordinator that redistributes everything; (ii) coordination via shared state.
- **Metric:** cost per acceptance, p95 latency and no. of active agents under increasing load; presence of self-accelerating growth (active agents growing superlinearly with load).
- **Prediction:** B keeps cost per acceptance stable up to capacity and degrades gracefully; A degrades abruptly; the combination A+(i) exhibits superlinear growth of active agents above a critical load.
- **Refutation:** if A and B degrade equally, or if topology (i) does not show superlinear growth in any regime.

## Limits of transfer
Celestial bodies have no goals; physical stability is not task completion. The analogy only helps to name two control dynamics (negative/positive) that queueing theory already describes without astrophysics.
