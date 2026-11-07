---
id: nat-inactive-reserve
title: Inactive workers as a capacity reserve
area: nature
evidence: natural-phenomenon
tags: [reserve, idle-capacity, resilience, elastic-swarm, cost]
sources:
  - "Charbonneau, D., Sasaki, T. & Dornhaus, A. (2017). Who needs 'lazy' workers? Inactive workers act as a 'reserve' labor force replacing active workers, but inactive workers are not replaced when they are removed. PLOS ONE 12(9):e0184074. doi:10.1371/journal.pone.0184074"
  - "Charbonneau, D. & Dornhaus, A. (2015). Workers 'specialized' on inactivity: behavioral consistency of inactive workers and their role in task allocation. Behav. Ecol. Sociobiol. 69:1459–1472. doi:10.1007/s00265-015-1958-1 (metadata + partial abstract via secondary index)"
  - "Hasegawa, E., Ishii, Y., Tada, K., Kobayashi, K. & Yoshimura, J. (2016). Lazy workers are necessary for long-term sustainability in insect societies. Scientific Reports 6:20846. doi:10.1038/srep20846"
related: [nat-response-threshold, nat-stellar-thermostat, nat-clonal-expansion-contraction, nat-candidates]
updated: 2026-11-07
verification: "Abstracts of 2017 and 2016 read (OpenAlex). 2015: abstract sentence seen in a secondary index (scite); inactivity percentages differ between press reports and were NOT used."
summary: Consistently inactive ants rapidly replace removed active ones — the colony maintains a number of active workers, not of inactive ones; idleness is a reserve, paid for with short-term productivity.
---

## Mechanism
- **Removal experiment (2017, *Temnothorax rugatulus*):** when the most active workers were removed, colonies **maintained their activity level**: formerly inactive workers became active, with replacement **within 1 week**. When inactive workers were removed, inactivity **dropped and remained low** — there was no replacement even **2 weeks** later. The authors' interpretation: the colony regulates the number of active workers, not of inactive ones; inactive workers function as a reserve (and perhaps as food storage); a communication role is unlikely.
- **Consistency (2015):** inactivity is consistent within individuals and differs between individuals — some "specialise" in inactivity; circadian rhythms or shifts do not explain the pattern (partial abstract via index). Percentages: `gap`.
- **Model (2016):** colonies with variable thresholds persist longer than those with invariant thresholds, because inactive workers replace **fatigued** active ones; the presence of inactive workers increases long-term persistence **at the expense of short-term productivity** (a *bet-hedging* strategy).

## Evidence
`natural-phenomenon` (2017, experimental) + `author-reported` (2016 model).

## Engineering analogue
Deliberate capacity slack: reserved API quota/concurrency and "cold" agents that consume no tokens until activated by a failure, fatigue (saturated context, rate limit) or a demand peak. The analogue of "fatigue" is concrete: a full context window, a rate limit, degradation after many iterations.

## Testable hypothesis
- **Variable:** reserved capacity fraction r ∈ {0, 10%, 25%} under bursty load with injected faults (stuck agent, rate limit).
- **Metric:** p95 latency to acceptance; lost/abandoned tasks; mean utilisation; cost per acceptance.
- **Prediction:** r = 10–25% reduces p95 latency by ≥ 30% and abandoned tasks by ≥ 50% under bursts, with an increase in cost per acceptance ≤ 10% (a cold reserve consumes no tokens). Without bursts/faults, r > 0 only reduces utilisation.
- **Refutation:** if the reserve does not improve p95 under bursts, or if cost rises by > 10% (indicating that the reserve is not truly cold).

## Limits of transfer
Inactive ants consume little and may serve as food storage; idle "warm" agents cost money if kept with a loaded context. In the colony, replacement takes days; in software it should take seconds — the analogy concerns the **policy** (maintain active workers, not inactive ones), not the timescale.
