---
id: nat-reflex-vs-cortex
title: Spinal reflex, transcortical reflex and voluntary response — latency tiers
area: nature
evidence: natural-phenomenon
tags: [tiered-routing, latency, reflex, effort, adaptive-activation]
sources:
  - "Kurtzer, I. L. (2015). Long-latency reflexes account for limb biomechanics through several supraspinal pathways. Front. Integr. Neurosci. 8:99. doi:10.3389/fnint.2014.00099"
  - "Pruszynski, J. A., Kurtzer, I., Nashed, J. Y., Omrani, M., Brouwer, B. & Scott, S. H. (2011). Primary motor cortex underlies multi-joint integration for fast feedback control. Nature 478:387–390. doi:10.1038/nature10436 (PMC4974074)"
  - "Pruszynski, J. A. & Scott, S. H. (2012). Optimal feedback control and the long-latency stretch response. Exp. Brain Res. 218:341–359. doi:10.1007/s00221-012-3041-8"
  - "Earlier study (read-only): ESTUDO-SWARMS-BIOINSPIRADOS-2026-11-07.txt rev. 2, section 11 (source NIH NBK20367, partial access)."
related: [nat-speed-accuracy-quorum, nat-homeostasis-allostasis, lit-routellm, lit-frugalgpt, lit-adaptive-computation-time, oss-plexil, nat-candidates]
updated: 2026-11-07
verification: "Kurtzer 2015: Frontiers page read (citations below). Pruszynski 2011: manuscript text (PMC4974074, via E-utilities). Pruszynski & Scott 2012: abstract (Europe PMC)."
summary: The arm corrects perturbations in three tiers — spinal (20–45 ms), transcortical (50–100 ms) and voluntary (>100 ms) — and the intermediate tier is already almost as sophisticated as the voluntary one.
---

## Mechanism
- **Three epochs after a sudden limb displacement (Kurtzer 2015):** short-latency reflex (SLR) **20–45 ms**, generated entirely by spinal circuits; long-latency reflex (LLR) **50–100 ms**; voluntary reactions with a delay **> 100 ms**.
- **The intermediate tier is sophisticated (Pruszynski et al. 2011):** neurons of the primary motor cortex (M1) of monkeys integrate shoulder and elbow motion into commands that counter the actual torque **within ~50 ms**; in humans, shoulder responses **~50 ms** after displacement of the elbow alone are potentiated by TMS (causal link with M1). The integration appears in M1 **8–20 ms earlier** than in the muscles. Authors' conclusion: transcortical processing allows feedback responses to have a sophistication that **rivals voluntary control**.
- Review (Pruszynski & Scott 2012): under optimal feedback control, the LLR and voluntary control share circuitry (including M1).
- The boundaries between epochs are not rigid (voluntary responses can intrude into the LLR window in simple tasks — a note from the search, not checked in the original).

## Evidence
`natural-phenomenon` (human and primate neurophysiology).

## Engineering analogue
It is not "dumb reflex vs expensive brain" but **three tiers with increasing cost and latency**: (1) deterministic check by code (state, acceptance criteria, pending CI) — ms, cost ~0; (2) fast model/low effort with minimal context, capable of integrating 2–3 signals; (3) agent with high effort or micro-swarm. Pruszynski's lesson: tier 2 can resolve much more than is assumed — escalation to 3 should be the exception.

## Testable hypothesis
- **Variable:** routing — (A) always tier 3; (B) 1 → 3; (C) 1 → 2 → 3 with escalation on verification failure.
- **Metric:** cost per accepted task; p50/p95 latency; acceptance by difficulty band; rate of unnecessary escalation.
- **Prediction:** C reduces cost by ≥ 50% and p50 latency by ≥ 60% vs A on a set with ≥ 50% easy tasks, with total acceptance ≥ A − 1 pp; tier 2 resolves ≥ 60% of what is not resolved by tier 1.
- **Refutation:** if escalation fails silently (tier 2 flags false success) and C's acceptance drops by > 2 pp, or if tier 2 resolves < 30% — the intermediate tier does not pay for itself.

## Limits of transfer
The nervous system has parallel pathways that run simultaneously; an LLM router usually executes tiers in series, adding up latencies. Reflexes never "decide" that they have finished a task; deterministic checks only know registered criteria (see earlier study, section 11).
