---
id: nat-pheromone-evaporation-aco
title: Pheromone with evaporation — double bridges and Ant Colony Optimization
area: nature
realm: seen
evidence: author-reported
tags: [reinforcement-with-decay, routing, exploration-exploitation, lock-in, bounded-memory]
sources:
  - "Goss, S., Aron, S., Deneubourg, J.-L. & Pasteels, J. M. (1989). Self-organized shortcuts in the Argentine ant. Naturwissenschaften 76:579–581. doi:10.1007/BF00462870"
  - "Deneubourg, J.-L., Aron, S., Goss, S. & Pasteels, J. M. (1990). The self-organizing exploratory pattern of the Argentine ant. Journal of Insect Behavior 3:159–168. doi:10.1007/BF01417909"
  - "Dorigo, M., Maniezzo, V. & Colorni, A. (1996). Ant system: optimization by a colony of cooperating agents. IEEE Trans. SMC-B 26(1):29–41. doi:10.1109/3477.484436"
  - "Dorigo, M. & Gambardella, L. M. (1997). Ant colony system: a cooperative learning approach to the traveling salesman problem. IEEE Trans. Evol. Comput. 1(1):53–66. doi:10.1109/4235.585892"
related: [nat-stigmergy, nat-physarum-network, lit-routellm, lit-gptswarm, nat-candidates, sim-stigmergy]
updated: 2026-11-07
verification: "DOIs checked (Crossref). Abstracts of Dorigo 1996/1997 read. PDF of Goss 1989 obtained (ULB repository) but it is a scan without extractable text — the experiment's numbers NOT checked. Deneubourg 1990: metadata only."
summary: Pheromone trails reinforced by use and erased by evaporation let the colony converge on short paths without becoming stuck forever on the first find.
---

## Mechanism
- **Double bridges (Goss et al. 1989; Deneubourg et al. 1990):** Argentine ants between nest and food with two branches tend to concentrate traffic on one branch through positive feedback (ants that pass deposit pheromone; more pheromone attracts more ants). The shorter branch is reinforced earlier because round trips along it are completed sooner. **Numbers (proportions, lengths, choice function) not checked in the original** — scanned PDF without text. Secondary sources also report a **lock-in** effect: if the short branch is offered after the long trail has been established, the majority stays on the long one (`gap` — not checked in the original).
- **Ant System (1996, abstract):** positive feedback to discover good solutions quickly; distributed computation to **avoid premature convergence**; constructive greedy heuristic. **ACS (1997, abstract):** indirect communication via pheromone deposited on the edges of the TSP graph.
- The role of **evaporation** (pheromone decay) is to forget old choices, limiting lock-in. (Central mechanism of ACO; the specific coefficient used by the authors was not checked.)

## Evidence
`natural-phenomenon` (double bridges, no numbers checked) + `author-reported` (ACO on TSP, no local reproduction).

## Engineering analogue
A **router** that chooses a strategy/model/configuration (1 high-effort agent vs micro-swarm, which specialist) with weights reinforced by **accepted results** and with **exponential decay** (half-life h). Memory is bounded by construction: the old weight fades away.

## Testable hypothesis
- **Variable:** half-life h of the router's reinforcement (∞ = no evaporation; 50; 200 tasks) and an abrupt shift in the task distribution midway through the stream.
- **Metric:** cost per accepted task before and after the shift; no. of tasks until 90% of post-shift performance is recovered (readaptation time).
- **Prediction:** h = ∞ suffers lock-in (readaptation > 3× slower than h = 50); finite h loses ≤ 5% at steady state. There is an intermediate h that dominates both extremes.
- **Refutation:** if h = ∞ readapts as fast as finite h (no lock-in), or if any evaporation costs > 5% at steady state, the analogy does not help.

## Limits of transfer
Ants reinforce by *travel time*, a free physical signal; in an LLM, reinforcement depends on reliable acceptance. Reinforcement by "messages"/popularity (not by acceptance) reproduces the risk pointed out in the earlier study for SYMBIONT. ACO is a heuristic for combinatorial optimization, not a proof about agent routing.
