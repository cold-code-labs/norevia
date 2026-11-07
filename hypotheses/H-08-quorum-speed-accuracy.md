---
id: H-08
title: "Quorum trades speed for accuracy, with a ceiling imposed by correlation"
area: hypothesis
evidence: hypothesis
status: testing
origin: "nature (nat-candidates C03; nat-quorum-nest-bees, nat-speed-accuracy-quorum; quorum in Temnothorax/Leptothorax and honeybees) + theory (th-model §7.3)"
experiment: "sims/sim-quorum (proposed) + observatory with quorum stopping Q ∈ {1,2,3,5}"
tags: [quorum, speed-accuracy, optimal-stopping]
sources:
  - "Pratt, S. C. et al. (2002). Quorum sensing, recruitment, and collective decision-making during colony emigration by the ant Leptothorax albipennis. Behav. Ecol. Sociobiol. 52(2):117–127. doi:10.1007/s00265-002-0487-x"
  - "Franks, N. R. et al. (2003). Speed versus accuracy in collective decision making. Proc. R. Soc. B 270(1532):2457–2463. doi:10.1098/rspb.2003.2527"
  - "Passino, K. M. & Seeley, T. D. (2006). Modeling and analysis of nest-site selection by honeybee swarms: the speed and accuracy trade-off. Behav. Ecol. Sociobiol. 59(3):427–442. doi:10.1007/s00265-005-0067-y"
  - "Seeley, T. D. & Visscher, P. K. (2004). Quorum sensing during nest-site selection by honeybee swarms. Behav. Ecol. Sociobiol. 56(6):594–601. doi:10.1007/s00265-004-0814-5"
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, nat-candidates, nat-quorum-nest-bees, nat-speed-accuracy-quorum, nat-stop-signal-cross-inhibition, sim-quorum, H-27, H-01, H-12, lit-adaptive-consistency]
updated: 2026-11-07
summary: "Deciding when Q agents agree works as in ants and honeybees: larger Q is slower and more accurate, but with correlated errors increasing Q stops helping early."
---

# H-08 — Quorum trades speed for accuracy, with a ceiling imposed by correlation

**Status:** `testing` · **Card evidence level:** `hypothesis` · **Origin:** nature (nat-candidates C03; nat-quorum-nest-bees, nat-speed-accuracy-quorum; quorum in Temnothorax/Leptothorax and honeybees) + theory (th-model §7.3)

## Statement
Under the rule "the first answer to get Q votes decides", accuracy and the expected no. of votes grow with Q; under correlation ρ, accuracy saturates at the vote ceiling (H-01) and the optimal Q (with a time cost) is small.

## Variables
Q, p, ρ, cost per vote, latency cost.

## Prediction (quantitative/directional)
- p = 0.65: Q = 1/3/5/12 → accuracy 0.65/0.76/0.83/0.93 with 1/4.0/7.1/18.2 votes (ρ = 0).
- With ρ = 0.2: Q = 12 → 0.74 (vs 0.93) with 16.6 votes — gain from Q = 5 → 12 < 2 pp.
- With a time cost, Q* ∈ {2, 3, 4} for p ∈ [0.6; 0.8] and ρ ≥ 0.1.
- Like the ants that lower the quorum under urgency (`nat-speed-accuracy-quorum`), Q* should fall when the ratio cost-of-error/cost-of-time falls.

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
Accuracy not increasing in Q, or accuracy at high Q above the ceiling predicted by the measured ρ.

## Proposed experiment
Simulation of the race to Q (with optional recruitment, as in Pratt et al.); observatory with quorum stopping over A-low samples.

## Current evidence
Race model (exact formula checked by Monte Carlo). Simulation `sim-quorum` (local-validation in a **different** model, of discovery + recruitment, with post-hoc amendments declared by the simulation agent): the speed–accuracy trade-off appears at a large scale (Q = 1 → 50: ~18% → 96–100%), but 4/4 detailed predictions were not supported — with sequential discovery, tiny quorums are a "discovery lottery" (accuracy non-monotonic in Q ≤ 3) and the gain is convex, not concave; shared bias reduces accuracy (95.9% → 66.4% in one cell), but without the predicted plateau up to Q = 50. Reading: the predictions of this hypothesis hold for the race between candidates **already sampled** (votes from independent samples), not for search with discovery; the scope was narrowed and the status becomes `testing`, with no refutation within the scope of the race. The speed–accuracy trade-off is reported in colonies (Franks et al. 2003; Passino & Seeley 2006) — a natural phenomenon, not proof for LLMs.

## Limits
The race does not model sequential discovery, positive recruitment, continuous option quality or giving up — exactly what sim-quorum shows changes the shape of the curve.
