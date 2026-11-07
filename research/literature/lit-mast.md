---
id: lit-mast
title: "MAST — why do multi-agent LLM systems fail?"
area: literature
evidence: author-reported
tags: [failures, taxonomy, verification, premature-termination, diagnosis]
sources:
  - "Cemri, M.; Pan, M. Z.; Yang, S.; Agrawal, L. A.; Chopra, B.; Tiwari, R.; Keutzer, K.; Parameswaran, A.; Klein, D.; Ramchandran, K.; Zaharia, M.; Gonzalez, J. E.; Stoica, I. (2025). Why Do Multi-Agent LLM Systems Fail? arXiv:2503.13657v3 (26 Oct 2025). https://arxiv.org/abs/2503.13657v3"
  - "NeurIPS 2025, spotlight poster: https://neurips.cc/virtual/2025/poster/121528"
related: [lit-selfheal, lit-swarmsys]
updated: 2026-11-07
primary_opened: true
version: "v3 (2025-10-26); v1 2025-03-17, v2 2025-04-22"
summary: "In 1,642 traces from 7 multi-agent frameworks, failures come mostly from system design and verification, and fixing prompts or topology yields at most about +15.6% success."
---

## Question
Why do multi-agent LLM systems (MAS) frequently deliver minimal gains on popular benchmarks? Which failure modes appear and how often?

## Method
- Grounded theory over traces, with iterative human annotation and a calibrated LLM-as-a-Judge annotator (o1, few-shot).
- MAST-Data with 1,642 traces (Table 1) from 7 frameworks: ChatDev, MetaGPT, HyperAgent, AppWorld, AG2/MathChat, Magentic-One and OpenManus.
- Models: GPT-4o, GPT-4, Claude-3.7-Sonnet, Qwen2.5-Coder-32B and CodeLlama-7b.
- Tasks: ProgramDev, SWE-Bench Lite, GAIA, GSM-Plus, OlympiadBench and MMLU.

## Reported result
Author report.
- **Failure rate** from 41% to 86.7% across 7 open-source MAS (Introduction). The systems run different benchmarks, so the rates are not directly comparable.
- **14 failure modes (Section 4 / Appendix A):**

| Mode | Description | Frequency |
|---|---|---|
| FM-1.1 | Disobey task specification | 11.8% |
| FM-1.2 | Disobey role | 1.5% |
| FM-1.3 | Step repetition | 15.7% |
| FM-1.4 | Loss of history | 2.8% |
| FM-1.5 | Unaware of termination condition | 12.4% |
| FM-2.1 | Conversation reset | 2.2% |
| FM-2.2 | Fail to ask for clarification | 6.8% |
| FM-2.3 | Task derailment | 7.4% |
| FM-2.4 | Information withholding | 0.85% |
| FM-2.5 | Ignores other agent's input | 1.9% |
| FM-2.6 | Reasoning-action mismatch | 13.2% |
| FM-3.1 | Premature termination | 6.2% |
| FM-3.2 | No or incomplete verification | 8.2% |
| FM-3.3 | Incorrect verification | 9.1% |

- **By category** (sum computed by this card, not reported in the text read): system design ≈ 44.2%, inter-agent misalignment ≈ 32.35%, verification ≈ 23.5%.
- **Agreement:** human κ = 0.88. The few-shot o1 annotator reaches accuracy of 0.94 and κ = 0.77; zero-shot is at κ = 0.58. Out of domain, κ = 0.79.
- **Interventions (Table 5):**
  - ChatDev on ProgramDev-v0: baseline 25.0; improved prompt 34.4; new topology 40.6. On HumanEval: 89.6 / 90.3 / 91.5.
  - AG2 on GSM-Plus with GPT-4: 84.75 / 89.75 / 85.50. Topology is not significant (Wilcoxon p = 0.4).
  - AG2 with GPT-4o: 84.25 / 89.00 / 88.83 (p = 0.03).
  - The authors say these interventions "do not constitute substantial improvements".

## Cost/compute considered?
No. The focus is failure diagnosis; there is no token accounting nor comparison with a single agent of equal compute. The claim of "minimal gains over single agent/best-of-N" comes from cited works (Agentless; Kapoor et al.), without its own numbers in the text read.

## Threats to validity
- Each MAS was evaluated on a different benchmark, which makes the failure rates non-comparable.
- Only 30 traces per MAS in part of the set.
- LLM annotation has κ = 0.77 (not perfect).
- The category system has naming that varies across versions ("system design" vs "specification").

## Relevance to the central question
Explains part of the hidden cost of expanding: coordination introduces failure modes that do not exist with one agent (FC2 ≈ 32%). Verification and termination (FM-1.5, FM-3.x) add up to about 36%, which links directly to Norevia's criterion of a "verifiably correct result". It also shows that prompt or topology patches have a low ceiling.

## Candidate hypotheses (hypothesis)
- candidate: each additional agent increases the surface of coordination failures in a way that can cancel out the coverage gain; there is an N beyond which the cost of failure exceeds the diversity gain.
- candidate: a verifier with a mechanical criterion (tests) adds more than additional generation agents, because it targets FC3.
- candidate: an explicit termination condition reduces FM-1.3 and FM-1.5 (≈28% combined) and is a direct cost lever.

## Verification
- Opened on 2026-11-07:
  - https://arxiv.org/abs/2503.13657 (v1–v3)
  - https://arxiv.org/html/2503.13657v3 (read in two parts: Table 1, Sections 3–5, Table 5)
  - https://neurips.cc/virtual/2025/poster/121528 (spotlight poster at NeurIPS 2025)
- Gaps:
  - The track (Datasets & Benchmarks vs Main) is not declared on the page opened; a search result suggests D&B, but it is not confirmed.
  - The per-category percentages in Figure 1 were not read directly.
  - The numbers for "minimal gain vs single agent" are in cited secondary sources.
