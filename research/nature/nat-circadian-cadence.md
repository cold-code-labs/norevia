---
id: nat-circadian-cadence
title: Circadian clocks — a hierarchy of oscillators and "rush hours"
area: nature
realm: seen
evidence: natural-phenomenon
tags: [cadence, multiple-timescales, maintenance, scheduling]
sources:
  - "Mohawk, J. A., Green, C. B. & Takahashi, J. S. (2012). Central and peripheral circadian clocks in mammals. Annu. Rev. Neurosci. 35:445–462. doi:10.1146/annurev-neuro-060909-153128"
  - "Zhang, R., Lahens, N. F., Ballance, H. I., Hughes, M. E. & Hogenesch, J. B. (2014). A circadian gene expression atlas in mammals: implications for biology and medicine. PNAS 111(45):16219–16224. doi:10.1073/pnas.1408886111"
related: [nat-orbital-resonance, nat-homeostasis-allostasis, nat-candidates]
updated: 2026-11-07
verification: "Abstracts read (OpenAlex)."
summary: Across 12 mouse organs, 43% of protein-coding genes oscillate somewhere in the body, in an organ-specific way and concentrated in "rush hours" before dawn and dusk.
---

## Mechanism
- **Hierarchy (Mohawk et al. 2012):** oscillators at the cellular, tissue and systemic levels share the **same autonomous molecular mechanism**; in the suprachiasmatic nucleus (SCN), a **coupled** population of neuronal oscillators acts as the **master pacemaker**; coupling confers robustness on the SCN, which in turn stabilises the temporal architecture of the organism. In most cells, the clocks are intertwined with metabolic pathways.
- **Atlas (Zhang et al. 2014):** transcriptomes of **12 organs** over time; **43%** of protein-coding genes showed circadian rhythms in transcription **somewhere** in the body, largely **organ-specific**. In most organs, peaks cluster in **"rush hours" before dawn and dusk**. More than 1,000 oscillating ncRNAs.

## Evidence
`natural-phenomenon`.

## Engineering analogue
Distinct timescales per function (event-driven, daily, weekly), with **one reference clock** and **local** execution (each component decides what to do within its own window). The "rush hours" suggest **batching** maintenance activities into anticipatory windows rather than spreading them uniformly or polling continuously. Only a fraction of functions need a rhythm; the rest are event-driven.

## Testable hypothesis
- **Variable:** maintenance — (A) continuous polling of state checks; (B) batched windows with an event trigger for urgent cases.
- **Metric:** maintenance cost per useful problem found; detection latency for urgent problems; interference with user work (contention).
- **Prediction:** B reduces cost per useful problem by ≥ 60% with equal latency for urgent cases (because urgent cases are event-driven) and less contention.
- **Refutation:** if relevant problems arise that are detectable only by polling (B's latency worse by > 2× for critical non-urgent cases), or if the windows concentrate contention.

## Limits of transfer
Biological rhythms follow the day/night cycle imposed by the environment; agent load follows users and time zones. This does not imply that LLMs "sleep". See the caveats in the earlier study, section 14.
