---
id: lit-macnet
title: MacNet — scaling multi-agent collaboration on DAGs ("collaborative scaling law")
area: literature
evidence: author-reported
tags: [agent-scaling, topology, scaling-law, saturation, communication]
sources:
  - "Qian, C., Xie, Z., Wang, Y., Liu, W., Zhu, K., Xia, H., Dang, Y., Du, Z., Chen, W., Yang, C., Liu, Z. & Sun, M. (2025). Scaling Large Language Model-based Multi-Agent Collaboration. ICLR 2025. arXiv:2406.07155v3. https://arxiv.org/abs/2406.07155v3"
related: [lit-more-agents, lit-scaling-agent-systems, lit-more-llm-calls]
updated: 2026-11-07
primary_opened: true
version: "v3 (17 Mar 2025); v1 11 Jun 2024; v2 28 Feb 2025"
summary: Organizing GPT-3.5 agents in DAGs shows a logistic-shaped quality gain with the number of nodes and saturation at around 16 nodes, at a context and token cost that grows quickly.
---

## Question
Does adding collaborating agents, organized in a directed acyclic graph, produce a scaling law similar to the neural one? Which topologies work best?

## Method
MacNet: nodes are "actors" and edges are "critics". Reasoning follows the topological order of the DAG; each interaction has up to 3 rounds. Memory control passes on only the artifacts, not the whole dialogue (Sec. 2.3). Model: GPT-3.5; open models only in footnote 5. Benchmarks: MMLU, HumanEval, SRDD and CommonGen-Hard; "Quality" is their mean. Baselines: CoT, AutoGPT, GPTSwarm, AgentVerse. Topologies: chain, star, tree, mesh, layer and random. Scale from 2^0 to 2^6 nodes, which according to the authors exceeds a thousand agents in the mesh, counting nodes and edges.

## Reported result
- Table 1, mean Quality with about 4 nodes: MacNet-Random 0.6522 (best); Mesh 0.6316; Chain 0.6078; CoT 0.5757; AgentVerse 0.5805; GPTSwarm 0.5163.
- The gain is not uniform. On HumanEval, MacNet-Chain (0.3720) falls below CoT (0.6098) and AgentVerse (0.7256), although the text says the chain outperforms "all baselines".
- Collaborative law (Eq. 6): f(|V|) = γ / (1 + e^(−β(log|V| − α))) + δ, a logistic in log(no. of nodes). Topology-specific parameters; the fitted values were not published in the HTML.
- Saturation: the authors call 2^4 nodes a "reasonable choice" and say most topologies saturate at around a hundred agents (Sec. 3.3).
- Control: majority vote improves by only 0.9% and plateaus at about 8 agents. AgentVerse suffers "context explosion" above 30 agents (Sec. 3.3).
- The random topology takes about 51.92% less time than mesh. Reversing edges degrades the result; divergent topologies outperform convergent ones (Sec. 3.2, Fig. 6).
- Token length 7.51× larger from 2^0 to 2^4 agents; critics' suggestions implemented in 93.10% of cases (Sec. 3.4).

## Cost/compute considered?
Partially. There is an analysis of context growth: O(n²) without memory control, O(n) with control (Eq. 5). An interaction requires at least 2×|E| rounds. There is also relative time and tokens. There is no monetary cost nor a comparison with a single agent given the same token budget.

## Threats to validity
- A single model (GPT-3.5) in the main results.
- SRDD and CommonGen metrics depend on automatic and LLM evaluators.
- The law holds only for network scale; the authors leave profiles, tools and protocols to future work (note 9).
- There is no matched-compute single-agent baseline, so the gain may reflect more tokens rather than collaboration.
- Internal contradiction between the text and Table 1 about the chain on HumanEval.

## Relevance to the central question
It is the most cited evidence of a "collaborative scaling law", but it measures quality as a function of the number of nodes, not of cost. For Norevia, it shows that there is a saturation range (about 16 nodes) and that topology matters, without answering whether the same spend on a single agent would yield more.

## Candidate hypotheses
- candidate: the collaboration gain follows a logistic in log(N) and saturates early; the cost optimum lies before quality saturation.
- candidate: sparse and divergent topologies give better quality per token than dense ones.
- candidate: without memory control, context cost grows as O(N²) and dominates any gain for moderate N.

## Verification
Opened on 2026-11-07: https://arxiv.org/abs/2406.07155 (v3 and ICLR 2025 confirmed in the comments field) and https://arxiv.org/html/2406.07155v3. Numbers extracted by an automatic reader, without manual cell-by-cell checking. Fitted values of α, β, γ, δ not located (gap). Results with open models not detailed (gap).
