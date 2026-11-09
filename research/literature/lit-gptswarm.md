---
pivot: adapt
pivot_reason: "Communication graph is a candidate containment surface; efficiency results do not demonstrate cyber containment."
id: lit-gptswarm
title: "GPTSwarm — language agents as optimizable graphs"
area: literature
evidence: author-reported
tags: [topology, graph-optimization, self-consistency, agent-scale, cost]
sources:
  - "Zhuge, M.; Wang, W.; Kirsch, L.; Faccio, F.; Khizbullin, D.; Schmidhuber, J. (2024). GPTSwarm: Language Agents as Optimizable Graphs. Proceedings of the 41st International Conference on Machine Learning (ICML 2024), PMLR 235:62743–62767. https://proceedings.mlr.press/v235/zhuge24a.html"
  - "arXiv:2402.16823v3 (22 Aug 2024), title 'Language Agents as Optimizable Graphs'. doi:10.48550/arXiv.2402.16823. https://arxiv.org/abs/2402.16823v3"
  - "Code declared on arXiv: https://github.com/metauto-ai/gptswarm"
related: [lit-agentprune, lit-swarmsys, lit-agentnet]
updated: 2026-11-07
primary_opened: true
version: "arXiv v3 (2024-08-22); PMLR v235 (2024)"
summary: "Optimizing the connections between agents helps on crosswords and HumanEval, but on GAIA 7 ToT agents with voting gain only ~5 pp over 1 ToT agent at about 6× the time."
---

## Question
Does representing LLM agents as computational graphs (nodes = operations/LLM queries; edges = information flow) and automatically optimizing prompts (nodes) and connectivity (edges) improve multi-agent orchestration?

## Method
- Swarm as a composite graph. Edges are optimized by REINFORCE over a distribution of edges, and nodes by prompt refinement.
- Experiments:
  - MMLU in adversarial and collaborative settings, with GPT-4-Turbo
  - Mini Crosswords, with GPT-3.5-Turbo
  - HumanEval
  - GAIA, with GPT-4-Turbo and tools

## Reported result
Author report; sections of arXiv v3.
- **Collaborative MMLU (Section 3.1.2):** with 7 IO agents, the optimized graph improves by 2.1% ± 1.1% over the baseline (5 seeds). In the adversarial setting, the authors acknowledge that **there is no score improvement over the single-agent baseline** and attribute this to IO agents with identical prompts.
- **MMLU vs. other MAS (Appendix D.1, Table 3):** Multiagent Debate obtained 0.5751, DyLAN 0.8366 and GPTSwarm 0.8301.
- **Mini Crosswords (Section 3.2):** the optimized graph obtained 0.575 ± 0.0275, versus 0.465 for the initial distribution and 0.320 for best-of-three aggregation. The control with fixed θ obtained 0.510. The same graph evaluated with GPT-4-Turbo reached 0.800.
- **HumanEval (Section 3.3):** accuracy rises from 0.76 to 0.88 ± 0.007 with online optimization.
- **GAIA (Section 3.4, Table 1):** GPTSwarm averaged 18.45, versus 9.70 for GPT-4-Turbo and 14.6 for GPT-4 with plugins.
- **Ablation on GAIA Level 1 (Table 2):**
  - Single agents: IO 16.60; COT_web 18.87; TOT 25.66.
  - Self-Consistency with N TOT agents: 3 → 28.30; 5 → 29.06; 7 → 30.56.
  - Time: 1 TOT ≈ 71.31 s; 3 TOT ≈ 181.15 s; 7 TOT ≈ 414.89 s. According to the authors, time grows approximately linearly with the number of agents.

## Cost/compute considered?
Yes, in appendices (Table 11 of Appendix F and Table 3 of Appendix D.1), with US$ and tokens.
- **MMLU (3A3T):** optimization US$ 5.32; inference US$ 1.82. Multiagent Debate costs US$ 32.8. DyLAN costs US$ 105.93 for optimization and US$ 14.99 for inference.
- **HumanEval:** without optimization, US$ 1.61; with optimization, US$ 28.46.
- **Crosswords:** edge optimization costs US$ 77.42 with 50,394,028 prompt tokens.
- There is no matched-compute comparison between swarm and single agent. The cost of optimization is paid separately.

## Threats to validity
- On GAIA, the main variant does not use graph optimization (Section 3.4), so the gain reported there comes from ensembling and voting.
- Small subsets: 153 MMLU questions in the optimization and 20 crossword problems.
- Models and prices from 2024.
- In the adversarial setting, the result is "asymptotically equal" to the baseline.

## Relevance to the central question
- On GAIA, the gain from scaling from 1 to 7 TOT agents (25.66 → 30.56) is about 5 pp for about 5.8× the time, with diminishing returns.
- Switching the model, instead of adding agents, gave a larger gain: the same crossword graph goes from 0.575 to 0.800 with GPT-4-Turbo.
- Shows that topology matters: the optimized graph beats best-of-three, which obtained 0.320.

## Candidate hypotheses (hypothesis)
- candidate: N homogeneous copies of the same agent add little when errors are correlated; the gain requires diversity of operators (TOT vs IO).
- candidate: a model upgrade dominates topology optimization in gain per dollar on pure reasoning tasks.
- candidate: the amortized cost of topology optimization only pays off with a high volume of similar tasks.

## Verification
- Opened on 2026-11-07:
  - https://arxiv.org/abs/2402.16823 (versions v1–v3; v3 from 2024-08-22)
  - https://arxiv.org/html/2402.16823v3 (Sections 3.1–3.4, Tables 1–4 and 11, Appendices D, F and G)
  - https://proceedings.mlr.press/v235/zhuge24a.html (pages 62743–62767)
- Gaps:
  - The arXiv v3 PDF could not be read (binary content); I used the HTML version.
  - The OpenReview page (uTC9AFXIhg) was blocked by a browser check; I did not confirm whether the presentation was oral.
  - The MIT license and the README are inherited from the previous study and were not reopened here.
