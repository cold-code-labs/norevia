---
id: nat-danger-theory
title: Danger theory — responding to damage, not to novelty
area: nature
realm: unseen
evidence: hypothesis
tags: [anomaly-detection, escalation-trigger, false-alarm, immunity]
sources:
  - "Matzinger, P. (1994). Tolerance, danger, and the extended family. Annu. Rev. Immunol. 12:991–1045. doi:10.1146/annurev.iy.12.040194.005015"
  - "Matzinger, P. (2002). The danger model: a renewed sense of self. Science 296(5566):301–305. doi:10.1126/science.1071059"
related: [nat-bacterial-quorum-sensing, nat-clonal-expansion-contraction, nat-wound-healing-resolution, lit-bio-autonomic, nat-candidates]
updated: 2026-11-07
verification: "Abstracts of both publications read (OpenAlex). The theory's consensus status in current immunology was not assessed."
summary: Matzinger proposed that the immune system is driven more by damage signals from tissues than by the self/non-self distinction — an influential model, but proposed as a viewpoint, not as established fact.
---

## Mechanism
- **1994 (abstract):** proposes that the immune system "does not care" about self vs non-self; its primary driving force is **to detect and protect against danger**, and it **does not act alone**: it receives positive and negative communications from an extended network of other tissues.
- **2002 (Viewpoint, abstract):** a model in which the immune system is more concerned with **entities that do damage** than with those that are foreign.
- It is a **theoretical proposal** (essay/viewpoint); its current degree of experimental support was not assessed here.

## Evidence
`hypothesis` (in its field of origin: a theoretical model proposed by the author). This is why the card is not `natural-phenomenon`.

## Engineering analogue
Escalate/open an incident on the basis of confirmed **damage signals** (a test that used to pass now fails, an observed regression, a user-visible error, a violated acceptance criterion) and **not** on the basis of novelty/strangeness (a never-seen log line, output in an unusual format, an unknown agent). The "tissues" are the components that report damage; the central detector does not decide alone.

## Testable hypothesis
- **Variable:** escalation trigger — (A) anomaly/novelty (statistical deviation from usual behaviour); (B) damage (violation of a verifiable criterion); (C) A ∧ B.
- **Metric:** false alarms per week; real problems detected; time to detection (in an environment with injected faults and injected benign changes).
- **Prediction:** B reduces false alarms by ≥ 70% vs A while detecting ≥ 90% of faults that cause damage; A detects some silent faults earlier (with no damage observable yet).
- **Refutation:** if B misses > 20% of real faults (damage not observable in time), the damage trigger is insufficient and needs A as a secondary signal.

## Limits of transfer
The theory is contested within its own field; use it only as a hypothesis generator. In software, much damage is silent (data corruption) — waiting for damage may be too late.
