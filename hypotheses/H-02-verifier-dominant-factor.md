---
id: H-02
title: "Verifier quality dominates the gain from best-of-N"
area: hypothesis
evidence: hypothesis
status: preliminary-support
origin: "theory (th-model §3) + literature (lit-large-language-monkeys; Stroebl et al.; lit-mast; lit-synthesis candidate 2)"
experiment: "sims/sim-verifier (done, in the model) + observatory A-low-loop/C-elastic with verifier = visible tests, acceptance = hidden tests"
tags: [verification, best-of-n, verifiable-acceptance]
sources:
  - "Brown, B. et al. (2024). Large Language Monkeys. arXiv:2407.21787v3"
  - "Stroebl, B., Kapoor, S. & Narayanan, A. The Limits of Inference Scaling Through Resampling. arXiv:2411.17501v3"
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, sim-verifier, lit-large-language-monkeys, lit-nothinking, lit-mast, lit-frugalgpt, lit-synthesis, H-13, H-09]
updated: 2026-11-07
summary: "In best-of-N, the maximum attainable success is the verifier's precision π = ps/(ps+(1−p)f); therefore improving the verifier yields more than increasing N, and one strong generator beats many weak ones with the same verifier."
---

# H-02 — Verifier quality dominates the gain from best-of-N

**Status:** `preliminary-support` · **Card evidence level:** `hypothesis` · **Origin:** theory (th-model §3) + literature (lit-large-language-monkeys; Stroebl et al.; lit-mast; lit-synthesis candidate 2)

## Statement
In generation + verification, P_true(N) = π(1 − r^N) with π = ps/(ps + (1−p)f) independent of N. The variation in success between configurations is explained more by (s, f) than by N, and with f > 0 and low p, 1 agent with higher effort (high p, high π) outperforms N weak agents.

## Variables
s (sensitivity), f (false acceptance = 1 − specificity), p, N, ρ.

## Prediction (quantitative/directional)
- P_true saturates at π: p = 0.1, s = 0.9 → π = 0.909 (f = 0.01), 0.667 (f = 0.05), 0.333 (f = 0.2).
- In a factorial grid (N × verifier quality), the fraction of P_true variance attributable to the verifier > the fraction attributable to N.
- With the same verifier (f = 0.05), a generator with p = 0.6 has π = 0.964 vs π = 0.667 for p = 0.1 — the strong one wins in reliability even with lower coverage.

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
P_true keeps rising with N above the estimated π (95% CI), or N explains more variance than (s, f) in the factorial grid.

## Proposed experiment
Observatory: measure the verifier's s and f (visible tests) against actual acceptance (hidden tests) per task; vary N (1, 2, 4, 8) and the verifier (full vs reduced visible tests vs LLM judge). Simulation: `sims/sim-verifier`.

## Current evidence
Simulation `sim-verifier` (local-validation in the model, preregistered): with sens = spec = 0.95, false success falls from 35% (vote) to 5% at ~1/5 of the cost per success; a weak verifier (spec = 0.5) is worse than the vote (P4 supported). P1 failed in 3/120 comparisons (ρ = 0.6, N ≥ 17: the single high-effort agent had less false success), which is **compatible** with §3.3 of the model (correlation knocks down the precision of the accepted). Literature (author-reported): on MATH, coverage 98.44% with 10,000 samples vs ~41% selected by vote/RM; on SWE-bench Lite, 15.9% → 56% with 250 samples because the tests verify (`lit-large-language-monkeys`); short parallel + verifier matches long reasoning with lower latency (`lit-nothinking`). No local LLM measurement.

## Limits
s and f treated as constants; in LLMs they depend on the task and may share blind spots with the generator.
