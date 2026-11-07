---
id: lit-stop-overvaluing-mad
title: "Stop Overvaluing Multi-Agent Debate (Zhang et al., 2025) — MAD rarely beats CoT/SC; heterogeneity as an antidote"
area: literature
evidence: author-reported
tags: [debate, self-consistency, chain-of-thought, heterogeneity, token-efficiency, evaluation]
sources:
  - "Zhang, H., Cui, Z., Chen, J., Wang, X., Zhang, Q., Wang, Z., Wu, D. & Hu, S. (2025). Stop Overvaluing Multi-Agent Debate — We Must Rethink Evaluation and Embrace Model Heterogeneity. arXiv:2502.08788v3 (21 Jun 2025). Position paper. https://arxiv.org/abs/2502.08788v3"
  - "v1 title (12 Feb 2025): 'If Multi-Agent Debate is the Answer, What is the Question?' https://arxiv.org/abs/2502.08788v1"
related: [lit-debate-or-vote, lit-should-we-be-going-mad, lit-multiagent-debate-du, lit-self-moa]
updated: 2026-11-07
primary_opened: true
version: "v3 (2025-06-21); v1 2025-02-12, v2 2025-02-17"
summary: Across 36 scenarios (4 models × 9 benchmarks), five debate methods beat CoT in at most ~15–20% of cases and use tokens worse than self-consistency; mixing models improves all debates, but not the best model alone with CoT.
---

## Question
Do multi-agent debate (MAD) methods outperform simple single-agent baselines (CoT, Self-Consistency) when evaluated systematically and with a comparable inference budget?

## Method
- 5 MAD: Society-of-Minds (SoM), Multi-Persona (MP), Exchange-of-Thoughts (EoT), ChatEval, AgentVerse — the authors' open implementations. Baselines: single agent (SA), CoT, Self-Consistency (SC).
- 9 benchmarks (0-shot): MMLU, MMLU-Pro, CommonsenseQA, ARC-Challenge, AGIEval, GSM8K, MATH, HumanEval, MBPP (Table 1).
- 4 models: gpt-4o-mini-2024-07-18, claude-3-5-haiku-20241022, Llama3.1-8B-instruct, Llama3.1-70B-instruct; T=1, top-p=1 (Section 3.1).
- Budget matched at **6 LLM calls** per question (rounds adjusted); 3 repetitions with standard deviation; ANOVA (α=0.05) for win/tie/loss vs CoT.
- Heter-MAD (Section 4): each generation draws the model at random (GPT-4o-mini or Llama3.1-70B, p=0.5).

## Reported result
- No MAD has a win rate > 20% against CoT across the 36 scenarios (Section 1); SoM, EoT, ChatEval and AgentVerse beat CoT in ~15% of cases; MP does not win significantly (Fig. 2, Section 3.2).
- GPT-4o-mini (Table 3): SoM is below CoT on all 9 datasets; ChatEval and AgentVerse beat CoT on 1 of 9. Example: MMLU CoT 80.73 / SC 82.13 / SoM 74.73 / MP 75.47; MATH CoT 72.87 / SC 73.96 / SoM 75.40 / MP 51.87.
- SC is, in most applicable cases, the best method (programming excluded for SC).
- MAD beats the single agent without CoT (SA) in 34 of 45 conditions with GPT-4o-mini — which reproduces the original papers, whose baseline was weak.
- Hyperparameters (Fig. 3; GSM8K, MMLU, HumanEval): increasing rounds (2→4) or agents (3→9) "does not significantly change the outcomes"; exception: EoT on GSM8K improves continuously and passes CoT with 9 agents.
- Token efficiency (Fig. 6, Appendix D): SC uses the extra budget well; MAD either does not scale with more tokens or stays below SC at comparable tokens.
- Why it loses (Fig. 4): MP, ChatEval and AgentVerse correct many errors but **revert many correct answers**; SoM and EoT are conservative and correct little.
- Heter-MAD (Table 4, means over 9 datasets): SoM-Heter 76.7 vs SoM-GPT 74.3 and SoM-Llama 69.9 (+6.4% over the mean of the two); EoT-Heter 75.7 (+8.2%); AgentVerse-Heter 74.0 (+2.7%). Against "CoT-Average" (72.5) the gains reach +5.8%.

## Cost/compute considered?
Yes — budget matched by no. of calls (6) and analysis of accuracy × tokens consumed against SC with an increasing no. of samples. No cost in US$.

## Threats to validity
- Position paper; code at an anonymous link (not inspected).
- **The Heter-MAD comparison is against the mean of two models**, not against the best. Our calculation from Tables 3 and 7: CoT of GPT-4o-mini alone has a mean of 77.0 and CoT of Llama3.1-70B 68.0 (mean 72.5, equal to the paper's "CoT-Average"). Hence SoM-Heter (76.7) **does not outperform** the best model alone with CoT (77.0), with 6 calls versus 1. Heter-MAD is also not compared with SC.
- Non-reasoning models; some of the effects may change with reasoning models.
- Selection of 5 methods and the original authors' implementations may inherit bugs.

## Relevance to the central question
Broad evidence (36 scenarios) that, **with equal compute, cooperation through debate loses to "more reasoning/samples from the same agent"** (CoT/SC) on most QA and code tasks. The loss mechanism (reversal of correct answers) provides a measurable variable for Norevia: correction rate vs. damage rate per round. Heterogeneity helps debates, but the tension with lit-self-moa remains: the gain seems to come from pulling the weak model closer to the strong one.

## Candidate hypotheses
- candidate: the net value of a cooperation round = P(fix wrong) − P(break right); aggressive protocols have both high, conservative ones both low — the optimum depends on the initial accuracy.
- candidate: the multi-agent advantage appears more in mathematics (verifiable steps) than in general knowledge and programming without execution.
- candidate: heterogeneity is valuable as cost reduction (mixing a cheap and an expensive model), not as a ceiling increase.

## Verification
- Opened on 2026-11-07: https://arxiv.org/abs/2502.08788 (v3), https://arxiv.org/abs/2502.08788v1 (original title); HTML v1–v3 without body (build errors); **v3 PDF downloaded and extracted locally** with our own script — the tables and text cited come from it.
- Gap: Figs. 2, 3, 4, 6 read only via the text describing them (no values); Table 8 (Claude-3.5-haiku) not transcribed; no peer-reviewed venue identified.
