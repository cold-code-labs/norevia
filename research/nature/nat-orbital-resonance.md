---
id: nat-orbital-resonance
title: Orbital resonances — stable chains and instability gaps (analogy)
area: nature
realm: beyond
evidence: natural-phenomenon
tags: [celestial-analogy, cadence, dependencies, contention, scheduling]
sources:
  - "Luger, R. et al. (2017). A seven-planet resonant chain in TRAPPIST-1. Nature Astronomy 1:0129. doi:10.1038/s41550-017-0129 (arXiv:1703.04166)"
  - "Murray, C. D. & Dermott, S. F. Solar System Dynamics. Cambridge University Press (Crossref records 2000). doi:10.1017/CBO9781139174817"
  - "NASA — Astronomers Confirm Orbital Details of TRAPPIST-1h (cited in the earlier study, section 16; not reopened)"
related: [nat-circadian-cadence, nat-lagrange-points, nat-candidates]
updated: 2026-11-07
verification: "arXiv abstract of Luger 2017 read (version not recorded by the page — vN gap). Murray & Dermott: book description (OpenAlex) mentions Kirkwood gaps."
summary: The seven planets of TRAPPIST-1 form a chain in which three-body resonances link each member; in the asteroid belt, by contrast, resonances with Jupiter open gaps — the same period relation can stabilize or deplete.
---

## Mechanism
- **TRAPPIST-1 (Luger et al. 2017, abstract):** an orbital period of **18.77 days** measured for the outermost planet, TRAPPIST-1h, consistent with that predicted by the **Laplace relations**; h is the **seventh member of a complex chain**, with **three-body resonances linking every member**. Specific ratios and stability timescales: `gap` (not in the abstract read).
- **Kirkwood gaps (Murray & Dermott, book description):** the book explains the origin of the Kirkwood gaps in the asteroid belt — depleted regions associated with mean-motion resonances with Jupiter (detail not checked in the text).
- That is, period commensurability is a coupling mechanism that **can** protect configurations (chain) or **remove** objects (gaps), depending on the dynamics.

## Evidence
`natural-phenomenon` (observational astronomy + celestial mechanics). The transposition is **strictly analogical**; planets do not exchange information.

## Engineering analogue
Periodic routines and flows with commensurable periods (e.g. 5 min, 15 min, 60 min) **coincide** periodically — which can be useful (phased pipeline: each stage consumes the validated version of the previous one) or harmful (contention peaks when all fire in the same minute). The concrete tool is offset/jitter and versioned dependencies, not astronomy.

## Testable hypothesis
- **Variable:** scheduling of M periodic routines — (A) commensurable periods aligned in phase (all at minute :00); (B) same periods with offsets/jitter; (C) triggering by a dependency event (new version of the input).
- **Metric:** peak concurrency; p95 latency; rework per input change.
- **Prediction:** B reduces peak concurrency by ≥ 50% vs A at the same throughput; C reduces rework by ≥ 50% vs A/B when inputs change rarely.
- **Refutation:** if commensurability does not produce measurable peaks (negligible load) — then the analogy adds nothing to the practice of jitter.

## Limits of transfer
Orbital resonance is conservative gravitational dynamics; scheduling is discrete and dissipative. The analogy does not predict which ratios are "stable" for software. See the caveats of the earlier study, section 16.
