---
id: nat-homeostasis-allostasis
title: Homeostasis vs allostasis — correcting error vs anticipating need
area: nature
evidence: author-reported
tags: [predictive-control, budget, effort, adaptive-activation, reserve]
sources:
  - "Sterling, P. (2012). Allostasis: a model of predictive regulation. Physiology & Behavior 106(1):5–15. doi:10.1016/j.physbeh.2011.06.004 (PMID 21684297)"
  - "Cannon, W. B. (1929). Organization for physiological homeostasis. Physiological Reviews 9(3):399–431. doi:10.1152/physrev.1929.9.3.399 (bibliography only)"
related: [nat-reflex-vs-cortex, nat-stellar-thermostat, nat-inactive-reserve, lit-adaptive-computation-time, lit-snell-test-time-compute, nat-candidates]
updated: 2026-11-07
verification: "Abstract of Sterling 2012 read (Europe PMC). Cannon 1929: metadata only (origin of the term homeostasis)."
summary: Sterling argues that feedback correction (homeostasis) is inefficient as the primary form of regulation; regulating well means predicting needs and preparing resources in advance, sharing reserves across systems.
---

## Mechanism
According to the abstract of Sterling (2012), in the form of a theoretical argument:
- Regulatory mechanisms need to be efficient, but homeostasis (error correction by feedback) is **inherently inefficient**; feedback loops are ubiquitous, but they could not be the primary mechanism.
- **Allostasis:** efficient regulation requires **anticipating needs** and preparing to meet them before they arise. Listed advantages: (i) smaller and less frequent errors; (ii) capacities of different components are **matched** — avoiding bottlenecks and reducing safety factors; (iii) resources are **shared between systems**, minimising reserves; (iv) errors are **remembered** and used to reduce future errors.
- The brain tracks many variables, integrates them with prior knowledge to predict needs and set priorities, and imposes flexible trade-offs: "from each organ according to its ability, to each organ according to its need".
- Cannon (1929) is the origin of the term homeostasis (content not checked).

## Evidence
`author-reported` (a conceptual model with physiological examples; not a single measurement).

## Engineering analogue
- **Homeostasis** = reactive escalation: try cheaply, fail, retry with more effort/agents.
- **Allostasis** = predict difficulty **before** executing and allocate effort/N up front; match capacities (do not spawn 5 executors for 1 reviewer); share budget across tasks; log prediction errors in order to recalibrate.
- Norevia's central question — estimating the marginal gain without spending more than is saved — is precisely the cost of the allostatic predictor.

## Testable hypothesis
- **Variable:** policy — (A) reactive (escalation ladder after failure); (B) predictive (a cheap difficulty classifier chooses effort/N beforehand); (C) B + recalibration using past errors.
- **Metric:** cost per acceptance; latency; AUC of the difficulty predictor; cost of the predictor itself.
- **Prediction:** B beats A on cost per acceptance **if and only if** the predictor's AUC is ≥ ~0.75 and the predictor's cost is ≤ 10% of the mean cost per task; C improves the AUC over time.
- **Refutation:** if B beats A even with AUC ~0.5 (the gain would then come from another factor), or fails to beat it with AUC ≥ 0.85.

## Limits of transfer
This is a theoretical argument; Sterling also discusses addiction and hypertension — the extension to those topics is the author's, not validated here. A wrong prediction is costly: allostasis requires memory and a model of the environment, which in LLMs carry a maintenance cost.
