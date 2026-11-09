---
pivot: foundation
pivot_reason: "General evidence on compute allocation, baselines, verification or correlated errors; no defence-specific efficacy follows."
id: lit-should-we-be-going-mad
title: "Should we be going MAD? (Smit et al., ICML 2024) — debate vs. ensembles with cost"
area: literature
evidence: author-reported
tags: [debate, self-consistency, cost, hyperparameters, agreement, medprompt]
sources:
  - "Smit, A. P., Grinsztajn, N., Duckworth, P., Barrett, T. D. & Pretorius, A. (2024). Should we be going MAD? A Look at Multi-Agent Debate Strategies for LLMs. Proceedings of the 41st International Conference on Machine Learning (ICML 2024), PMLR 235:45883–45905. https://proceedings.mlr.press/v235/smit24a.html"
  - "arXiv:2311.17371v3 (18 Jul 2024; v1 29 Nov 2023, v2 14 Mar 2024). https://arxiv.org/abs/2311.17371v3"
  - "Code: https://github.com/instadeepai/DebateLLM (not inspected)"
related: [lit-multiagent-debate-du, lit-debate-or-vote, lit-stop-overvaluing-mad]
updated: 2026-11-07
primary_opened: true
version: "arXiv v3 (2024-07-18); PMLR v235 (2024)"
summary: With GPT-3.5, debate protocols do not reliably outperform self-consistency/Medprompt and cost more per correct answer; the degree of agreement between agents is a decisive, task-dependent hyperparameter.
---

## Question
Do multi-agent debate (MAD) protocols outperform single-model ensemble strategies (self-consistency, Medprompt, Ensemble Refinement) when accuracy, cost and time are considered together?

## Method
- Main model: GPT-3.5-turbo; GPT-4 and Mixtral 8x7B only on MedQA (Section 3, Figs. 8–9).
- Datasets (Section 3): MedQA (1,273 USMLE questions, 4 options), PubMedQA (500), MMLU clinical topics (123), CosmosQA (500), CIAR (50), GPQA (448), Chess (BIG-bench).
- MAD: Society of Mind (SoM, = Du et al.), Multi-Persona (angel/devil + judge), ChatEval (3 modes). Baselines: Self-Consistency, Ensemble Refinement, Medprompt (without kNN), single agent.
- Hyperparameter sweep (no. of agents, rounds, summarization, prompts) and recording of cost in US$ per configuration (Appendix A.2, Table 3).

## Reported result
Table 2 (best configuration; median in parentheses), selection:

| System | MedQA | MMLU | CIAR | GPQA |
|---|---|---|---|---|
| Medprompt | 0.65 (0.63) | 0.74 (0.73) | 0.54 (0.50) | 0.27 (0.25) |
| Society of Mind | 0.64 (0.61) | 0.73 (0.70) | 0.56 (0.46) | 0.27 (0.25) |
| Self-Consistency | 0.60 (0.60) | 0.78 (0.75) | 0.56 (0.52) | 0.24 (0.29) |
| Single Agent | 0.60 (0.59) | 0.76 (0.72) | 0.50 (0.50) | 0.33 (0.28) |
| Multi-Persona | 0.58 (0.57) | 0.72 (0.69) | 0.52 (0.50) | 0.29 (0.29) |

- Conclusions (Section 4): MAD "currently do not outperform other ensembling methods such as Medprompt and self-consistency" in the original implementations; MAD requires more API calls and cost.
- Fig. 3: on medical datasets almost all systems outperform the single agent; on non-medical ones, the single agent outperforms all except Multi-Persona and Self-Consistency.
- Fig. 4: debate improves over the 1st answer in SoM, slightly in ChatEval, and **worsens** in Multi-Persona (the "devil" is instructed to disagree even with correct answers).
- Agreement modulation ("you should agree with the other agents X% of the time"; Section 3, Figs. 5–6): on the USMLE subset (376 questions), a gain of ≈15% for Multi-Persona and ≈5% for SoM; MedQA/PubMedQA prefer high agreement, CIAR (counterintuitive) the opposite. Multi-Persona at 90% agreement is reported as SOTA for GPT-3.5 on MedQA (exact value only in the chart).
- Transfer: hyperparameters tuned on GPT-3.5 transfer to GPT-4, not to Mixtral 8x7B (Section 3).

## Cost/compute considered?
Yes — it is one of the few 2023–24 works that record US$ per configuration. In Table 3 (own extraction from the v3 PDF), in the most expensive column (costs ~US$19–50, consistent with the largest dataset, MedQA with 1,273 questions): Self-Consistency 0.63 at US$25.47; Medprompt 0.63–0.65 at US$19.10; SoM 4 agents × 3 rounds 0.64 at US$48.63; Ensemble Refinement (aggregation=9) 0.64 at US$50.30. That is, the same accuracy cost ~2× more with debate. **Caveat:** the Table 3 headers are lost in extraction; the column assignment was inferred from the cost/dataset-size ratio and may be wrong — check in the rendered PDF.

## Threats to validity
- A single main model from 2023; medical focus (generalization questioned by lit-stop-overvaluing-mad).
- Best-of-sweep vs. median: the "best" MAD depends on a hyperparameter search whose cost is not accounted for.
- Agreement-modulation gain measured on a subset of 376 questions, presented in a chart.

## Relevance to the central question
Shows that (1) "more agents talking" is not dominant when the baseline is a 1-model ensemble with similar compute; (2) **agreement dynamics** (conformity vs. contestation) is a control knob whose effect flips sign by task — relevant for an adaptive controller that decides how much dissent to inject.

## Candidate hypotheses
- candidate: the value of debate is dominated by a conformity parameter whose optimum depends on the task type (intuitive vs. counterintuitive).
- candidate: in cost per correct answer, 1-model ensembles dominate debate on most multiple-choice tasks.
- candidate: coordination hyperparameters do not transfer across model families — a controller needs to recalibrate per model.

## Verification
- Opened on 2026-11-07: https://arxiv.org/abs/2311.17371 (v3 is the latest); https://arxiv.org/html/2311.17371v3 (Table 2 and text); v3 PDF extracted locally for Table 3; https://proceedings.mlr.press/v235/smit24a.html (venue, pages).
- arXiv does not list a journal-ref; the ICML 2024 venue comes from the PMLR page.
- Gap: exact numerical value of the Multi-Persona SOTA (only in a figure); column order of Table 3 not visually confirmed.
