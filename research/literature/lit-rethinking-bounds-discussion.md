---
pivot: foundation
pivot_reason: "General evidence on compute allocation, baselines, verification or correlated errors; no defence-specific efficacy follows."
id: lit-rethinking-bounds-discussion
title: "Rethinking the Bounds of LLM Reasoning (Wang et al., ACL 2024) — single agent with a strong prompt ≈ discussion"
area: literature
evidence: author-reported
tags: [debate, discussion, single-agent, prompting, demonstrations, heterogeneity]
sources:
  - "Wang, Q., Wang, Z., Su, Y., Tong, H. & Song, Y. (2024). Rethinking the Bounds of LLM Reasoning: Are Multi-Agent Discussions the Key? Proceedings of the 62nd Annual Meeting of the ACL (Volume 1: Long Papers), pp. 6106–6131, Bangkok. doi:10.18653/v1/2024.acl-long.331. https://aclanthology.org/2024.acl-long.331"
  - "arXiv:2402.18272v1 (28 Feb 2024), only version. https://arxiv.org/abs/2402.18272v1"
related: [lit-multiagent-debate-du, lit-stop-overvaluing-mad, lit-should-we-be-going-mad]
updated: 2026-11-07
primary_opened: true
version: "arXiv v1 (2024-02-28); ACL 2024"
summary: With demonstrations in the prompt, a single agent (ChatGPT-3.5) matches or outperforms multi-agent discussions; discussion only helps without demonstrations or when it mixes models of different strength.
---

## Question
Does the improvement attributed to multi-agent discussion persist when the single agent receives a strong prompt (detailed description + demonstrations)?

## Method
- Models: ChatGPT-3.5 (gpt-35-turbo 0613, Azure), Gemini Pro, Bard (chat-bison-001); temperature 0.25 in CMD (§4.1).
- Data (§4.2): ECQA (100 test samples), GSM8K (100), FOLIO-wiki (460).
- Frameworks: Debate (Du et al.; 3 and 6 agents, 3 rounds), MAD (Liang et al.; 2 debaters + judge, up to 3 rounds), ReConcile (multi-LLM), and the proposed CMD (Conquer-and-Merge: 6 agents in 2 groups, up to 3 rounds, a secretary breaks ties).
- Conditions: "Direct" (no demonstration) vs. "Demo" (with demonstrations).

## Reported result
Table 2 (ChatGPT-3.5; Direct / Demo):

| Method | ECQA | GSM8K | FOLIO | Average |
|---|---|---|---|---|
| Single agent | 63 / 67 | 69 / 83 | 70.22 / 76.09 | 67.41 / **75.63** |
| MAD (3) | 55 / 58 | 74 / 78 | 61.25 / 74.13 | 63.42 / 70.04 |
| Debate (3) | 67 / 65 | 78 / 81 | 70.00 / 75.65 | **71.67** / 73.88 |
| Debate (6) | 65 / 64 | 74 / 78 | 69.13 / 74.78 | 69.38 / 72.26 |
| CMD (6) | 64 / 63 | 75 / 83 | 73.26 / 77.39 | 70.75 / 74.46 |

- With demonstrations, the single agent (75.63) outperforms all discussion methods on average; without demonstrations, Debate (3) gains +4.26 pp and CMD +3.34 pp on average, Debate (6) +1.97 pp, while MAD loses −3.99 pp (differences computed by us from Table 2).
- Debate with 6 agents is worse than with 3 in both conditions (69.38 vs 71.67; 72.26 vs 73.88).
- Multi-LLM (Table 3, Direct / Demo averages): Gemini Pro alone 74.38 / 78.59; CMD with the 3 models 76.93 / 78.66; ReConcile 76.11 / 78.36. With demonstrations, the mixture practically ties with the best model alone.
- Error mechanisms (§5.3, §6.2): judge error (especially in ties) and **wrong-answer propagation** — agents abandon a correct initial answer for a wrong consensus; the authors call it the most common error, without counts. The strongest model pulls the weaker ones along over the rounds (Fig. 5).

## Cost/compute considered?
Only qualitatively: more agents increase input tokens (each one reads more viewpoints), putting pressure on the context; this motivates CMD's group design (Appendix B.1). There is no token count or US$ cost; the small samples are justified by "computational and financial constraints" (§10).

## Threats to validity
- n=100 on ECQA and GSM8K: differences of 1–4 pp are within sampling noise.
- The "strong" single-agent baseline was calibrated by the authors themselves (criticism from lit-stop-overvaluing-mad).
- 2023–24 models, no reasoning models.
- Comparison without matched compute; the single agent uses far fewer calls — which strengthens the cost conclusion, but does not measure it.

## Relevance to the central question
Direct evidence that **part of the multi-agent gain substitutes for information missing from the prompt**: when the context (demonstrations) is good, one agent suffices. For Norevia: before activating a swarm, investing in the single agent's context/prompt may capture the same gain at a fraction of the cost. Mixing models helps mainly when it raises the weak ones to the level of the strong one — it does not clearly outperform the strong one alone.

## Candidate hypotheses
- candidate: the marginal gain of cooperation decreases as the quality of the single agent's context increases (cooperation as a substitute for context).
- candidate: above ~3 agents, homogeneous discussion loses due to noise/error propagation (6 < 3 agents here).
- candidate: in a heterogeneous mixture, the ceiling is the best member; the value lies in saving when the strong one is expensive, not in outperforming the strong one.

## Verification
- Opened on 2026-11-07: https://arxiv.org/abs/2402.18272 (v1 only); https://ar5iv.labs.arxiv.org/html/2402.18272 (full text, tables); https://aclanthology.org/2024.acl-long.331 (venue, pages, DOI).
- The direct PDF could not be read by the tool; tables read on ar5iv (v1). Table 1 (ablation on FOLIO) came out truncated — not cited.
- Gap: error-propagation counts and the values of Fig. 5 are not in the text.
