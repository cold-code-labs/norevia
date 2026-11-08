---
id: nat-response-threshold
title: Response thresholds and division of labor in social insects
area: nature
realm: seen
evidence: author-reported
tags: [division-of-labor, elastic-swarm, adaptive-activation, when-to-cooperate]
sources:
  - "Bonabeau, E., Theraulaz, G. & Deneubourg, J.-L. (1996). Quantitative study of the fixed threshold model for the regulation of division of labour in insect societies. Proc. R. Soc. Lond. B 263(1376):1565–1569. doi:10.1098/rspb.1996.0229"
  - "Theraulaz, G., Bonabeau, E. & Deneubourg, J.-L. (1998). Response threshold reinforcements and division of labour in insect societies. Proc. R. Soc. Lond. B 265:327–332. doi:10.1098/rspb.1998.0299 (PMC1688885)"
  - "Secondary source for the functional form: UiO TEK5010 (2024), lecture 6 'Task allocation' — https://www.uio.no/studier/emner/matnat/its/TEK5010/h24/forelesningspresentasjoner/tek5010_mas_2024_lecture_6_taskallocation.pdf (not opened; content via search result)"
related: [nat-inactive-reserve, nat-colony-size-scaling, nat-bacterial-quorum-sensing, lit-swarmsys, nat-map, nat-candidates, sim-response-threshold]
updated: 2026-11-07
verification: "DOIs checked via Crossref (2026-11-07). Abstract of 1998 read (OpenAlex). Full text of 1996 NOT opened (Royal Society blocked access); the form s^n/(s^n+θ^n) with n=2 checked only in a secondary source."
summary: Each individual takes up a task only when the task's stimulus exceeds its personal threshold; heterogeneous thresholds produce gradual recruitment proportional to demand, without a coordinator.
---

## Mechanism
- **Fixed-threshold model (1996):** the probability that an individual with threshold θ performs a task whose stimulus has value s is a sigmoid function T_θ(s) = sⁿ/(sⁿ + θⁿ). The form with n = 2 is the one usually attributed to the paper; **checked only in a secondary source** (UiO slides), not in the original text. According to the indexed abstract, castes with distinct thresholds, fixed on the experimental timescale, explain observations in *Pheidole* ants (Wilson 1984).
- **Threshold reinforcement (1998, abstract read):** performing the task *lowers* the individual's threshold; not performing it *raises* it. From this feedback, specialists emerge from initially identical individuals. The authors' prediction: after specialists are removed and reintroduced, the colony does not return to its previous state, and the difference grows with the time of separation (hysteresis).
- Functional consequence: when demand (stimulus) rises, low-threshold individuals engage first; only high demand recruits high-threshold ones. The size of the active workforce tracks demand **without central counting**.

## Evidence
`author-reported` (mathematical model fitted to third-party field data); the phenomenon of division of labor is `natural-phenomenon`. Fitted numbers (e.g. θ per caste) not checked in the original → `gap`.

## Engineering analogue (LLM swarms)
Each potential agent/role has a threshold θᵢ on a measurable, cheap **task stimulus**: open acceptance criteria, failing tests, estimated uncertainty (e.g. disagreement between 2 samples), backlog. A verifier engages only if s > θ_verif; a second executor only if s > θ_exec2, etc. Reinforcement (θ falls with successful use) gives emergent specialization; the rise in θ without use gives "forgetting" and contraction.

## Testable hypothesis
- **Manipulated variable:** activation policy — (A) fixed N; (B) heterogeneous fixed thresholds on stimulus s; (C) thresholds with reinforcement.
- **Metric:** cost (tokens) per accepted task; verifiable acceptance rate; mean no. of active agents per difficulty band.
- **Prediction:** B and C reach an acceptance rate ≥ A − 2 pp with cost per accepted task ≥ 25% lower on a mix of tasks of heterogeneous difficulty; the no. of active agents grows monotonically with difficulty measured a posteriori.
- **Refutation:** if the stimulus s does not correlate with real difficulty (Spearman < 0.3) or if B/C do not reduce cost without loss of acceptance, the hypothesis falls — the threshold only works if the stimulus is informative and cheap.

## Limits of transfer
Insects pay little to "look at" the stimulus; LLMs pay to estimate difficulty (the stimulus itself may cost a call). A threshold does not guarantee quality of work, only allocation. The hysteresis predicted in 1998 can turn into undesired rigidity (a specialist that should no longer be called).
