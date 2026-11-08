---
id: nat-firefly-synchrony
title: Firefly synchrony — shared rhythm without a conductor, and one reason for it
area: nature
realm: seen
evidence: natural-phenomenon
tags: [synchrony, phase-locking, signal-clutter, no-central-clock, decentralised]
sources:
  - "Buck, J. et al. (1968). Mechanism of rhythmic synchronous flashing of fireflies. Science. doi:10.1126/science.159.3821.1319"
  - "Moiseff, A. et al. (2010). Firefly synchrony: a behavioral strategy to minimize visual clutter. Science. doi:10.1126/science.1190421"
related: [nat-circadian-cadence, nat-vicsek-phase-transition, nat-stigmergy]
updated: 2026-11-08
verification: "Abstracts of both read (OpenAlex). Buck & Buck's proposed mechanism is the authors' interpretation from photometric records and experiments; the later model literature (coupled oscillators, e.g. Ermentrout 1991) NOT read → gap."
summary: Male Pteroptyx fireflies flash in synchrony to within about ±20 ms with no leader; in Photinus carolinus, females recognised an average of 82% of synchronous artificial flashes versus as few as 3% of asynchronous ones, suggesting synchrony reduces visual clutter.
---

## Mechanism
- Buck & Buck: male *Pteroptyx malaccae* in Thai trees flash in rhythmic synchrony with a period of ~560 ± 6 ms (28 °C); flash coincidence is within ~±20 ms, shorter than the minimum eye–lantern response latency, which the authors read as regulation by **central nervous feedback from preceding cycles** rather than direct response to each flash (abstract).
- Moiseff & Copeland: in a virtual environment, females responded to an average of **82% of synchronous flashes versus as few as 3% of asynchronous ones**; one function of synchrony is to **eliminate visual clutter** from other males (abstract).

## Evidence
`natural-phenomenon` (field records and behavioural experiments); the proposed mechanism in 1968 is author interpretation.

## Engineering analogue
**A shared rhythm lets signals be separated from noise.** Agents that act in common time slots (batch windows, heartbeats) make anomalies stand out and let a receiver read many senders at once; no central clock is needed if each agent entrains to the others' last events. Compare with `nat-circadian-cadence`.

## Testable hypothesis
- **Variable:** monitoring agents report (A) at random times vs (B) in entrained windows.
- **Metric:** detection precision/recall of real incidents by a downstream reader.
- **Prediction:** B improves detection when many reporters are active; refuted if the reader's performance does not change with timing.

## Limits of transfer
The clutter benefit is a result in one species' mating-signal context; agent messages are not visual and rhythm has no cost or benefit unless a reader is time-limited.
