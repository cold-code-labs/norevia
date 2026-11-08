---
id: nat-quorum-nest-bees
title: Quorum, not consensus — how a honey bee swarm decides that it has decided
area: nature
realm: seen
evidence: natural-phenomenon
tags: [quorum, stopping-criterion, verification, when-to-stop, speed-accuracy]
sources:
  - "Seeley, T. D. & Visscher, P. K. (2003). Choosing a home: how the scouts in a honey bee swarm perceive the completion of their group decision making. Behav. Ecol. Sociobiol. 54:511–520. doi:10.1007/s00265-003-0664-6"
  - "Seeley, T. D. & Visscher, P. K. (2004). Quorum sensing during nest-site selection by honeybee swarms. Behav. Ecol. Sociobiol. 56:594–601. doi:10.1007/s00265-004-0814-5"
related: [nat-speed-accuracy-quorum, nat-stop-signal-cross-inhibition, nat-waggle-dance-recruitment, lit-early-stopping-sc, lit-adaptive-consistency, nat-candidates, sim-quorum]
updated: 2026-11-07
verification: "Full text of 2003 read (PDF hosted at bees.ucr.edu, extracted locally). 2004: Crossref metadata only + experimental design described in a secondary index (text not opened)."
summary: Scouts begin preparing for departure when ~10–15 bees are together at the same candidate site, even while dances for other sites are still active — a local quorum replaces global consensus.
---

## Mechanism
- Two hypotheses tested in 4 swarms choosing between 2 nest boxes (2003): **consensus** (scouts notice when all dances advertise a single site) vs **quorum** (they notice when a site receives enough scouts).
- Result (full text): consensus among dancers was **neither necessary nor sufficient** to initiate *worker piping* (the signal preparing for flight). An accumulation of **10–15 or more bees** at a box was consistently associated with the onset of piping. In one swarm, piping began shortly after ~**15** scouts were at the chosen site (≈12 inside, 3 outside), with at most 2 at the other. Piping begins **about one hour** before liftoff.
- The quorum is sensed **at the candidate site** (a local, cheap signal), not across the whole swarm. The authors suggest that a quorum gives a better speed–accuracy balance than consensus.
- 2004 (design as per a secondary index, not checked in the text): splitting the scouts from a single site among 5 boxes delayed piping and liftoff relative to 1 box — consistent with counting by local density.

## Evidence
`natural-phenomenon` (field experiment, n = 4 swarms in 2003 — small sample).

## Engineering analogue
**Quorum stopping criterion:** sample independent solutions/verifications sequentially and stop when k agree on a *verified* answer, without waiting for unanimity or fixed rounds of debate. The "site" is the candidate answer; the quorum is counted there (e.g. k runs that pass the same test/produce the same canonical output).

## Testable hypothesis
- **Variable:** stopping rule — (A) fixed N + majority; (B) consensus (all agree or R rounds); (C) quorum k ∈ {2, 3, 4} over canonical answers, sequential sampling.
- **Metric:** verifiable accuracy; mean no. of calls per task; latency.
- **Prediction:** C with k = 3 reaches accuracy ≥ A − 1 pp with ≥ 40% fewer calls than A (N = 9) and ≥ 30% fewer than B; larger gain on easy tasks (where the quorum forms early).
- **Refutation:** if correlated errors frequently form a wrong quorum (accuracy of C < A − 3 pp), the quorum needs diversity or a verifier — and the pure mechanism is refuted for homogeneous LLMs.

## Limits of transfer
Bees assess the site **independently** (each scout inspects the cavity); samples from the same LLM are not independent (see `nat-condorcet-correlated`). The natural quorum is coupled to quality-proportional recruitment, which filters out poor options beforehand; without that filter, a premature quorum can crystallize an error.
