---
pivot: adapt
pivot_reason: "Failure diagnosis or repair can inform recovery design; requires defensive tasks and independent verification."
id: lit-selfheal
title: "SelfHeal — fix patterns and bug repair in LLM agents with a separate critic"
area: literature
evidence: author-reported
tags: [repair, healing, critic, verification, cost, micro-swarm]
sources:
  - "Islam, N.; Raza, M. A.; Wardat, M. (2026). SelfHeal: Empirical Fix Pattern Analysis and Bug Repair in LLM Agents. arXiv:2604.17699v1 (20 Apr 2026). arXiv comment: 'Accepted at EASE 2026'. doi:10.48550/arXiv.2604.17699. https://arxiv.org/abs/2604.17699v1"
  - "Declared code: https://github.com/Laboratory-software-Innovation/SelfHeal"
related: [lit-mast]
updated: 2026-11-07
primary_opened: true
version: "v1 (2026-04-20; only version)"
summary: "A fix-agent + critic pair repairs 22 of 37 real agent bugs, and the fix rules matter more than the critic, which adds only 3 cases."
---

## Question
Which fix patterns resolve real bugs in LLM agent code (LangChain/LlamaIndex), and does a repair system with a fix agent and a critic agent, both ReAct, outperform single-agent approaches?

## Method
- **Empirical study:** 2,734 Stack Overflow posts, of which 665 were annotated, plus 51 issues and 129 commits from GitHub and 85 posts on the HuggingFace forums. These are 930 instances, or 1,025 entries, organized into 23 fix categories.
- **AgentDefect benchmark:** 37 executable instances.
- **SelfHeal:** fix agent and critic agent, both ReAct, with fix rules and web search, without executing the code.
- **Backbones:** Gemini 3 Pro, Claude Sonnet 4 and GPT-5.2.
- **Baselines:** zero-shot (single agent) and SWE-Agent.

## Reported result
Author report; Tables 1 and 2.
- **SelfHeal:** 22/37 with Gemini 3 Pro (0.5946), 21/37 with Claude Sonnet 4 and 20/37 with GPT-5.2.
- **Zero-shot:** Claude Sonnet 4 15/37, Gemini 3 Pro 13/37, GPT-5.2 12/37.
- **SWE-Agent with GPT-5.2:** 14/37.
- **Ablations with Gemini 3 Pro:**
  - Without fix rules: 15/37 (−18.92 pp).
  - Without web search: 17/37 (−13.51 pp).
  - **Without critic: 19/37.** The 3-case difference (≈8.1 pp) was computed by this card; the authors say the critic blocked wrong fixes in 3 instances.
- **Mean attempts:** SelfHeal between 1.05 and 1.35; SWE-Agent 3.78.

## Cost/compute considered?
Yes, for SelfHeal. Cost and time per segment:
- Gemini 3 Pro: US$ 0.4442 and 322.72 s.
- Claude Sonnet 4: US$ 0.0759 and 43.40 s.
- GPT-5.2: US$ 0.0492 and 41.77 s.

The authors note that the best performance is also the most expensive. The cost of the baselines is only in a figure (not read). Tokens not reported. There is no matched-compute comparison between single agent and pair.

## Threats to validity
- Small benchmark (37 instances) and restricted to LangChain and LlamaIndex.
- No execution at repair time nor repository-level evaluation.
- Leakage risk mitigated by source exclusion in the search.
- The authors say that the averages "+21.72%" and "+16.21%" have no explained calculation.

## Relevance to the central question
It is a 2-agent micro-swarm (fix + critic). The second agent adds 3/37 cases, while the injected knowledge (fix rules) adds 7/37. Choosing the backbone changes cost by about 9× (Gemini vs GPT-5.2) for a difference of 2 cases. This suggests that knowledge and tools outweigh cooperation as a lever, and that the critic works as a cheap verifier.

## Candidate hypotheses (hypothesis)
- candidate: in a repair micro-swarm, the verifier role adds small but positive value; domain rules and retrieval are worth more than additional agents.
- candidate: cost per correct answer is dominated by the choice of model, not by the number of agents, in 2-agent pairs.

## Verification
- Opened on 2026-11-07:
  - https://arxiv.org/abs/2604.17699 (v1 only; comment "Accepted at EASE 2026")
  - https://arxiv.org/html/2604.17699v1 (Tables 1–2, cost, threats and data sections)
- Gaps:
  - Acceptance at EASE 2026 appears only in the arXiv comment; the proceedings were not opened.
  - The cost of the baselines (Figure 4) was not read.
  - Repository license not verified.
