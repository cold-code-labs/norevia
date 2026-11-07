---
id: lit-agentnet
title: "AgentNet — decentralized evolutionary coordination for LLM multi-agent systems"
area: literature
evidence: author-reported
tags: [decentralization, specialization, bounded-memory, routing, agent-scale]
sources:
  - "Yang, Y.; Chai, H.; Shao, S.; Song, Y.; Qi, S.; Rui, R.; Zhang, W. (2025). AgentNet: Decentralized Evolutionary Coordination for LLM-based Multi-Agent Systems. NeurIPS 2025 (Main Conference Track). doi:10.52202/085713-3578. arXiv:2504.00587v2 (29 May 2025). https://arxiv.org/abs/2504.00587v2"
  - "NeurIPS record: https://proceedings.neurips.cc/paper_files/paper/2025/hash/9a379c1b05793d1c42dc832269834515-Abstract-Conference.html"
related: [lit-swarmsys, lit-gptswarm]
updated: 2026-11-07
primary_opened: true
version: "v2 (2025-05-29); v1 from 2025-04-01"
summary: "With 3 agents, AgentNet ties or narrowly beats the baselines and sometimes loses to them; the gain from more agents is small and diminishing, and no token cost is measured."
---

## Question
Can a multi-agent system without a central orchestrator, with a dynamic graph (DAG) and a capacity-limited retrieval-based (RAG) trajectory memory, specialize agents and beat centralized single-agent and multi-agent baselines?

## Method
- Each agent routes tasks through the DAG and specializes by retrieving successful trajectories from a pool with limit C_max. Less relevant trajectories are pruned.
- Backbones: DeepSeek-V3, GPT-4o-mini and Qwen-turbo, with temperature 0.0 and max tokens 2048.
- Benchmarks with custom splits: MATH (700 train / 140 test), BBH (627/100) and API-Bank (100/100).
- Single-agent baselines: Direct, ReAct, Synapse, Self-Consistency and Self-Refinement. Multi-agent baselines: MorphAgent, MetaGPT, AFLOW and GPTSwarm. All multi-agent methods use 3 agents.

## Reported result
Author-reported.
- **Table 1 (accuracy in %):**
  - With DeepSeek-V3: AgentNet scored 92.86 on MATH (MetaGPT 92.14), 94.00 on BBH (Synapse 92.00) and 30.00 on API-Bank (ReAct/SC 29.00).
  - With GPT-4o-mini: tie on MATH (85.00, equal to AFLOW/GPTSwarm) and on BBH (86.00, equal to GPTSwarm). On API-Bank, 29.00 versus 24.00 for ReAct.
  - With Qwen-turbo: **loses** on MATH (81.43 vs 82.14 for AFLOW). Wins on BBH (92.00 vs 75.00 for GPTSwarm) and on API-Bank (32.00 vs 30.00).
- **Scale (Section 5.1, Figure 8):** training accuracy goes from 80.38 (3 agents, 30 executors) to 81.18 (9 agents, 40 executors). The authors describe diminishing returns. Test stays between 80 and 86.
- **Heterogeneity (Table 2, BBH):** with 3 agents, the homogeneous configuration scored 0.86, versus 0.81 for the LLM-heterogeneous one. With 5 agents, the homogeneous one drops to 0.79, and the skill-heterogeneous one scores 0.86.
- **Evolution ablation (Table 3, GPT-4o-mini):** without evolution, results were 77.86 on MATH, 76.00 on BBH and 23.00 on API-Bank; with evolution, 85.00, 86.00 and 32.00.

## Cost/compute considered?
No. There is no measurement of tokens, cost or latency. The abstract's phrase about "improving efficiency" comes with no numbers in the text read. No C_max value was reported and there is no sweep over memory size.

## Threats to validity
- Small test sets: 100–140 items, so 1 point on BBH corresponds to 1 question.
- Custom benchmark splits.
- Margins of 0–2 points without confidence intervals.
- Some tasks require prior evolutionary training.
- The authors acknowledge that the router chooses among a few predefined candidates.
- No validated official repository.

## Relevance to the central question
With an uncontrolled budget, the multi-agent advantage over a well-configured single agent (Synapse, SC, ReAct) is small and inconsistent. Increasing the number of agents yields little (+0.8 pp in training going from 3 to 9 agents). Specialization via memory (evolution) is what weighs most: +7 to +10 pp. Diversity matters in a non-trivial way: homogeneous is better with 3 agents, heterogeneous with 5.

## Candidate hypotheses (hypothesis)
- candidate: the value of a micro-swarm comes more from accumulated specialized memory than from cooperation at inference time.
- candidate: agent diversity only pays off above a minimum group size; below it, it adds noise.

## Verification
- Opened on 2026-11-07:
  - https://arxiv.org/abs/2504.00587 (v1 from 2025-04-01 and v2 from 2025-05-29)
  - https://arxiv.org/html/2504.00587v2 (Tables 1–3, Section 5.1, Section 6)
  - NeurIPS 2025 record, which confirms the Main Conference Track and the DOI 10.52202/085713-3578
- Gaps: the PDF of the NeurIPS version was not compared with v2; there is no official code; there is no cost.
