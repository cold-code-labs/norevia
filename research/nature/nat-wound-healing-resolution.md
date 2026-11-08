---
id: nat-wound-healing-resolution
title: Phased wound healing with active termination (resolution of inflammation)
area: nature
realm: unseen
evidence: natural-phenomenon
tags: [bounded-healing, termination, bounded-repair, return-to-baseline]
sources:
  - "Gurtner, G. C., Werner, S., Barrandon, Y. & Longaker, M. T. (2008). Wound repair and regeneration. Nature 453:314–321. doi:10.1038/nature07039"
  - "Serhan, C. N. (2014). Pro-resolving lipid mediators are leads for resolution physiology. Nature 510:92–101. doi:10.1038/nature13479 (PMC4263681)"
  - "Larouche, J., Sheoran, S., Maruyama, K. & Martino, M. M. (2018). Immune regulation of skin wound healing: mechanisms and novel therapeutic targets. Adv. Wound Care 7(7):209–231. doi:10.1089/wound.2017.0761 (abstract)"
  - "Ellis, S., Lin, E. J. & Tartar, D. (2018). Immunology of wound healing. Curr. Dermatol. Rep. 7:350–358. doi:10.1007/s13671-018-0234-9 (PMC6244748; source of section 12 of the earlier study — identity checked via NCBI esummary; content not reopened)"
related: [nat-clonal-expansion-contraction, nat-danger-theory, nat-kessler-cascade, lit-selfheal, lit-mast, nat-candidates]
updated: 2026-11-07
verification: "Gurtner 2008 and Larouche 2018: abstracts. Serhan 2014: manuscript text (PMC4263681 via E-utilities), sentences on active and self-limited resolution checked. PMC6244748 (earlier study) identified as Ellis, Lin & Tartar 2018; text not reopened."
summary: The acute inflammatory response is self-limited and its resolution is an active program — not a passive dilution; excess inflammation is the main cause of dysregulated healing.
---

## Mechanism
- **Synchronized phases (Gurtner et al. 2008, abstract):** after injury, multiple pathways are activated immediately and synchronized; in adults, repair usually ends in a non-functional fibrotic scar, whereas early fetal tissues regenerate without fibrosis. (The hemostasis–inflammation–proliferation–remodeling sequence is in the earlier study, section 12; not re-checked here.)
- **Active resolution (Serhan 2014, text):** the acute inflammatory response, being protective, is ideally **self-limited**, leading to **complete resolution and return to homeostasis**. Evidence indicates that resolution is an **active, programmed response**, "switched on" by pro-resolving mediators (lipoxins, resolvins, protectins, maresins), **not simply passive dilution** of chemoattractants. There are resolution indices, such as the **resolution interval (R_i)**, that identify agents that accelerate or delay resolution.
- **Excess (Larouche et al. 2018, abstract):** excess inflammation is the **main culprit** in the dysregulation of normal healing; limiting it reduces scarring.

## Evidence
`natural-phenomenon` (reviews of experimental biology). Typical durations of each phase: `gap` (not checked).

## Engineering analogue
An incident/repair has an **explicit, active resolution phase**: an event that shuts down extra agents, withdraws additional supervision, cancels waits and consolidates evidence — and not merely a *timeout* that leaves the system "inflamed". Measure a **resolution interval** (from the peak of active agents to 50% of them) as a health metric. Excessive inflammation = a repair swarm that is too large and generates regressions.

## Testable hypothesis
- **Variable:** termination — (A) passive (agents stop by timeout/inactivity); (B) active (resolution signal triggered by acceptance verification, with cancellation of descendants).
- **Metric:** resolution interval R_i (time from the peak of active agents to 50%); residual orphaned work; recurrence within 7 days; regressions introduced by the repair.
- **Prediction:** B reduces R_i by ≥ 70% and orphaned work by ≥ 80% without increasing recurrence; repair swarms larger than necessary increase regressions (dose–response relationship).
- **Refutation:** if B terminates too early (recurrence rises by > 5 pp) or if repair-swarm size has no relationship with regressions.

## Limits of transfer
There is no equivalence between cell types and agent roles. In software, rollback/backup and authorization are explicit mechanisms with no direct biological analogue. Biological resolution is chemical and local; in distributed systems, cancelling descendants depends on runtime capabilities that need to be verified.
