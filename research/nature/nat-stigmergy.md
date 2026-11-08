---
id: nat-stigmergy
title: Stigmergy — coordination through the state of the work, not through messages
area: nature
realm: seen
evidence: natural-phenomenon
tags: [stigmergy, indirect-communication, shared-state, communication-pruning]
sources:
  - "Grassé, P.-P. (1959). La reconstruction du nid et les coordinations interindividuelles chez Bellicositermes natalensis et Cubitermes sp. La théorie de la stigmergie. Insectes Sociaux 6:41–80. doi:10.1007/BF02223791 (bibliographic record only checked)"
  - "Theraulaz, G. & Bonabeau, E. (1999). A brief history of stigmergy. Artificial Life 5(2):97–116. doi:10.1162/106454699568700"
related: [nat-pheromone-evaporation-aco, oss-stigmergic, lit-agentprune, nat-physarum-network, nat-candidates, sim-stigmergy]
updated: 2026-11-07
verification: "Abstract of Theraulaz & Bonabeau 1999 read (OpenAlex). Grassé 1959: metadata only (text in French, not opened)."
summary: Termites and ants coordinate complex constructions by reacting to the state of the work left by others; the artifact itself carries the communication.
---

## Mechanism
- Introduced by Grassé (1959) to explain the "paradox" that, in an insect society, **individuals work as if they were alone**, yet the collective activity appears coordinated (1999 abstract).
- Theraulaz & Bonabeau distinguish two classes: **quantitative stigmergy** (the intensity of the stimulus — e.g. amount of pheromone/material — modulates the probability of response) and **qualitative stigmergy** (distinct configurations of the artifact trigger distinct actions).
- Communication is indirect, mediated by the environment, asynchronous and persistent: the cost of coordination does not grow with the no. of pairs of individuals.

## Evidence
`natural-phenomenon` (ethological description) + `author-reported` (historical synthesis). No numbers in the open sources.

## Engineering analogue
The **verifiable artifact** (repository, test output, acceptance checklist, task board) is the medium of coordination. Agents read the state and act; they do not exchange peer-to-peer messages. Qualitative stigmergy = "test X failing triggers the X specialist"; quantitative = "the more tests fail in a module, the greater the chance of allocating one more agent there".

## Testable hypothesis
- **Variable:** coordination channel — (A) free messages between agents (chat/debate); (B) only structured shared state (artifact + test results), without messages.
- **Metric:** coordination tokens per accepted task; acceptance rate; duplicated work (two agents editing the same target).
- **Prediction:** on decomposable tasks (independent bugs), B reduces coordination tokens by ≥ 40% with acceptance ≥ A − 2 pp; on strongly coupled tasks (interdependent bugs), B loses acceptance (the artifact does not carry intention).
- **Refutation:** if B does not reduce tokens or also loses acceptance on decomposable tasks, or if it wins on coupled tasks (contradicting the boundary prediction), revise.

## Limits of transfer
Insects respond to simple, local stimuli; the "state" of a software task is semantic and may be read divergently by LLMs. Stigmergy without concurrency control generates write conflicts — it requires locks/leases that nature does not need to make explicit.
