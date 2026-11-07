---
id: lit-swarmsys
title: "SwarmSys — decentralized swarm-inspired agents for scalable reasoning"
area: literature
evidence: author-reported
tags: [swarm, division-of-labor, stigmergy, agent-scale, cost, single-vs-multi-agent]
sources:
  - "Li, R.; Liu, H.; Zhao, L.; Li, Z.; Li, J.; Jiang, J.; Xu, L.; Zhao, C.; Fan, M.; Liang, C. (2025). SwarmSys: Decentralized Swarm-Inspired Agents for Scalable and Adaptive Reasoning. arXiv:2510.10047v1 (11 Oct 2025). https://arxiv.org/abs/2510.10047v1"
related: [lit-gptswarm, lit-agentnet, lit-agentprune]
updated: 2026-11-07
primary_opened: true
version: "v1 (2025-10-11; only version listed on arXiv on 2026-11-07)"
summary: "A swarm of 8 GPT-4o agents falls below a single GPT-5 on exams (65.8% vs 68.7%) while costing about 5× more per question, and the gain from more agents levels off near 14."
---

## Question
Can swarm-inspired decentralized coordination (Explorer/Worker/Validator roles, adaptive profiles, probabilistic matching and pheromone-like reinforcement) improve LLM reasoning without a global supervisor, and can "scaling through coordination" compete with model scaling?

## Method
- Three roles in a cycle: exploration, execution and validation. Agents and events have embedding-based profiles. Matching between them is probabilistic. Validated traces are reinforced and ineffective ones decay.
- Backbone: GPT-4o (Section 3.4).
- Benchmarks (Table 1): GaoKao Bench (800 samples), Omni-Math (300), DeepResearch Bench (200), SciCode (338).
- Single-agent baselines: IO, CoT, CoT-SC (5-shot), Self-Refine, MultiPersona (all with GPT-4o), GPT-5 and o3-mini-medium. Multi-agent baselines: GPTSwarm, DeepResearchAgent and Grok Deeper Search.

## Reported result
Author report, without local reproduction.
- **Exams (Table 2, mean Acc./Cov. in %):** SwarmSys-8 obtained 65.8/78.2, versus 58.4/71.7 for GPTSwarm, 52.1/59.0 for CoT-SC and **68.7/83.4 for GPT-5**. GPT-5 alone beats the swarm of 8 GPT-4o agents on average. The swarm only wins on Olympic Math (42.4 vs 31.2 accuracy). The authors say SwarmSys "closes more than 70%" of the gap to GPT-5. The "+12.5%" over GPTSwarm is a relative gain; in absolute points, the difference is +7.4.
- **DeepResearch Bench (Table 3, RACE overall):** SwarmSys-8 obtained 42.5. It outperforms Grok Deeper Search (40.2), but falls below DeepResearchAgent (48.8), which the text does not comment on.
- **SciCode (Table 4):** SwarmSys-14 obtained 12.5 on Pass@Main and 45.2 on Pass@Sub. o3-mini-medium obtained 9.2/34.4, and GPTSwarm, 8.6/29.2.
- **Agent scale (Table 5, exams, Acc./Cov.):** with A = 4, 8, 14, 20 and 32 agents, the results were 74.3/79.7, 76.2/80.2, 77.3/81.0, 77.2/81.3 and 76.5/80.8. The authors speak of a plateau after about 14 workers, with a "<1%" difference between 14 and 32. Without the method's roles, the random variants lie between 43% and 58%: Rand-NoRoles is at about 43–44%, and Rand-Roles at about 56–58%.

## Cost/compute considered?
Yes, partially. Table 8 (Appendix A.5) gives the mean cost in US$ per question, without tokens or latency.
- **Exams:** SwarmSys-8 costs US$ 0.071, versus **US$ 0.014 for GPT-5**, US$ 0.012 for CoT with GPT-4o and US$ 0.077 for GPTSwarm.
- **Research:** SwarmSys-8 costs US$ 2.63, versus US$ 2.82 for DeepResearchAgent, US$ 2.85 for Grok and US$ 1.53 for Self-Refine.
- **SciCode:** SwarmSys-14 costs US$ 0.44 (instructional) and US$ 0.019 (code), versus US$ 0.41 and US$ 0.024 for GPTSwarm.
- There is no matched-budget comparison. The prices are from 2025, not current ones.

## Threats to validity
- No official code located; there is no way to reproduce.
- In the comparison with GPT-5, the swarm uses a weaker model. The claimed superiority is over GPT-4o baselines, not over the frontier model.
- The gains appear in the text as relative percentages, which inflates the impression.
- The benchmarks are few, and coverage (Cov.) is a custom metric.
- A single version, with no peer review identified.

## Relevance to the central question
It is the most direct counterexample to the idea that "swarm always wins". A single stronger model (GPT-5) outperforms the swarm of 8 GPT-4o agents on the exam average, costing about 1/5 per question. The swarm adds value in the hardest subdomain (Olympic Math) and in procedural tasks (SciCode). It also shows saturation of swarm size near 14 agents.

## Candidate hypotheses (hypothesis, not validated)
- candidate: the gain from N agents of a weaker model does not substitute for a capability jump in the base model, except in the hardest bands of the task distribution.
- candidate: the marginal gain per agent saturates at a task-dependent scale (≈14 here), and going beyond it only adds cost.
- candidate: the role structure explains more of the gain than the number of agents (Rand-NoRoles stays flat at ≈43% with any N).

## Verification
- Opened on 2026-11-07: https://arxiv.org/abs/2510.10047 (v1 only) and https://arxiv.org/html/2510.10047v1 (Tables 1–5 and 8, Section 3.4, Limitations).
- Checked: the figure inherited from the previous study (US$ 0.071 vs US$ 0.014) matches Table 8.
- Gaps: official repository not located; tokens and latency not reported; there is no local reproduction.
