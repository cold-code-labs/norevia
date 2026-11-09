---
pivot: foundation
pivot_reason: "General evidence on compute allocation, baselines, verification or correlated errors; no defence-specific efficacy follows."
id: lit-debate-routing-matched-ceiling
title: "Statistical Scouting Finds Debate-Safe but Not Debate-Useful Cases (Hu, Shen & Lakshmipathi, 2026) — per-example routing among greedy, voting and debate"
area: literature
evidence: author-reported
tags: [routing, adaptive-activation, debate, vote, entropy, oracle, cost]
sources:
  - "Hu, J., Shen, A. & Lakshmipathi, K. (2026). Statistical Scouting Finds Debate-Safe but Not Debate-Useful Cases: A Matched-Ceiling Study of Open-Weight LLM Reasoning Protocols. arXiv:2605.09618v1 (10 May 2026), technical report/preprint, Amazon Web Services. https://arxiv.org/abs/2605.09618v1"
related: [lit-debate-or-vote, lit-pareto-test-time-multiagent, lit-stop-overvaluing-mad]
updated: 2026-11-07
primary_opened: true
version: "v1 (2026-05-10)"
summary: Choosing the right protocol per example would yield +14 pp on MuSiQue, but cheap signals (vote entropy) recover only 11–19% of that, because 66% of the cases in which debate helps have a unanimous and wrong vote.
---

## Question
Under an equal ceiling of generated tokens, how much gain is there in choosing per example between answering directly, voting or debating — and how much of it is recovered with cheap signals obtained before deliberating?

## Method
- Protocols with a ceiling of 960 generated tokens per example: greedy (1 call, T=0); vote3 (3 calls, T=0.7, 320 tokens each); critique-revision debate with 2 agents, 3 rounds + moderator (7 calls).
- Models: Llama 3.1 8B Instruct and Ministral 3 8B Instruct (Amazon Bedrock).
- Data: MuSiQue-Ans v1.0 (N=300; token F1 ≥ 0.5 = correct), GSM8K (N=150).
- Controllers: vote-entropy threshold (H > 1.0 → escalate to debate), logistic regression and gradient-boosted trees over entropy, margin, question length and context length; stratified 5-fold CV; paired bootstrap with 10,000 resamples.

## Reported result
Table 1 (accuracy; oracle = any protocol correct):

| Data | Model | Greedy | Vote3 | Debate | Oracle | Gap |
|---|---|---|---|---|---|---|
| MuSiQue | Llama 8B | 39.7 | 40.3 | 43.7 | 57.7 | +14.0 |
| MuSiQue | Ministral 8B | 48.3 | 49.0 | 47.0 | 62.7 | +13.7 |
| GSM8K | Llama 8B | 81.3 | 83.3 | 60.7 | 90.7 | +7.3 |
| GSM8K | Ministral 8B | 90.7 | 74.7 | 79.3 | 95.3 | +4.7 |

- The best fixed protocol changes in each of the 4 cells; none is a safe default.
- Debate on Llama/MuSiQue: it alone is correct in 13.7% and spoils a correct vote answer in 12.3% — they almost cancel out (Section 4.2). On Ministral, it spoils more than it helps (15.7% vs 7.0%). On GSM8K, almost no exclusive wins.
- 66.7% of debates (Llama/MuSiQue) have a position change; many changes are right→wrong.
- Entropy strata (Table 2, Llama): unanimous (H=0) helps 13.4% / hurts 14.2%; split helps 14.1% / hurts 17.2%; 3-way (H>1) helps 21.6% / hurts 2.7% (net +14). Ministral: same direction, weaker (H>1: hurts 9.7%, net +5).
- Controllers (Table 4, MuSiQue): entropy threshold +1.3 pp (Llama) and +1.7 pp (Ministral) over the best fixed protocol, recovering 11% and 19% of the 2-way oracle gap (+12.3 and +9.0 pp); individual CIs include zero; meta-analysis +1.6 pp (p=0.125). Learned controllers do not beat the threshold (GBT negative on Llama, attributed to overfitting).
- 66% of the examples in which debate helps occur with a **unanimous and wrong vote** — invisible to disagreement signals.
- A 1-prompt self-critique probe on Llama changes the answer in 127/127 unanimous cases (zero information; may be a prompt-format artifact, as the authors admit).
- Tokens: wrong debates consume more tokens than correct ones (median 547 vs 475).

## Cost/compute considered?
Yes, as a ceiling on generated tokens (prompt does not count). The authors stress that **the ceiling is not a budget**: on MuSiQue voting spends a median of 26–117 tokens and debate 422–518 — any gain from debate is confounded by its using more tokens.

## Threats to validity
- Small samples (300/150), two 8B models; the harm "collapse" at H>1 on Llama rests on 2 cases.
- Anomaly flagged by the authors: Ministral's vote3 on GSM8K is 16 pp below greedy (temperature not recalibrated).
- Technical report/preprint (14 pages), not peer-reviewed; authors from a cloud provider (Bedrock), no declared conflict assessed by us.

## Relevance to the central question
Directly measures Norevia's problem — **adaptive activation**: there is a lot of latent gain in choosing the protocol per example (+14 pp), but cheap uncertainty signals only tell when cooperation is **safe**, not when it is **necessary**. Correlated error (all samples agree on the error) is exactly the case cooperation should solve and that entropy cannot see. This points to the need for external signals (verifier, test, tool) instead of internal agreement.

## Candidate hypotheses
- candidate: disagreement between samples predicts low risk from cooperation, not high benefit; the benefit concentrates in correlated (unanimous) errors.
- candidate: the ceiling of a per-example router is large (≈+14 pp), but recovering it requires verification signals, not consensus signals.
- candidate: more tokens spent in a debate indicate a higher chance of error (stopping/escalation signal).

## Verification
- Opened on 2026-11-07: https://arxiv.org/abs/2605.09618 (only v1; comments; CC BY 4.0 license); v1 PDF downloaded and extracted locally (Sections 1–5, Tables 1–4).
- Gap: Sections 6+ (discussion of token confounding, Appendix B) not read in full; cited works on "selective debate"/DOWN not verified.
