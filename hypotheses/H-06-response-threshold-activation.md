---
id: H-06
title: "Response-threshold activation (social insects) reduces agents without losing acceptance"
area: hypothesis
evidence: hypothesis
status: testing
origin: "nature (nat-candidates C04; nat-response-threshold; Bonabeau et al. 1996) + theory (th-model §8)"
experiment: "sims/sim-response-threshold (proposed) + variant of observatory C-elastic with stimulus = visible-test failure and/or disagreement between the first 2 samples (see H-18)"
tags: [division-of-labor, adaptive-swarm-activation, response-threshold]
sources:
  - "Bonabeau, E., Theraulaz, G. & Deneubourg, J.-L. (1996). Proc. R. Soc. B 263(1376):1565–1569. doi:10.1098/rspb.1996.0229"
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, nat-response-threshold, nat-candidates, nat-reflex-vs-cortex, sim-response-threshold, nat-inactive-reserve, H-05, H-16, H-18, lit-snell-test-time-compute, lit-routellm, lit-debate-routing-matched-ceiling]
updated: 2026-11-07
summary: "Like workers with different thresholds, extra agents only join when the stimulus (task uncertainty) passes their threshold — a \"hi\" activates no one, an ambiguous task activates several."
---

# H-06 — Response-threshold activation (social insects) reduces agents without losing acceptance

**Status:** `testing` · **Card evidence level:** `hypothesis` · **Origin:** nature (nat-candidates C04; nat-response-threshold; Bonabeau et al. 1996) + theory (th-model §8)

## Statement
With staggered thresholds θ_i and stimulus s = estimated uncertainty (e.g. disagreement between the first 2 answers, or verifier failure), the number of active agents Σ T_{θ_i}(s) tracks difficulty; on mixtures with ≥ 50% easy tasks, this reduces agents per task by ≥ 40% vs fixed N = 5, with an acceptance loss ≤ 2 pp.

## Variables
s (stimulus), θ_i, n (exponent; 2 in the original model), difficulty mixture.

## Prediction (quantitative/directional)
- Expected active agents (θ = 0.1…0.9; n = 2): s = 0.05 → 0.3; s = 0.3 → 2.5; s = 0.9 → 4.7.
- Positive correlation between activated agents and actual difficulty (A-low error rate on the task).
- The ≥ 40% and ≤ 2 pp thresholds are **proposed criteria**, not derived.
- nat-C04 condition: the gain only appears if the stimulus predicts difficulty (AUC ≥ ~0.75) and costs ≤ 10% of the average task; with stimulus = disagreement, the AUC is limited by unanimous errors (H-18).

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
Savings < 20% or acceptance loss > 2 pp; or a stimulus uncorrelated with difficulty (then the mechanism does not discriminate).

## Proposed experiment
Simulation: abstract agents with p per task, noisy stimulus, comparison with fixed N and with the elastic policy of H-05. Observatory: C-elastic with a threshold rule.

## Current evidence
Simulation `sim-response-threshold` (local-validation in the queue model with stimulus = backlog, preregistered; P1–P5 supported): thresholds without messages come close to a perfect central dispatcher (latency 1.46 vs 1.34 steps) with ~22% more active agents, use fewer agents than fixed roles sized for the peak, and beat the dispatcher when messages are costly or delayed. This supports the **mechanism**, not the specific prediction for LLMs (stimulus = uncertainty, ≥ 40% fewer agents, ≤ 2 pp) — status `testing`. The threshold model is a described natural phenomenon (Bonabeau et al. 1996); the analogy does not demonstrate effectiveness in LLMs.

## Limits
An insect's threshold responds to a physical stimulus; here the stimulus is an estimate that costs calls. If the stimulus is only disagreement, it cannot see unanimous errors (H-18; `lit-debate-routing-matched-ceiling`): also use test/verifier failure as a stimulus.
