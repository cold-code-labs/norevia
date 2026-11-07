---
id: nat-topological-neighbors
title: Topological interaction with ~6–7 neighbors in starlings
area: nature
evidence: natural-phenomenon
tags: [topology, k-nearest-neighbors, communication-cost, robustness, macro-swarm]
sources:
  - "Ballerini, M., Cabibbo, N., Candelier, R., Cavagna, A., Cisbani, E., Giardina, I., Lecomte, V., Orlandi, A., Parisi, G., Procaccini, A., Viale, M. & Zdravkovic, V. (2008). Interaction ruling animal collective behavior depends on topological rather than metric distance: evidence from a field study. PNAS 105(4):1232–1237. doi:10.1073/pnas.0711437105 (PMC2234121)"
  - "Young, G. F., Scardovi, L., Cavagna, A., Giardina, I. & Leonard, N. E. (2013). Starling flock networks manage uncertainty in consensus at low cost. PLoS Comput. Biol. 9(1):e1002894. doi:10.1371/journal.pcbi.1002894"
related: [nat-scale-free-correlation, nat-physarum-network, lit-agentprune, lit-mixture-of-agents, nat-candidates]
updated: 2026-11-07
verification: "Ballerini 2008: numbers via PMC page. Young 2013: abstract read (OpenAlex)."
summary: Each starling follows a fixed number of neighbors (6.5 ± 0.9), not all those within a radius; this maintains cohesion under attack and, according to a later model, optimizes robustness per individual effort.
---

## Mechanism
- **Ballerini et al. 2008:** in **10** reconstructed events (flocks of > 400 birds, up to ~2,600), each bird interacts on average with a **fixed number of neighbors, n_c = 6.5 ± 0.9 (SE)** — a **topological**, not metric, interaction. Simulations of predator attack: with metric interaction, "stragglers" were **43%** of the connected components; with topological interaction, **5%**. Topological interaction maintains cohesion under large variations in density.
- **Young et al. 2013 (abstract):** using a measure of consensus robustness under noise, networks with **6 or 7 neighbors optimize the trade-off between group cohesion and individual effort**; the optimal number **does not depend on the number of birds**, but on the shape (thickness) of the flock.

## Evidence
`natural-phenomenon` (measurement) + `author-reported` (optimality model).

## Engineering analogue
Each agent reads the outputs of **k fixed peers** (e.g. k neighbors on a ring/sparse graph), not of all N: communication cost O(N·k) instead of O(N²); cohesion is preserved even when agents join/leave (variable density ≈ elastic swarm). The optimum does not depend on N, but on the "thickness" of the task (how many independent dimensions/subproblems).

## Testable hypothesis
- **Variable:** k ∈ {1, 2, 3, 4, 6, N−1} in debate/aggregation with N ∈ {6, 12, 24}.
- **Metric:** final accuracy; context tokens read per agent; variance of the final answer across replicates (cohesion).
- **Prediction:** accuracy saturates at a small k* (k* ≤ 4) **independent of N**; k = N−1 costs O(N²) with no gain > 1 pp over k*.
- **Refutation:** if k* grows with N (scale dependence) or if k = N−1 outperforms k* by > 3 pp.

## Limits of transfer
6–7 is specific to starlings in 3D flight and to one particular robustness measure; it is not a "magic number" for LLMs. LLM agents read long texts — the cost per neighbor is much higher than that of one bird looking at another, which tends to pull k* down.
