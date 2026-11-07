---
id: H-05
title: "Expanding by marginal gain beats fixed size in cost per success"
area: hypothesis
evidence: hypothesis
status: testing
origin: "theory (th-model §7.1, §7.4) + literature (lit-adaptive-consistency, lit-early-stopping-sc, lit-frugalgpt; lit-synthesis candidate 5: cascade) + nature (nat-interaction-rate-foraging: spawn by the acceptance rate)"
experiment: "observatory C-elastic vs B-vote5 / fixed best-of-N; difficulty-mixture sims"
tags: [elastic-swarm, optimal-stopping, cost-per-success]
sources:
  - "Chow, Y. S. & Robbins, H. (1963). On optimal stopping rules. Z. Wahrscheinlichkeitstheorie 2(1):33–49. doi:10.1007/BF00535296"
  - "Wald, A. (1945). Sequential Tests of Statistical Hypotheses. Ann. Math. Statist. 16(2):117–186. doi:10.1214/aoms/1177731118"
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, lit-adaptive-consistency, lit-early-stopping-sc, lit-frugalgpt, lit-routellm, lit-sas-vs-mas-hybrid, lit-snell-test-time-compute, nat-interaction-rate-foraging, nat-clonal-expansion-contraction, sim-elastic, sim-clonal, lit-synthesis, H-12, H-06, H-21]
updated: 2026-11-07
summary: "Adding agents only while the expected gain exceeds the marginal cost (and stopping at the first accepted result) spends much less per success than a fixed-size swarm, with the same success."
---

# H-05 — Expanding by marginal gain beats fixed size in cost per success

**Status:** `testing` · **Card evidence level:** `hypothesis` · **Origin:** theory (th-model §7.1, §7.4) + literature (lit-adaptive-consistency, lit-early-stopping-sc, lit-frugalgpt; lit-synthesis candidate 5: cascade) + nature (nat-interaction-rate-foraging: spawn by the acceptance rate)

## Statement
A policy that expands while E[ΔP_true]·V − E[ΔP_false]·L > Δcost (and stops at the first verified acceptance) has the same P_true as fixed best-of-N with the same cap and a lower cost per success; the savings grow with the fraction of easy tasks and with the cap N.

## Variables
difficulty mixture {w_j, p_j}, s, f, cap N, cost per call, latency.

## Prediction (quantitative/directional)
- Mixture 50% p = 0.9 / 30% p = 0.5 / 20% p = 0.15, s = 0.9, f = 0.05: ratio of cost per success fixed/elastic = 1.41 (N = 2), 1.82 (N = 3), 2.21 (N = 4), 3.75 (N = 8).
- Acceptance of elastic ≥ acceptance of fixed − 1 pp; latency of elastic higher (sequential rounds).
- P_false of elastic grows with the cap N (0.019 → 0.057 from N = 1 to 8) — the cap should come from H-02/H-13.

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
Net utility of elastic lower than that of the best fixed N (95% CI), or cost per success higher than that of a fixed configuration with equal acceptance (± 1 pp), or an acceptance drop > 2 pp.

## Proposed experiment
Observatory: C-elastic vs B-vote5 and vs fixed parallel best-of-N on the same set (easy a* + hard b*); measure cost per accepted task, latency and false success.

## Current evidence
Model (exact; test §7.3). Simulation `sim-elastic` (local-validation in the model, preregistered): P2 supported — the elastic rule ties or beats the best fixed N in net utility at every V (V = 20: 14.9 vs 12.8), accepting 93% with 2.3 agents on average; P1 **not supported** — in cost per accepted task, the single agent "wins" by giving up on the hard tasks (the metric paradox of th-model §2.3). Therefore the primary metric of this hypothesis becomes net utility or cost per success **at equal acceptance**; status `testing`. Literature (author-reported): adaptive stopping reduces samples ~3.2× (`lit-adaptive-consistency`) and 67–80% on easy tasks (`lit-early-stopping-sc`); a cascade single agent → MAS only on failure spends ~88% fewer tokens on GSM8K (`lit-sas-vs-mas-hybrid`). The card `nat-interaction-rate-foraging` (natural phenomenon) suggests the variant "spawn proportional to the recent acceptance rate" — included as an arm of the experiment.

## Limits
Estimating the marginal gain has a cost; if the estimator costs more than it saves, the advantage disappears (H-16).
