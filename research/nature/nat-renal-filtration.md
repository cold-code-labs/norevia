---
id: nat-renal-filtration
title: Massive renal filtration with selective reabsorption
area: nature
evidence: natural-phenomenon
tags: [bounded-memory, context-compaction, selective-retention, cost]
sources:
  - "Betts, J. G. et al. (2022). Anatomy and Physiology 2e, section 25.5 'Physiology of Urine Formation'. OpenStax (Rice University). https://openstax.org/books/anatomy-and-physiology-2e/pages/25-5-physiology-of-urine-formation"
  - "NIDDK — Your Kidneys & How They Work. https://www.niddk.nih.gov/health-information/kidney-disease/kidneys-how-they-work (cited in the earlier study, section 13; not reopened)"
related: [nat-brain-energy-sparse, lit-agentnet, nat-candidates]
updated: 2026-11-07
verification: "OpenStax page read (numbers below). Open textbook, not a primary paper — primary-source gap for the values."
summary: The kidneys filter ~180 L of plasma per day and return ~99% to the circulation, excreting only 1–2 L — filter everything and reabsorb what matters, instead of choosing what to filter.
---

## Mechanism
- Mean glomerular filtration rate of **~125 mL/min** (men), equivalent to **~180 L/day in men and ~150 L/day in women** (OpenStax 25.5).
- "**Ninety-nine percent** of this filtrate is returned to the circulation by reabsorption", so that **only about 1–2 L** of urine are produced per day.
- The strategy is to **filter non-selectively** (by size/pressure) and then **selectively reabsorb** the water and solutes needed along the tubules; wastes and excesses go on to excretion.

## Evidence
`natural-phenomenon`, with an open-textbook source (primary experimental source → `gap`).

## Engineering analogue
Two-stage memory/context compaction: (1) **discard by default** everything that is transient (logs, attempts, progress messages); (2) **explicitly reabsorb** what has a function: open commitments, decisions with their provenance, user preferences, evidence of acceptance. It is the opposite of "summarize everything a little": it is filtering almost everything and retaining, by rule, a small, typed set.

## Testable hypothesis
- **Variable:** compaction strategy — (A) free-form summary by an LLM; (B) filter-and-reabsorb: discard by default + typed retention (commitments, decisions, preferences, evidence) by rule/schema.
- **Metric:** compression ratio; recall of open commitments and of needed facts in later probe questions; undue loss of information.
- **Prediction:** B reaches compression ≥ 90% with commitment recall ≥ 98%, whereas A, at the same compression, loses ≥ 10% of commitments.
- **Refutation:** if A matches B in recall at the same compression, or if B requires a schema so large that compression drops below 70%.

## Limits of transfer
The kidney knows in advance what to reabsorb (glucose, sodium, water) through evolved transporters; in an agent system, the "reabsorption schema" has to be defined and may omit something important. It does not authorize deleting third parties' memories (see earlier study).
