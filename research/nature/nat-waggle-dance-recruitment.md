---
id: nat-waggle-dance-recruitment
title: Waggle dance — recruitment proportional to quality
area: nature
evidence: natural-phenomenon
tags: [recruitment, proportional-allocation, best-of-n, how-much-to-cooperate]
sources:
  - "Seeley, T. D., Mikheyev, A. S. & Pagano, G. J. (2000). Dancing bees tune both duration and rate of waggle-run production in relation to nectar-source profitability. J. Comp. Physiol. A 186:813–819. doi:10.1007/s003590000134 (PMID 11085635)"
  - "Seeley, T. D., Camazine, S. & Sneyd, J. (1991). Collective decision-making in honey bees: how colonies choose among nectar sources. Behav. Ecol. Sociobiol. 28(4). doi:10.1007/BF00175101 (bibliography only)"
  - "Seeley, T. D. & Buhrman, S. C. (2001). Nest-site selection in honey bees: how well do swarms implement the 'best-of-N' decision rule? Behav. Ecol. Sociobiol. 49:416–427. doi:10.1007/s002650000299 (bibliography only + automatic Semantic Scholar TLDR)"
related: [nat-quorum-nest-bees, nat-recruitment-benefit-conditions, nat-interaction-rate-foraging, lit-large-language-monkeys, nat-candidates]
updated: 2026-11-07
verification: "Abstract of 2000 read (PubMed). 1991 and 2001: metadata only; the 2001 claim comes from an automatic TLDR — treated as a gap."
summary: Bees dance longer and faster for better sources; recruitment scales with quality without any bee comparing the options.
---

## Mechanism
- Seeley, Mikheyev & Pagano (2000, PubMed abstract): foragers adjust the **duration D** and the **rate R** of waggle-run production, so that the no. of waggle runs per trip **W = D·R** is a function of source profitability; **D and R increase with profitability**. The rate is adjusted through the duration of the return phase of the dance circuit.
- Collective consequence (Seeley et al. 1991, not opened): the colony directs foragers to the best sources without individual comparison between sources — the comparison emerges from competition between recruitment efforts of different intensities. **Details and numbers of 1991: `gap`.**
- In nest-site selection, scouts would adjust dance strength to site quality (Seeley & Buhrman 2001) — a claim seen only in an automatic summary → `gap`.

## Evidence
`natural-phenomenon` (2000 abstract read); the rest → `gap` in the details.

## Engineering analogue
**Proportional allocation of continuation compute:** in best-of-N/tree search, each partial candidate receives new expansions in proportion to a **verifiable quality signal** (passing tests, coverage, verifier score), rather than uniformly. No agent needs to compare all the options: the comparison emerges from competition for budget.

## Testable hypothesis
- **Variable:** budget-allocation policy among candidates — (A) uniform (N independent samples); (B) proportional to verified partial quality (e.g. fraction of tests passing), with a minimum exploration floor.
- **Metric:** pass@budget (fraction of tasks solved for B fixed tokens); cost to the 1st accepted solution.
- **Prediction:** B solves ≥ 15% more tasks at equal budget when the partial signal is informative (correlation ≥ 0.4 with final success); without an informative signal, B ≈ A.
- **Refutation:** if B does not beat A even with an informative signal, or if it loses > 5% through premature collapse onto a locally good candidate (lack of exploration).

## Limits of transfer
Nectar profitability is measured directly by the bee itself; partial signals in code can be misleading (passing weak tests). Proportional recruitment without an exploration floor can converge too early.
