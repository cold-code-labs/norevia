---
pivot: foundation
pivot_reason: "General evidence on compute allocation, baselines, verification or correlated errors; no defence-specific efficacy follows."
id: lit-adaptive-computation-time
title: 'Adaptive Computation Time (ACT) — learned halting with a ponder cost'
area: literature
evidence: author-reported
tags: [adaptive-computation, halting, cost, conceptual-precursor]
sources:
  - "Graves, A. (2016). Adaptive Computation Time for Recurrent Neural Networks. arXiv:1603.08983v6 (21 Feb 2017). https://arxiv.org/abs/1603.08983v6 · doi:10.48550/arXiv.1603.08983"
related: [lit-adaptive-consistency, lit-early-stopping-sc, lit-s1-budget-forcing]
updated: 2026-11-07
primary_opened: true
version: "v6 (21 Feb 2017); v1 29 Mar 2016; no venue declared on arXiv"
summary: 'Formal precursor of "how much to compute": a network learns when to stop, paying a per-step cost τ, but the behavior is very sensitive to the hand-chosen τ.'
---

## Question
Can a recurrent network learn, per input, how many computation steps to take before emitting its output?

## Method
Per-step sigmoidal halting unit; computation stops when the sum of the halting probabilities reaches 1−ε (ε = 0.01), with a cap M (100; 20 in addition) (Sec. 2, Eqs. 5–13). "Ponder cost" ρ = N(t) + R(t); loss L̂ = L + τ·P (Eq. 12). τ chosen by grid search (i×10⁻ʲ). Synthetic tasks (parity, logic, addition, sorting) and character-level modeling (Wikipedia/Hutter Prize).

## Reported result
- Parity (Sec. 3.1): without ACT, error "almost 40%"; with τ ≤ 0.03, mean error < 5%; pondering grows ~linearly with difficulty (Fig. 6).
- Addition: solved perfectly for all τ in the grid (Sec. 3.3).
- Sorting (Sec. 3.4): error ~12% → ~6%, but with ~9× more computation.
- Wikipedia (Sec. 3.5): error "fairly similar with and without ACT"; the network ponders more at boundaries (spaces, punctuation) (Fig. 23). BPC values only in figures — not checked.
- Central limitation: "quite sensitive to the time penalty parameter", which "has to be hand-chosen" (Sec. 1 and Conclusion).

## Cost/compute considered?
Yes, explicitly in the objective function (τ·ponder). It is a cost in network steps, not in tokens/US$.

## Threats to validity
Small synthetic tasks; 2016 RNNs, not LLMs; real gain on natural data is small; ponder cost is discontinuous (approximate gradient). Analogy, not evidence for LLM swarms.

## Relevance to the central question
Establishes the **formalism** that Norevia seeks at system scale: utility = quality − λ·compute, with learned per-instance halting. It also anticipates the practical problem: the price of compute (τ) determines the behavior and is not discovered on its own. Any Norevia allocation "law" inherits this question (who sets λ?).

## Candidate hypotheses
- candidate: a Norevia effort controller is a system-level ACT — "steps" = rounds/agents; without calibrating λ against real cost, it oscillates between overspending and stopping early.
- candidate: optimal effort concentrates at "boundaries" (hard decision points of the task), not uniformly — analogous to pondering more at word boundaries.

## Verification
Opened on 2026-11-07: https://arxiv.org/abs/1603.08983 (metadata), https://ar5iv.labs.arxiv.org/html/1603.08983 (text). Raw PDF not read as text. Gap: Wikipedia BPC values (figure only).
