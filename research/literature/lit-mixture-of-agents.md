---
id: lit-mixture-of-agents
title: "Mixture-of-Agents (Wang et al., ICLR 2025) — layers of proposers and an aggregator"
area: literature
evidence: author-reported
tags: [mixture-of-agents, aggregation, diversity, cost, latency, alpacaeval]
sources:
  - "Wang, J., Wang, J., Athiwaratkun, B., Zhang, C. & Zou, J. (2025). Mixture-of-Agents Enhances Large Language Model Capabilities. International Conference on Learning Representations (ICLR 2025). https://proceedings.iclr.cc/paper_files/paper/2025/hash/5434be94e82c54327bb9dcaf7fca52b6-Abstract-Conference.html"
  - "arXiv:2406.04692v1 (7 Jun 2024), only version. https://arxiv.org/abs/2406.04692v1"
related: [lit-self-moa, lit-pareto-test-time-multiagent, lit-multiagent-debate-du]
updated: 2026-11-07
primary_opened: true
version: "arXiv v1 (2024-06-07); ICLR 2025"
summary: Six open LLMs in 3 layers with an aggregator outperform GPT-4o on AlpacaEval 2.0 (65.1% vs 57.5% LC), but the gain depends on quality proposers, and time to first token grows with the layers.
---

## Question
Does combining several LLMs in layers — each agent reading the outputs of the previous layer — outperform the best single model in open-ended response quality?

## Method
- 3 layers, 6 open proposers per layer (Qwen1.5-110B-Chat, Qwen1.5-72B-Chat, WizardLM-8x22B, LLaMA-3-70B-Instruct, Mixtral-8x22B-v0.1, dbrx-instruct); final aggregator Qwen1.5-110B-Chat (Section 3.1).
- Variants: MoA w/ GPT-4o (GPT-4o aggregator); MoA-Lite (2 layers, Qwen1.5-72B-Chat aggregator).
- Evaluation: AlpacaEval 2.0 (LC win rate, judged by an LLM), MT-Bench, FLASK.

## Reported result
- AlpacaEval 2.0 (Table 2a, LC win rate): MoA w/ GPT-4o 65.7 ± 0.7%; MoA 65.1 ± 0.6%; MoA-Lite 59.3 ± 0.2%; GPT-4 Omni (05/13) 57.5%.
- MT-Bench (Table 2b): MoA w/ GPT-4o 9.40; MoA 9.25; MoA-Lite 9.18; GPT-4o 9.19.
- **Proposer ablation** (Table 3; 2 layers, Qwen1.5-110B aggregator, AlpacaEval LC):

| n proposers | different LLMs | same LLM (temp 0.7) |
|---|---|---|
| 1 | 47.8% | 47.8% |
| 2 | 58.8% | 54.5% |
| 3 | 58.0% | 56.1% |
| 6 | 61.3% | 56.7% |

  Model diversity helped in this configuration (+4.6 pp at n=6). The text says the score "increase monotonically with n", but the multi-model column is not monotonic (n=2 > n=3).
- Roles (Table 4): the same model performs differently as aggregator vs. proposer (e.g.: WizardLM 52.9% aggregator / 63.8% proposer).
- The first aggregation gives the largest gain (Section 5).

## Cost/compute considered?
Yes, partially (Section 3.4, Fig. 5): cost in US$ (prices of 22 May 2024) and TFLOPs as a latency proxy. Reported: MoA-Lite matches the cost of GPT-4o with a higher score and outperforms GPT-4 Turbo by ~4% while being >2× more cost-effective. Exact values only in the chart. Declared limitation: high **time-to-first-token**, since nothing is output before the last layer.

## Threats to validity
- Preference metrics judged by an LLM (AlpacaEval/MT-Bench), sensitive to style and length.
- Comparison against a single model in 1 call, not against an ensemble of the best model at equal compute — a gap explored by lit-self-moa, which shows the same (or larger) gain without mixing models.
- Internal inconsistency: Introduction cites 65.8%, Abstract/Table 65.1%.
- No verifiable tasks (code, math) in the core of the paper.

## Relevance to the central question
Reference for "cooperation by aggregation" (without iterative dialogue). Shows a large gain over 1 call, but the design does not separate "more samples" from "different models" at equal cost. For Norevia, MoA is a candidate for a communication-cheap topology (layers without accumulated memory) — and lit-pareto-test-time-multiagent suggests that it dominates the Pareto frontier when well sized.

## Candidate hypotheses
- candidate: the first aggregation step captures most of the gain; extra layers have diminishing returns and linear latency cost.
- candidate: the role (proposer vs. aggregator) matters as much as the model — role allocation by measured performance.
- candidate: the advantage of model diversity disappears when controlling for the mean quality of the proposers (see lit-self-moa).

## Verification
- Opened on 2026-11-07: https://arxiv.org/abs/2406.04692 (v1 only); https://arxiv.org/html/2406.04692v1 (tables and text); ICLR 2025 proceedings page (venue, authors).
- Gap: numerical values of cost/TFLOPs and FLASK (only in figures); official code not inspected.
