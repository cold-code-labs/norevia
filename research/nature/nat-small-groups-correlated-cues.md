---
id: nat-small-groups-correlated-cues
title: With correlated cues, collective accuracy is maximized in small groups
area: nature
realm: seen
evidence: author-reported
tags: [optimal-size, correlation, wisdom-of-crowds, when-to-stop-expanding, micro-swarm]
sources:
  - "Kao, A. B. & Couzin, I. D. (2014). Decision accuracy in complex environments is often maximized by small group sizes. Proc. R. Soc. B 281:20133305. doi:10.1098/rspb.2013.3305 (PMC4043084)"
related: [nat-condorcet-correlated, nat-informed-leaders, lit-correlated-errors, lit-great-models-think-alike, lit-more-agents, sim-correlated-vote, nat-candidates]
updated: 2026-11-07
verification: "Full text extracted from PDF (copy at blogs.umb.edu/collectivelab). The '5 to 20' range appears only in press material and was NOT used."
summary: When part of the information is shared by all (correlated), the "wisdom of crowds" appears only in a minority of environments; in general there is a finite, small group size (> 1) that maximizes accuracy.
---

## Mechanism
- **Two-cue model:** one **low-correlation** cue (sampled independently, reliability r_L) and one **high-correlation** cue (seen by all, reliability r_H). Each individual uses the low-correlation cue with probability p and votes according to the cue used.
- **Condition for the wisdom of crowds:** the expected fraction of the group that receives correct, low-correlation information must exceed 1/2, that is, **p·r_L > 1/2 ⇔ p > 1/(2r_L)**. Otherwise, the decision of a large group is **dictated by the correlated cue** — even if only a minority uses it.
- **Central result (text):** in the regime p < 1/(2r_L) there is a **finite optimal group size**, which **tends to be moderately small, but greater than 1**. It is the **noise inherent in small groups** that allows escaping highly correlated information while retaining part of the benefit of aggregation. The classical wisdom of crowds (accuracy increasing monotonically with N) appears **only in a minority** of environments.
- The authors also consider environments with spatial/temporal correlation in the same cue, with a qualitatively similar conclusion (details not extracted).

## Evidence
`author-reported` (theoretical models; not an experiment with animals).

## Engineering analogue
For LLM swarms, the "high-correlation cue" is the shared knowledge/bias of the same base model (or of models trained on similar data); the "low-correlation" cue is the evidence each agent collects independently (a different tool, file, test). Direct translation of the condition: **expanding only helps if the fraction of agents that bring independent, correct evidence is > 1/2**; otherwise, there is a small N* and stopping expansion is the right move. This is a strong candidate to explain the micro → macro-swarm transition.

## Testable hypothesis
- **Variable:** N ∈ {1, 2, 3, 5, 7, 11, 21} × fraction of agents with access to independent evidence (q ∈ {0, 0.25, 0.5, 0.75}) on tasks with a verifiable answer.
- **Metric:** majority-vote accuracy; argmax_N of accuracy (N*); cost.
- **Prediction:** with q·acc_evid < 1/2, the accuracy(N) curve has an interior maximum at N* ∈ [3, 7] and falls thereafter; with q·acc_evid > 1/2, it grows monotonically until it saturates. The observed boundary lies within ± 0.1 of that predicted by 1/(2r_L).
- **Refutation:** if accuracy is monotonic in N under all conditions, or if N* does not move with q.

## Limits of transfer
The model assumes binary votes and cues with fixed, known reliability; in LLMs, "correlated" and "independent" cues are mixed within each agent. The small optimum comes from **noise** — in LLMs temperature provides noise, but not necessarily useful independence.
