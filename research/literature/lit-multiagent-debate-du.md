---
pivot: foundation
pivot_reason: "General evidence on compute allocation, baselines, verification or correlated errors; no defence-specific efficacy follows."
id: lit-multiagent-debate-du
title: "Multiagent Debate (Du et al., ICML 2024) — debate among instances of the same LLM"
area: literature
evidence: author-reported
tags: [debate, multi-agent, factuality, reasoning, founding-baseline]
sources:
  - "Du, Y., Li, S., Torralba, A., Tenenbaum, J. B. & Mordatch, I. (2024). Improving Factuality and Reasoning in Language Models through Multiagent Debate. Proceedings of the 41st International Conference on Machine Learning (ICML 2024), PMLR 235:11733–11763. https://proceedings.mlr.press/v235/du24e.html"
  - "arXiv:2305.14325v1 (23 May 2023), only version. https://arxiv.org/abs/2305.14325v1"
related: [lit-should-we-be-going-mad, lit-debate-or-vote, lit-stop-overvaluing-mad, lit-rethinking-bounds-discussion]
updated: 2026-11-07
primary_opened: true
version: "arXiv v1 (2023-05-23); PMLR v235 (2024)"
summary: Founding work on multi-agent debate — 3 gpt-3.5 instances debating for 2 rounds outperform a single agent and majority vote, but without matching compute and with a consensus that is sometimes wrong.
---

## Question
Do several instances of the same (black-box) LLM that propose answers and critique each other over rounds improve reasoning and factuality relative to a single agent?

## Method
- N agents (instances of the same model) answer independently; they then receive the others' answers and update their own over rounds; the final answer is the consensus.
- Main model: `gpt-3.5-turbo-0301` (Appendix A.2).
- Main configuration: **3 agents, 2 debate rounds** (note to Table 1).
- Tasks and sizes (Appendix A.2): Arithmetic 100, GSM8K 100, Chess move optimality 300 games, Biographies 524 computer scientists, MMLU 100, Chess move validity 100.
- Baselines: single agent, single agent with reflection, "Multi-Agent (Majority)" (majority vote).

## Reported result
Table 1 (reasoning; mean ± spread):

| Method | Arithmetic | GSM8K | Chess (ΔPS) |
|---|---|---|---|
| Single Agent | 67.0 ± 4.7 | 77.0 ± 4.2 | 91.4 ± 10.6 |
| Single Agent (Reflection) | 72.1 ± 4.5 | 75.0 ± 4.3 | 102.1 ± 11.9 |
| Multi-Agent (Majority) | 69.0 ± 4.6 | 81.0 ± 3.9 | 102.2 ± 6.2 |
| Multi-Agent (Debate) | 81.8 ± 2.3 | 85.0 ± 3.5 | 122.9 ± 7.6 |

Table 2 (factuality): Biographies 66.0 → 73.8; MMLU 63.9 → 71.1; Chess validity 29.3 → 45.2 (single agent → debate). Reflection worsened MMLU (57.7).

- Section 3.3 / Fig. 10: Arithmetic accuracy rises monotonically with the number of agents (rounds fixed at 2) and with the number of rounds (3 agents); above 4 rounds the final performance is similar to that at 4 rounds.
- Different models (Section 3.3, Fig. 11): on 20 GSM8K problems, Bard solved 11, ChatGPT 14, joint debate 17.
- More "stubborn" prompts lengthen the debate; longer prompts converge more slowly but to a better final consensus (text of Section 3.3).

## Cost/compute considered?
Partially, only qualitatively. Section 5 (Limitations) admits that debate is more expensive than other prompting methods. **There is no compute matching** between debate (3 agents × several generations per round) and the voting baseline; the number of samples voted on in the "Majority" baseline is not stated explicitly. With many agents, the context overflows and the answers have to be summarized (Fig. 13).

## Threats to validity
- Small samples (100 problems in several tasks); wide CIs (±3–5 pp).
- Comparison with majority vote without matched compute; later works (lit-debate-or-vote, lit-stop-overvaluing-mad) attribute most of the gain to voting/ensembling.
- A single 2023 model (gpt-3.5-turbo-0301), no reasoning models.
- Section 5 / Appendix A.1: debates converge to an answer that is not always correct; agents confidently assert wrong answers, claiming consistency with the others.
- Minor inconsistency: Section 3.1 describes arithmetic with six two-digit numbers; Appendix A.2 speaks of integers between 0 and 30.

## Relevance to the central question
It is the starting point of the "N agents > 1 agent" thesis. But the design does not answer "at what cost": an accuracy × tokens curve against self-consistency with the same budget is missing. Useful as a historical reference and as a protocol (`SoM`) reused by several later benchmarks.

## Candidate hypotheses
- candidate: the gain of debate over a single agent is largely an ensemble gain (more samples), not an interaction gain — test with a vote over the same number of generations.
- candidate: model diversity (ChatGPT + Bard) adds value beyond resampling the same model — but n=20 does not support a conclusion.
- candidate: rounds have diminishing returns with a plateau (~4 rounds here), while context cost grows with each round.

## Verification
- Opened on 2026-11-07: https://arxiv.org/abs/2305.14325 (v1 is the only version); https://ar5iv.labs.arxiv.org/html/2305.14325 (rendered full text of v1; tables read there); https://proceedings.mlr.press/v235/du24e.html (venue and pages).
- Direct PDF extraction failed; the numbers come from ar5iv (v1). I did not check whether the PMLR version changes numbers.
- Gap: the exact definition of the "Majority" baseline (how many samples) and the round count (2 rounds = initial + 1 or + 2) are not explicit in the text read.
