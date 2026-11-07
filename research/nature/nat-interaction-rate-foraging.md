---
id: nat-interaction-rate-foraging
title: Interaction rate regulates foraging in harvester ants
area: nature
evidence: natural-phenomenon
tags: [recruitment, feedback-control, elastic-swarm, contraction, bounded-memory]
sources:
  - "Gordon, D. M., Holmes, S. & Nacu, S. (2008; online 2007). The short-term regulation of foraging in harvester ants. Behavioral Ecology 19(1):217–222. doi:10.1093/beheco/arm125"
  - "Prabhakar, B., Dektar, K. N. & Gordon, D. M. (2012). The regulation of ant colony foraging activity without spatial information. PLoS Comput. Biol. 8(8):e1002670. doi:10.1371/journal.pcbi.1002670"
  - "Gordon, D. M. (1996). The organization of work in social insect colonies. Nature 380:121–124. doi:10.1038/380121a0 (bibliographic record only checked)"
  - "Gordon, D. M. & Mehdiabadi, N. J. (1999). Encounter rate and task allocation in harvester ants. Behav. Ecol. Sociobiol. 45:370–377. doi:10.1007/s002650050573 (bibliographic record only checked)"
related: [nat-response-threshold, nat-waggle-dance-recruitment, nat-recruitment-benefit-conditions, nat-candidates, sim-elastic]
updated: 2026-11-07
verification: "Abstracts of 2008 and 2012 read (OpenAlex). 1996 and 1999: Crossref metadata only."
summary: Harvester ants decide to leave the nest to forage based on the recent rate of nestmates returning with food; the colony speeds up or slows down within minutes without anyone knowing how much food exists.
---

## Mechanism
- In *Pogonomyrmex barbatus*, the return of **successful** foragers stimulates inactive foragers to leave the nest. The rate of return depends on food availability (more food → faster returns).
- Field experiment (2008): reducing the rate of return for **3–5 min** caused foraging activity to drop within **2–3 min** and to recover within **up to 5 min**. The authors infer that the decision to leave depends on *very recent* experience of encounters — a short memory that makes the colony risk-averse.
- Model (2012): the intervals between returns follow a **Poisson process**; a feedback algorithm with one fitted parameter (effect of each return on the departure rate) reproduces the observed correlations. There is no spatial information (no trails): regulation is purely by the rate of antennal contacts in the nest.

## Evidence
`natural-phenomenon` (field experiment) + `author-reported` (fitted model).

## Engineering analogue
**Recruitment coupled to acceptance:** the launch rate of new attempts/parallel agents is a function of the recent rate of *accepted results* (passing tests, verified subtasks), with a short window. If nothing accepted comes back, the swarm contracts on its own; if accepted returns speed up, it expands. This is analogous to congestion control (AIMD), but the signal is **verified success**, not absence of error.

## Testable hypothesis
- **Variable:** spawn policy — (A) fixed N of parallel attempts; (B) spawn proportional to the acceptance rate in window W (W ∈ {1, 3, 10} events).
- **Metric:** wasted calls on infeasible tasks (no acceptable solution); time to 1st acceptance on feasible tasks; cost per acceptance.
- **Prediction:** B reduces calls on infeasible tasks by ≥ 50%, with an increase of ≤ 20% in time to 1st acceptance on feasible tasks; small W reacts faster, large W is more stable.
- **Refutation:** if on infeasible tasks B does not contract (because false acceptances feed the loop) or if the delay on feasible tasks exceeds 20%, the hypothesis falls. False acceptances are the critical point: measure the false-success rate.

## Limits of transfer
Ants do not pay a high fixed cost to "switch on" a forager; LLM agents have start-up latency. The biological signal is physical and reliable (a seed brought back); the LLM signal ("accepted") is only valid if acceptance is mechanical/verifiable. Without a verifier, the loop amplifies false success.
