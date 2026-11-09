---
pivot: foundation
pivot_reason: "General evidence on compute allocation, baselines, verification or correlated errors; no defence-specific efficacy follows."
id: lit-hong-page-diversity
title: "Diversity vs ability: diverse groups outperform groups of the best (Hong & Page, PNAS 2004)"
area: literature
evidence: author-reported
tags: [diversity, collective-intelligence, heuristic-search, group-composition, classic]
sources:
  - "Hong, L. & Page, S. E. (2004). Groups of diverse problem solvers can outperform groups of high-ability problem solvers. Proc. Natl. Acad. Sci. USA 101(46):16385–16389. doi:10.1073/pnas.0403723101 — PMC528939: https://pmc.ncbi.nlm.nih.gov/articles/PMC528939/"
related: [lit-correlated-errors, lit-great-models-think-alike, lit-diversity-of-thought, lit-diverse-debate-hegazy, lit-synthesis]
updated: 2026-11-07
primary_opened: true
version: "PNAS 101(46), 2004 (read via PMC528939; PNAS page returned 403)"
summary: In a search simulation, 10 random agents outperformed the 10 best agents (94.53 vs 92.56) because the best ones converge on similar heuristics — a classic result, from an idealized and contested model, not about LLMs.
---

## Question
Can a group of solvers chosen at random (diverse) outperform a group formed by the individually best ones?

## Method
- Model: each agent = perspective + heuristic. Random value function on n = 2,000 points on a ring (values uniform in [0,100]); n varied from 200 to 10,000.
- Heuristic: check k positions up to l points to the right (1 ≤ k < l); main setting k = 3, l = 12 or 20 (variations l 6–20, k 2–7). All share the same perspective; they differ only in heuristic.
- The group searches sequentially; it stops when no agent improves the solution.
- Compares the 10 or 20 best against 10 or 20 random; 50 trials (Table 1).
- Theorem 1: under conditions of difficulty, diversity (for every non-optimal x some agent improves it), uniqueness of the best agent and full support, there exist N > N1 such that, with probability 1, N1 random agents outperform the N1 best from a pool of N. It is an existence result; it does not give sizes.

## Reported result (Table 1; performance = expected value of the stopping point; diversity in %)
| Composition | Best: performance | Best: diversity | Random: performance | Random: diversity |
|---|---|---|---|---|
| 10 agents, l=12 | 92.56 (0.020) | 70.98 | 94.53 (0.007) | 90.99 |
| 20 agents, l=12 | 93.78 (0.015) | 74.95 | 94.72 (0.005) | 91.46 |
| 10 agents, l=20 | 93.52 (0.026) | 73.69 | 96.08 (0.006) | 94.31 |

- Illustrative run (l=12, 10 agents): best individual 87.3; worst 84.3; group of the best 93.2 (diversity 0.72); random group 94.7 (0.92).
- The advantage of the random group **shrinks from 10 to 20 agents** (gap 1.97 → 0.94).

## Cost/compute considered?
No. There is no cost per agent or per search step; groups have the same size.

## Threats to validity
- Abstract model of search on a ring; agents share the perspective; there is no noisy communication or aggregation error.
- Published critiques exist (Thompson 2014, Notices of the AMS, questioning the strength of the theorem; and replication work in eScholarship/CogSci on binary-string models), but **they were not read in this review** (PDFs not extractable/403) — recorded as a gap, without attributing content.
- The result is about composition at fixed size, not about “more agents vs a better agent”.

## Relevance to the central question
Classic theoretical foundation for “diversity matters more than individual ability” — but the mechanism is specific: the best ones become similar, hence redundant. For LLMs, lit-correlated-errors and lit-great-models-think-alike show exactly this pattern (better models err in similar ways), which makes the argument plausible by analogy, **without demonstrating** that it transfers: here agents sequentially improve a shared solution (they do not vote), and the diversity is in search heuristic, not in training data.

## Candidate hypotheses
- candidate: in shared iterative search/improvement (e.g., debugging with tests), a micro-swarm of distinct strategies outperforms N copies of the best agent, and the gain decreases with N.
- candidate: the benefit of diversity falls when the pool of strategies is small or the group grows (all groups end up covering the space).

## Verification
- Opened on 2026-11-07: https://pmc.ncbi.nlm.nih.gov/articles/PMC528939/ (full text, Table 1, Theorem 1). https://doi.org/10.1073/pnas.0403723101 redirects to pnas.org, which returned HTTP 403.
- The count of the heuristic pool for l=12 (1,320) is a calculation from the formula, not text from the paper; for l=20 the paper states 6,840.
- Gap: critiques (Thompson 2014; CogSci replication) not successfully opened.
