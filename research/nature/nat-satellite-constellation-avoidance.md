---
id: nat-satellite-constellation-avoidance
title: Satellite constellations — a built system that manoeuvres to avoid collisions (NOT natural)
area: nature
realm: beyond
evidence: observed-implementation
tags: [engineered, not-natural, collision-avoidance, autonomy, megaconstellation, kessler]
sources:
  - "SpaceX (2026-07-01). SpaceX Gen 1 and Gen 2 Semi-Annual Reports (status report for 2025-12-01 to 2026-05-31). FCC ICFS attachment bff0244acfb947505791bf252f851ce6, retrieved 2026-11-08. SHA-256 of the retrieved PDF: 0ad265aedaca93827bd6a273f94e1aaed24e3c71d725fea7e6013787143b658c"
  - "Ali, M. et al. (2026). Starlink constellation: deployment, configuration, and dynamics. arXiv:2603.25835 (abstract only)"
  - "McDowell, J. C. (2020). The low Earth orbit satellite population and impacts of the SpaceX Starlink constellation. ApJ Letters 892:L36. doi:10.3847/2041-8213/ab8016 (context; abstract only)"
related: [nat-kessler-cascade, nat-lagrange-points, nat-orbital-resonance]
updated: 2026-11-08
verification: "SpaceX filing: text extracted with Poppler and read around the maneuver counts and the 'onboard collision avoidance system' sentence. The operator's own figures; no independent verification. The filing says the 'onboard collision avoidance system performed as expected' — I found NO sentence stating that every manoeuvre decision is made autonomously on board, so 'autonomous' is only partly supported. Press claims that decisions are made autonomously from Space Force/LeoLabs data come from news summaries, not opened primary sources."
summary: SpaceX reports that its Starlink Gen 1 satellites made 65,137 propulsive collision-avoidance manoeuvres and Gen 2 satellites 142,015 in Dec 2025–May 2026, using a threshold of collision probability 3×10⁻⁷ (vs an industry standard of 10⁻⁴) — an engineered system managing a Kessler-type risk, not a natural swarm.
---

> **Not natural.** This is a human-built system. The realm is "beyond" because it operates outside the Earth's surface; it is not a physical analogy and not evidence about natural swarms.

## What the primary source says
- The SpaceX semi-annual report (1 Dec 2025 – 31 May 2026): Gen 1 satellites performed **65,137** propulsive manoeuvres (≈ 36 per satellite per year) and Gen 2 satellites **142,015** (≈ 46 per satellite per year). SpaceX states it manoeuvres when collision probability exceeds **3×10⁻⁷**, versus an industry standard of **10⁻⁴**, and says its **onboard collision avoidance system** performed as expected over the period. These are operator-reported figures.
- Ali et al. (2026, abstract): from satellite observation data (2019–2025), individual satellites frequently execute collision-avoidance manoeuvres, altitude adjustments and relocations; the constellation is dynamic and heterogeneous.

## Evidence
`observed-implementation` (a deployed system, operator-reported). Not `natural-phenomenon`.

## Link to the project
A coordinated population that avoids collisions by local manoeuvres is the closest thing in orbit to an engineered swarm, and the **cost of manoeuvring grows with population** (manoeuvres per satellite per year are tens, in the report). It sits next to `nat-kessler-cascade`: avoidance is the engineering counterpart of capping density before cascades. It does not show that the satellites coordinate through emergent rules: tracking, screening and decisions involve ground systems and external data per the operator's own reports (not fully read).

## Correction for the landing page (realms.mjs)
"the only real swarm in the sky, and we built it" is a stronger claim than the sources support. Under the project's own definition (observable local autonomy, adaptive interactions, distributed decisions), the filing documents autonomy of the avoidance function only in the phrase "onboard collision avoidance system"; there is no evidence read here of distributed decision-making between satellites. Suggested: "Large constellations manoeuvre to avoid collisions — an engineered system, not a natural swarm; how much of the decision is on board versus on the ground is not established here."

## Limits
Operator-reported numbers; one reporting period; filing covers SpaceX only (not other operators).
