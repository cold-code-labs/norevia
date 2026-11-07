---
id: H-26
title: "A small idle reserve of agents greatly reduces latency under bursts near saturation"
area: hypothesis
evidence: hypothesis
status: open
origin: "nature (nat-inactive-reserve — Charbonneau et al. 2017; Hasegawa et al. 2016) + theory (th-model §11; M/M/c queues, Kleinrock 1975)"
experiment: "queue sims with bursts and injected failures; observatory only in an isolated environment (no production)"
tags: [capacity, reserve, latency, resilience]
sources:
  - "Kleinrock, L. (1975). Queueing Systems, Volume 1: Theory. New York: Wiley."
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, nat-inactive-reserve, nat-candidates, H-11, H-06]
updated: 2026-11-07
summary: "\"Lazy\" ants work as a reserve that replaces the active ones; in a task queue, a few idle reserve agents cut waiting time sharply when the load approaches capacity."
---

# H-26 — A small idle reserve of agents greatly reduces latency under bursts near saturation

**Status:** `open` · **Card evidence level:** `hypothesis` · **Origin:** nature (nat-inactive-reserve — Charbonneau et al. 2017; Hasegawa et al. 2016) + theory (th-model §11; M/M/c queues, Kleinrock 1975)

## Statement
With arrivals λ and capacity μ per agent, the mean wait W_q = C(c, λ/μ)/(cμ − λ) (Erlang C) is strongly nonlinear near λ/μ → c; keeping a reserve r of idle agents (idleness cost) reduces p95 latency under bursts more than the idleness cost, when mean utilization > ~0.8.

## Variables
c (active), r (reserve), λ (load and bursts), μ, failure rate.

## Prediction (quantitative/directional)
- μ = 1: load 3.6 → W_q = 1.97 (c = 4), 0.29 (c = 5), 0.08 (c = 6).
- Load burst of 4.5: c = 4 unstable; c = 5 → 1.53; c = 6 → 0.28.
- With mean utilization < 0.5 the reserve does not pay off (cost only).

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
p95 latency insensitive to the reserve at utilization > 0.8; or an equal gain at utilization < 0.5.

## Proposed experiment
Queue simulation with bursts and stuck agents; measure p95 latency, abandoned tasks and idleness cost.

## Current evidence
Model only (Erlang C checked on known cases). Natural phenomenon in the nat-* cards (analogy).

## Limits
Poisson arrivals and exponential service; real bursts and heavy-tailed service times make waiting worse.
