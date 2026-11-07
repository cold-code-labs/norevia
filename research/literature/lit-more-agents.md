---
id: lit-more-agents
title: 'More Agents Is All You Need — sampling-and-voting (Agent Forest)'
area: literature
evidence: author-reported
tags: [agent-scaling, sampling-and-voting, difficulty, ensemble]
sources:
  - "Li, J., Zhang, Q., Yu, Y., Fu, Q. & Ye, D. (2024). More Agents Is All You Need. Transactions on Machine Learning Research (TMLR). arXiv:2402.05120v2. https://arxiv.org/abs/2402.05120v2"
  - "Code: https://github.com/MoreAgentsIsAllYouNeed/AgentForest (not inspected)"
related: [lit-self-consistency, lit-more-llm-calls, lit-large-language-monkeys, lit-macnet]
updated: 2026-11-07
primary_opened: true
version: "v2 (11 Oct 2024); v1 3 Feb 2024"
summary: Sampling the same LLM several times and voting improves the result with the number of "agents", with larger gains on harder tasks and weaker models, but without a matched-cost analysis.
---

## Question
Does an LLM's performance scale merely with the number of instances ("agents") that sample independent answers and vote, without structured collaboration?

## Method
"Agent Forest": N independent samples from the same model and prompt; majority vote by frequency (multiple choice) or by BLEU similarity (code) (Sec. 3, App. A.4). Ensemble of up to 40 in the main experiments (Sec. 4). Models: Llama2-13B, Llama2-70B, GPT-3.5-Turbo; GPT-4 only as a single-agent reference. Tasks: GSM8K, MATH, Chess, MMLU, HumanEval. Also combined with CoT, Zero-shot CoT, SPP, Debate and Reflection (Table 3). Difficulty analysis on a synthetic task with GPT-3.5 (Sec. 6).

## Reported result
- Table 2 (single agent → ensemble of 40): GSM8K Llama2-13B 0.35→0.59; Llama2-70B 0.54→0.74; GPT-3.5 0.73→0.85. MATH GPT-3.5 0.29→0.39. HumanEval GPT-3.5 0.67→0.73. Chess Llama2-70B 0.12→0.13. GPT-4 single agent: GSM8K 0.88, MATH 0.40.
- Absolute gain ranges (Sec. 5.1): GSM8K 12–24 points; MATH 6–10; Chess 1–4; MMLU 5–11; HumanEval 4–9.
- A smaller model with more samples beats the larger one with a single sample: Llama2-13B with ensemble (0.59) > Llama2-70B with one sample (0.54) on GSM8K. According to the caption of Fig. 1, this already happens at about 15 samples.
- Larger relative gain for the weaker model (Table 6): GSM8K +69% / +37% / +16% and MATH +200% / +120% / +34% for Llama2-13B / 70B / GPT-3.5.
- Difficulty (Sec. 6, Fig. 6): the gain rises and then falls with intrinsic difficulty I. The peak is at I=100–200; at I=400 the gain decreases. The gain grows with the number of steps S (1→8) and with a smaller prior (1/4→1/32).
- Heterogeneous hierarchical (GPT-3.5 filters, GPT-4 decides): on the synthetic task, GPT-4 accuracy with K=32 rises from 35% to 47% (Fig. 7, right).
- Debate combined with the ensemble reaches 0 on HumanEval with Llama2-13B/70B. The authors attribute the result to the noise of referencing other agents' answers (Sec. 5.2).

## Cost/compute considered?
Little. Table 5 gives tokens per agent with GPT-3.5 (e.g., GSM8K 235±54; MATH 326±131; HumanEval 495±120); cost grows linearly with N. Debate was limited to 10 agents due to "significant computational overhead" (Sec. 4). There is no matched-budget comparison between "larger model" and "N samples of the smaller one" beyond accuracy; Sec. 7 only points to cost as a limitation.

## Threats to validity
- Saturation as a function of N is not quantified. The ANOVA (Table 7) shows that differences exist among N ∈ {1,10,20,30,40}, not where the gain saturates.
- Inconsistent number of runs: 10 in Sec. 4, 20 in Sec. 5.4.
- The synthetic difficulty task is artificial, and the curve was measured only with GPT-3.5.
- 2023 models, without extended reasoning. It is unknown whether the gain persists with reasoning models.

## Relevance to the central question
It is the simplest "N agents" baseline: cooperation without communication. It shows that part of the gain attributed to swarms may come from sampling and voting alone. It also indicates that the gain depends on difficulty non-monotonically, which calls for an adaptive policy rather than a fixed N.

## Candidate hypotheses
- candidate: the sampling-and-voting gain is largest when individual capability is in an intermediate range; with a task that is trivial or impossible for the model, the gain vanishes.
- candidate: N samples of a smaller model substitute for a larger model only below a difficulty threshold; above it, the larger model dominates at matched cost.
- candidate: any swarm comparison should include "Agent Forest with the same number of calls" as a minimum control.

## Verification
Opened on 2026-11-07: https://arxiv.org/abs/2402.05120 (abs page; v2 confirmed) and https://arxiv.org/html/2402.05120v2 (full text). The numbers were extracted from the v2 HTML with an automated reader (WebFetch); there was no manual cell-by-cell check against the PDF. The PDF could not be read as text. Code not inspected. I did not identify a TMLR DOI (gap).
