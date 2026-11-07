---
id: nat-bacterial-quorum-sensing
title: Bacterial quorum sensing — acting jointly only above a density threshold
area: nature
evidence: natural-phenomenon
tags: [quorum, density-threshold, when-to-cooperate, diffuse-signal, adaptive-activation]
sources:
  - "Miller, M. B. & Bassler, B. L. (2001). Quorum sensing in bacteria. Annu. Rev. Microbiol. 55:165–199. doi:10.1146/annurev.micro.55.1.165"
  - "Waters, C. M. & Bassler, B. L. (2005). Quorum sensing: cell-to-cell communication in bacteria. Annu. Rev. Cell Dev. Biol. 21:319–346. doi:10.1146/annurev.cellbio.21.012704.131001"
related: [nat-response-threshold, nat-quorum-nest-bees, nat-danger-theory, nat-candidates]
updated: 2026-11-07
verification: "Abstracts of both reviews read (OpenAlex). Specific threshold concentrations and cell densities NOT checked → gap."
summary: Bacteria release autoinducers whose concentration rises with population density; once a threshold is crossed, the whole population switches its gene expression — because certain behaviours pay off only when carried out by many cells at the same time.
---

## Mechanism
- Bacteria produce and release **autoinducers**; their concentration increases with cell-population density. Detection of a **minimal threshold stimulatory concentration** alters gene expression (Miller & Bassler 2001, abstract). Gram-negative bacteria generally use acylated homoserine lactones; Gram-positive bacteria use processed oligopeptides.
- Regulated processes include symbiosis, virulence, competence, conjugation, antibiotic production, motility, sporulation and biofilm formation.
- **Functional rationale (Waters & Bassler 2005, abstract):** most processes controlled by quorum sensing are **unproductive when undertaken by an individual bacterium acting alone**, but **beneficial when undertaken simultaneously by a large number of cells**.
- Numerical threshold/density values: `gap` (not given in the abstracts).

## Evidence
`natural-phenomenon` (reviews of the experimental literature).

## Engineering analogue
**Collective activation by signal density:** each agent/routine emits a cheap, standardised signal (e.g. "I observed blocker X") into a shared medium; the expensive collective mode (incident, diagnostic micro-swarm, architecture review) is activated only when the signal concentration — the number of **independent** observations of the same problem within a window — crosses a threshold. This also classifies tasks: some tasks have zero value below a critical mass (e.g. a cross-audit requires ≥ 2 perspectives), and others for which 1 agent suffices.

## Testable hypothesis
- **Variable:** escalation trigger — (A) every individual alert opens an investigation; (B) an investigation is opened only when ≥ q independent alerts about the same problem arrive within window T (q ∈ {2, 3}).
- **Metric:** investigations opened per real problem; real problems missed; time to detection.
- **Prediction:** B reduces duplicate/spurious investigations by ≥ 60% with a detection loss ≤ 5% and a delay ≤ T.
- **Refutation:** if alerts are correlated (a single source generating several), B triggers without any gain; if rare real problems generate only 1 alert, B loses > 5% of detections.

## Limits of transfer
An autoinducer is diffuse and can be read by everyone at no cost; in agent systems, "counting independent signals" requires deduplication by source. Bacteria can also be deceived by signals from other species — an analogue of forged or duplicated alerts.
