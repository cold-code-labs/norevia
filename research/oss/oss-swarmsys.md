---
pivot: archive
pivot_reason: "Historical, robotic or unavailable implementation; retain without prominent cyber recommendation."
id: oss-swarmsys
title: SwarmSys — official code not located (Explorers/Workers/Validators only in the paper)
area: oss
evidence: gap
tags: [division-of-labor, validators, pheromone, no-official-code]
sources:
  - "Li et al. (2025). SwarmSys: Decentralized Swarm-Inspired Agents for Scalable and Adaptive Reasoning. arXiv:2510.10047v1. https://arxiv.org/abs/2510.10047v1"
  - "GitHub search (MCP search_repositories, query 'SwarmSys', 2026-11-07): no repository attributable to the authors"
related: [oss-agentnet, oss-symbiont, oss-stigmergic, oss-matrix]
updated: 2026-11-07
summary: SwarmSys describes explorers, workers and validators with reinforcement of validated trails, but there is no public official code to inspect the mechanism.
---

## Identification
- Paper: arXiv:2510.10047v1 (authors listed on the abs page: Ruohao Li, Hongjun Liu, Leyi Zhao, Zisu Li, Jiawei Li, Jiajun Jiang, Linning Xu, Chen Zhao, Mingming Fan, Chen Liang). Abs page consulted on 2026-11-07: the comments field contains only "14 pages, 7 figures"; there is no code link.
- Official repository: **not located**. The GitHub search for `SwarmSys` returned only same-name projects with no link to the authors (e.g. `vzbb/swarmsys`, `smir1998/SwarmSys-AI`, `HODLKONG64/SWARMSY-Ai`); none was attributed to the paper or inspected.
- Commit SHA: nonexistent (there is no code). License: gap.

## Mechanism
Only **[paper/author report]**, according to the previous study (A4 Master, rev. 2, lines 21–30) and the abs page: Explorers, Workers and Validators roles; adaptive agent and event profiles; probabilistic matching via embeddings; pheromone-like reinforcement of validated trails and decay of ineffective ones. No item (termination, acceptance, budget, memory, retry, pruning, elasticity) could be verified in code.

## Evidence
- Observed implementation: none.
- Author report (via previous study, not rechecked in this round): the paper's cost table records US$ 0.071 per question for SwarmSys-8 versus US$ 0.014 for GPT-5 in the instructional block, under the article's conditions. This is neither a current price nor a forecast for the Observatory.
- No code was executed; no benchmark reproduced.

## Engineering analogue
**Hypothesis:** the Validator role is the most transferable point — route reinforcement should depend on verified acceptance, not on activity (contrast with `oss-symbiont`). In the Observatory, this translates into updating routing weights only with tasks accepted by a mechanical verifier.

## Testable hypothesis
**Hypothesis:** a router that reinforces (agent, task type) pairs only after mechanical acceptance reduces cost per accepted task relative to a router that reinforces by message volume, without increasing the false-success rate. Metric: cost per accepted task and false-success rate on a held-out set.

## Limits/gaps
- No official code: mechanism, defaults and termination criteria are unknown in practice.
- If an official repository is published, open a new card with SHA; do not attribute same-name projects to the paper.

## Matrix row
| Explicit termination | Verifiable acceptance | Technical budget (not just prompt) | Communication pruning | Elastic (size adapts) | Bounded memory | License |
|---|---|---|---|---|---|---|
| ? no code | ? validators described only in the paper | ? | ? decay described only in the paper | ? | ? | ? no repository |
