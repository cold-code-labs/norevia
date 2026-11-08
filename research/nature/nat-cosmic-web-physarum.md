---
id: nat-cosmic-web-physarum
title: The cosmic web traced by a Physarum-inspired algorithm (analogy)
area: nature
realm: beyond
evidence: author-reported
tags: [analogy, physarum, network-reconstruction, cosmic-web, transport-network]
sources:
  - "Burchett, J. N. et al. (2020). Revealing the dark threads of the cosmic web. ApJ Letters 891:L35. doi:10.3847/2041-8213/ab700c (arXiv:2003.04393)"
related: [nat-physarum-network, nat-kessler-cascade]
updated: 2026-11-08
verification: "Abstract and arXiv full text (Poppler pdftotext of arXiv:2003.04393) read in part: method description, '37,662 galaxies from SDSS', and the use of HST/COS spectra confirmed. Statistical results beyond the abstract NOT checked."
summary: A Monte Carlo Physarum Machine, inspired by the slime mould Physarum polycephalum, was used to infer the density field of the cosmic web from 37,662 SDSS galaxies; HST/COS absorption spectra then showed H I absorption rising with the reconstructed density but suppressed in the densest environments.
---

> **Strict analogy.** The cosmic web has no agents, no intention and no learning. The algorithm borrows a slime mould's growth rule; the universe is not doing the same thing.

## Mechanism
- The authors report "a new method inspired by the *Physarum polycephalum* slime mold that is able to infer the density field of the cosmic web from galaxy surveys" (abstract). The Monte Carlo Physarum Machine (MCPM) finds efficient filamentary networks connecting the galaxies; Figure 1 of the paper uses **37,662 galaxies from SDSS** (full text).
- Applying it to galaxy and absorption-line surveys of the local Universe, they find the bulk of the intergalactic medium resides in the web: from the outskirts of filaments (~cosmic mean density, ~5 virial radii from galaxies) to the circumgalactic medium (~200× mean density) they detect an **increasing H I absorption signature at higher density**, but **absorption is suppressed in the densest environments**, suggesting shock-heating/ionisation in filaments and/or galaxy feedback (abstract). The absorption spectra are from the Cosmic Origins Spectrograph on the Hubble Space Telescope (full text).

## Evidence
`author-reported` (published method and analysis). The link to `nat-physarum-network` is that the algorithm reuses its reinforcement rule; the physical filaments are not slime mould.

## Correction for the landing page (realms.mjs)
"Hubble data then found gas where it predicted": the abstract does not describe a prior prediction of gas locations. Suggested wording: "Hubble spectra of background quasars then showed intergalactic gas absorption rising with the reconstructed filament density (suppressed in the densest regions)." The "~37,000 galaxies" figure is supported (37,662).

## Engineering analogue
**One network logic, borrowed:** reinforce links that carry traffic, let others fade; the same rule can reconstruct a transport network from scattered points. In our setting, this supports reusing the Physarum reinforce/prune rule for routing between agents (`nat-physarum-network`), nothing about cosmology.

## Limits of transfer
It shows an algorithm moving across fields, not a natural law shared by slime moulds and galaxies. No claim about agents or intention.
