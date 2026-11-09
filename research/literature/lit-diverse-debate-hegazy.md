---
pivot: foundation
pivot_reason: "General evidence on compute allocation, baselines, verification or correlated errors; no defence-specific efficacy follows."
id: lit-diverse-debate-hegazy
title: "Diversity of Thought Elicits Stronger Reasoning in Multi-Agent Debate — heterogeneous vs homogeneous models (Hegazy, 2024)"
area: literature
evidence: author-reported
tags: [debate, diversity, heterogeneous-vs-homogeneous, gsm8k, ensemble]
sources:
  - "Hegazy, M. (2024). Diversity of Thought Elicits Stronger Reasoning Capabilities in Multi-Agent Debate Frameworks. Journal of Robotics and Automation Research 5(3):1–10 (Oct 2024, per the arXiv journal-ref). arXiv:2410.12853v2 (23 Jan 2025; v1 10 Oct 2024). https://arxiv.org/abs/2410.12853v2 — HTML read: https://arxiv.org/html/2410.12853v1"
related: [lit-hong-page-diversity, lit-correlated-errors, lit-diversity-of-thought, lit-synthesis]
updated: 2026-11-07
primary_opened: true
version: "v2 (2025-01-23) on abs; numbers extracted from the v1 HTML (2024-10-10)"
summary: After 4 rounds of debate, 3 different mid-sized models reached 91% on GSM8K versus 82% for 3 copies of the same model — weak evidence (no sample size, variance or cost) in favor of heterogeneity.
---

## Question
In multi-agent debate (Du et al. style), does a group of **different** models reason better than a group of copies of the same model?

## Method
- 4-round debate (round 0 = no debate), 3 agents, final answer by mode; Gemini-Pro also acts as summarizer (Sec. 3–4).
- GSM8K: diverse set Gemini-Pro + Mixtral 8x7B + PaLM 2-M vs 3× Gemini-Pro. ASDiv/MATH: Gemini Flash 1.5 + Gemini Pro + GPT-3.5. Also sets of 7B and ~2B models (Sec. 4.2).

## Reported result (Sec. 4.2; Abstract)
- GSM8K, diverse: individual Gemini-Pro 78%, Mixtral 70%, PaLM 2-M 64%; 4-round debate: 78% → 91%.
- GSM8K, homogeneous (3× Gemini-Pro): 78% → 80% (without CoT) and 78% → 82% (zero-shot CoT).
- ASDiv: individual 89% / 86% / 81% → 94% after 4 rounds (author claims state of the art).
- MATH: individual 55% / 32% / 33%; after debate only margins are reported (24% over GPT-4, 14% over Gemini Ultra), with no absolute value in the text.
- Small models: +17% (7B) and +10% (~2B) by round 4, with no absolute values in the text.
- Appendix A.1: in one 7B set, the answer dropped from 69% to 66% after debate — debate can also make things worse.

## Cost/compute considered?
No. No count of tokens, calls or cost; a 3-agent × 4-round debate costs ~12+ calls versus 1 for the individual baseline, and there is no comparison with self-consistency at the same budget.

## Threats to validity
- Number of questions evaluated not reported; no variance, seeds or repetitions.
- “Outperforms GPT-4” comparison with no GPT-4 value in the text (cites Bubeck et al. 2023).
- The summarizer is also a debater (confounder); model lists inconsistent between text and appendix.
- Single author; journal-ref in a robotics journal whose review was not verified here.
- No simple-voting baseline at equal compute — the gain may come from ensembling, not from debate.

## Relevance to the central question
Supports (weakly) that model heterogeneity increases the gain from cooperation relative to homogeneous copies (+13 pp vs +4 pp on GSM8K). But it does not answer “at what cost” nor “vs a single agent with more reasoning”, and the design does not control compute. Useful as a hypothesis to reproduce in the Observatory, not as evidence.

## Candidate hypotheses
- candidate: at an equal call budget, debate among heterogeneous models beats voting among homogeneous copies; debate among homogeneous copies does not beat simple voting.
- candidate: the heterogeneity gain is larger when members have similar individual accuracies and weakly correlated errors; a much weaker member can drag the group down (cf. the 69%→66% drop).

## Verification
- Opened on 2026-11-07: https://arxiv.org/abs/2410.12853 (v2, 23 Jan 2025, journal-ref JRAR 5(3)) and https://arxiv.org/html/2410.12853v1 (numbers). https://arxiv.org/html/2410.12853v2 returned 404; the v2 PDF could not be extracted.
- Gap: possible numerical changes between v1 and v2 not verified (the v2 abstract keeps 91%, 82% and 94%); journal page not opened.
