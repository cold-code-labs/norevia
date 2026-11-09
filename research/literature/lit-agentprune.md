---
pivot: adapt
pivot_reason: "Communication graph is a candidate containment surface; efficiency results do not demonstrate cyber containment."
id: lit-agentprune
title: "AgentPrune (Cut the Crap) — pruning redundant communication in LLM multi-agent systems"
area: literature
evidence: author-reported
tags: [communication, pruning, cost, tokens, topology, agent-scale]
sources:
  - "Zhang, G.; Yue, Y.; Li, Z.; Yun, S.; Wan, G.; Wang, K.; Cheng, D.; Yu, J. X.; Chen, T. (2025). Cut the Crap: An Economical Communication Pipeline for LLM-based Multi-Agent Systems. ICLR 2025. https://proceedings.iclr.cc/paper_files/paper/2025/hash/bbc461518c59a2a8d64e70e2c38c4a0e-Abstract-Conference.html"
  - "arXiv:2410.02506v1 (3 Oct 2024). https://arxiv.org/abs/2410.02506v1"
  - "Declared code: https://github.com/yanweiyue/AgentPrune"
related: [lit-gptswarm, lit-swarmsys]
updated: 2026-11-07
primary_opened: true
version: "v1 (2024-10-03; only arXiv version); ICLR 2025"
summary: "Pruning redundant messages between agents cuts 28% to 73% of prompt tokens without losing accuracy, and the gain of 5 GPT-4 agents over the best single agent with self-consistency is ~4 pp on average."
---

## Question
How much of the communication in LLM multi-agent systems is redundant, and does a one-shot pruning of the spatio-temporal message graph preserve quality at lower cost?

## Method
- First runs a few rounds on the complete graph. Then learns masks over the spatial edges (within a round) and temporal edges (between rounds), with low-rank and sparsity constraints, and prunes in one shot.
- Benchmarks: MMLU, GSM8K, MultiArith, SVAMP, AQuA and HumanEval (Section 4.1).
- Models: gpt-3.5-turbo-0301 and gpt-4-1106-preview. According to the caption of Table 1, the multi-agent methods use 5 GPT-4-based agents.
- Single-agent baselines: Vanilla, CoT, ComplexCoT, SC(CoT) and SC(ComplexCoT).
- Spatial baselines: Chain, Star, Tree, Complete Graph, Layered, Random, LLM-Blender and GPTSwarm.
- Temporal baselines: LLM-Debate, PHP and DyLAN.

## Reported result
Author-reported.
- **Table 1 (averages):**
  - Single agents: Vanilla 81.65; best single agent SC(ComplexCoT) 85.35.
  - Multi-agent: Complete Graph 86.55; GPTSwarm 86.77; LLM-Debate 87.01; PHP 87.02; DyLAN 84.48.
  - AgentPrune-C 89.72; AgentPrune-R 89.44; AgentPrune-L 88.38.
  - The Chain average (92.92) does not match its columns; it looks like a typo.
- **Cost on MMLU (abstract and Appendix H.1):** the authors say AgentPrune "outperforms GPTSwarm" at US$ 5.6, versus US$ 43.56 for GPTSwarm (US$ 43.7 in the abstract). On GSM8K, AgentPrune costs US$ 65.9 versus US$ 357.47 for DyLAN.
- **Integration into frameworks (Table 3/5, Section 4.3):**
  - AutoGen on MMLU, 3 agents: 81.94 → 82.20 with prompt tokens at 79.4% of the original and cost of US$ 5.446 → US$ 4.750.
  - GPTSwarm on MMLU: 83.32 → 83.66 with prompt tokens at 35.8% of the original and cost of US$ 24.99 → US$ 15.65.
  - GPTSwarm on GSM8K: US$ 234.76 → US$ 57.17.
  - The declared range is 28.1% to 72.8% token reduction.
- **Number of agents (Appendix, Figure 21; numbers not legible in the text):** according to the authors, there is "significant improvement from 3 to 5 agents" and a "relatively marginal" gain "from 5 to 9".
- **Robustness:** the authors declare +3.5% to +10.8% under two types of agent-based attacks. The per-figure numbers were not checked in the text.

## Cost/compute considered?
Yes, centrally: prompt and completion tokens and cost in US$. However, the comparison with the single agent is not done at equal compute. The main table does not report the cost of SC versus that of the multi-agent setup.

## Threats to validity
- Table 1 has an inconsistency (Chain average).
- Two different cost values for GPTSwarm on MMLU (US$ 24.99 and US$ 43.56), without explanation.
- Benchmarks saturated by GPT-4, with small margins.
- 2024 prices.
- I did not read a limitations section in the accessed text.

## Relevance to the central question
- A large part of multi-agent cost is redundant communication, and pruning removes 28% to 73% of tokens without loss of quality.
- The advantage of the best MAS (89.72) over the best single agent with sampling (85.35) is 4.4 pp on average, without compute control.
- Useful group size saturates early, with marginal returns above 5 agents, which is consistent with the micro-swarm idea.

## Candidate hypotheses (hypothesis)
- candidate: in an optimal multi-agent configuration, most communication edges are dispensable, and coordination cost can fall a lot before affecting quality.
- candidate: the optimal group size for benchmark reasoning tasks is between 3 and 5 agents.
- candidate: single-agent SC at matched compute would eliminate a good part of the 4.4 pp advantage (not tested in the paper).

## Verification
- Opened on 2026-11-07:
  - https://arxiv.org/abs/2410.02506 (v1 only)
  - https://arxiv.org/html/2410.02506v1 (read in two parts: Table 1, Table 3/5, Section 4.3, Appendix H.1)
  - ICLR 2025 proceedings page, which confirms the venue and the 9 authors
- Gaps:
  - The numbers in Figure 21 (agent scale) and Figure 20 (robustness) were not legible.
  - Code license not verified.
  - No local reproduction.
