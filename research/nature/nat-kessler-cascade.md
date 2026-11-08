---
id: nat-kessler-cascade
title: Kessler syndrome — the critical density at which debris generates more debris (analogy)
area: nature
realm: beyond
evidence: natural-phenomenon
tags: [celestial-analogy, orphaned-work, cascade, critical-density, cleanup]
sources:
  - "Kessler, D. J. & Cour-Palais, B. G. (1978). Collision frequency of artificial satellites: the creation of a debris belt. J. Geophys. Res. 83(A6):2637–2646. doi:10.1029/JA083iA06p02637"
  - "Liou, J.-C. & Johnson, N. L. (2006). Risks in space from orbiting debris. Science 311(5759):340–341. doi:10.1126/science.1121337"
  - "ESA — Space Environment Report 2026 (cited in the earlier study, section 18; not reopened)"
related: [nat-wound-healing-resolution, nat-stellar-thermostat, lit-mast, nat-candidates]
updated: 2026-11-07
verification: "Kessler 1978: abstract (OpenAlex). Liou & Johnson 2006: text read from a PDF copy hosted at vesta.astro.amu.edu.pl (not the publisher's site), extracted locally."
summary: Above a critical spatial density, collisions produce fragments faster than atmospheric drag removes them; NASA's 2006 model projected growth of the LEO population after ~2055 even with no new launches.
---

## Mechanism
- **Kessler & Cour-Palais 1978 (abstract):** as the number of satellites grows, the probability of collisions grows; each collision produces fragments that **increase the probability of further collisions**, leading to the formation of a debris belt. Early implementation of launch restrictions and operational procedures could **significantly delay** its formation.
- **Liou & Johnson 2006 (text):** at some LEO altitudes, where the density of objects is **above a critical spatial density**, the rate of production of new debris by collisions **exceeds the loss** by orbital decay. In the LEGEND projection (Monte Carlo, 200 years, objects ≥ 10 cm, LEO 200–2,000 km), under a **no-new-launches scenario**, collision fragments replace the decaying debris **until ~2055**, keeping the population approximately constant; **after 2055**, fragment creation outpaces decay and the population grows. Catastrophic collision: ratio of impact energy to target mass > **40 J/g**.

## Evidence
`natural-phenomenon` (space-engineering modeling) — the projection is a model, not an observation; the transposition is **strictly analogical**.

## Engineering analogue
Orphaned work (routines, callbacks, delegations without an owner) can generate more orphaned work: one diagnosis triggers another, progress messages turn into new demands. There is a **critical ratio R = rate of generation of derived work / rate of cleanup (completion + cancellation)**; with R > 1 the stock grows on its own even without new user requests. Measures: per-occurrence deduplication, depth limit, mandatory owner, transitive cancellation.

## Testable hypothesis
- **Variable:** (i) probability p of a job spawning a child job without dedup; (ii) containment policy — none vs dedup + depth limit + mandatory owner.
- **Metric:** stock of active jobs over time after the input of new requests stops; orphaned jobs; actions per incident.
- **Prediction:** without containment, there is a p_c (≈ the point at which the mean number of children per job ≥ 1, as in a branching process) above which the stock grows after input stops; with containment, the stock decays to zero for every p tested.
- **Refutation:** if there is no threshold behavior (gradual growth in p) or if containment does not prevent growth above p_c.

## Limits of transfer
Debris obeys orbital physics; jobs obey rules that we write and can change. The analogy does not authorize deleting third parties' records/obligations (see earlier study, section 18).
